import "dotenv/config";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

type QuestionData = {
  questionText: string;
  options: string[];
  correctAnswer: string;
  hint: string | null;
  explanation: string | null;
};

type ImportFile = {
  file: string;
  platform: { name: string; slug: string };
  certification: { title: string; slug: string };
  questions: QuestionData[];
};

// Keep existing URLs when importing the exam-code directories in this project.
const certificationAliases: Record<string, { title: string; slug: string }> = {
  "aws-cloud-practitioner-clf-c02": { title: "Cloud Practitioner", slug: "cloud-practitioner" },
  "azure-fundamentals-az-900": { title: "AZ-900 Fundamentals", slug: "az-900-fundamentals" },
};

function slugify(value: string) {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug) throw new Error(`Cannot create a slug from "${value}".`);
  return slug;
}

async function jsonFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await jsonFiles(location));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) files.push(location);
  }
  return files;
}

function parseQuestion(value: unknown, location: string): QuestionData {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${location}: expected a question object.`);
  }
  const item = value as Record<string, unknown>;
  if (typeof item.questionText !== "string" || !item.questionText.trim()) {
    throw new Error(`${location}: questionText must be a non-empty string.`);
  }
  if (!Array.isArray(item.options) || item.options.length !== 4 ||
      !item.options.every((option) => typeof option === "string" && option.trim()) ||
      new Set(item.options).size !== 4) {
    throw new Error(`${location}: options must contain four distinct, non-empty strings.`);
  }
  if (typeof item.correctAnswer !== "string" || !item.options.includes(item.correctAnswer)) {
    throw new Error(`${location}: correctAnswer must exactly match one of the options.`);
  }
  for (const field of ["hint", "explanation"] as const) {
    if (item[field] !== undefined && item[field] !== null && typeof item[field] !== "string") {
      throw new Error(`${location}: ${field} must be a string or null.`);
    }
  }
  return {
    questionText: item.questionText.trim(),
    options: item.options as string[],
    correctAnswer: item.correctAnswer,
    hint: typeof item.hint === "string" ? item.hint : null,
    explanation: typeof item.explanation === "string" ? item.explanation : null,
  };
}

async function loadFiles(): Promise<ImportFile[]> {
  const prismaDirectory = path.resolve(__dirname);
  // Match both the requested "data" name and the existing "Data" on Linux too.
  const roots = (await readdir(prismaDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name.toLowerCase() === "data");
  if (roots.length !== 1) throw new Error("Expected exactly one prisma/data (or prisma/Data) directory.");
  const root = path.join(prismaDirectory, roots[0].name);
  const files = await jsonFiles(root);
  if (!files.length) throw new Error(`No JSON files found under ${root}.`);
  console.log(`Found ${files.length} JSON files under prisma/${roots[0].name}.`);

  const imports: ImportFile[] = [];
  const seen = new Set<string>();
  for (const file of files) {
    const relative = path.relative(root, file);
    const parts = relative.split(path.sep);
    if (parts.length < 3) {
      throw new Error(`${relative}: expected <Platform>/<Certification>/<file>.json.`);
    }
    const platform = { name: parts[0].replace(/_/g, " "), slug: slugify(parts[0]) };
    const certificationSlug = slugify(parts[1]);
    const certification = certificationAliases[certificationSlug] ?? {
      title: parts[1].replace(/_/g, " "), slug: certificationSlug,
    };
    let content: unknown;
    try {
      content = JSON.parse((await readFile(file, "utf8")).replace(/^\uFEFF/, ""));
    } catch {
      throw new Error(`${relative}: could not read a valid JSON document.`);
    }
    if (!Array.isArray(content) || !content.length) {
      throw new Error(`${relative}: expected a non-empty JSON array of questions.`);
    }
    const questions = content.map((item, index) => parseQuestion(item, `${relative}, question ${index + 1}`));
    for (const question of questions) {
      const key = `${certification.slug}\0${question.questionText}`;
      if (seen.has(key)) throw new Error(`${relative}: duplicate question for ${certification.slug}: ${question.questionText}`);
      seen.add(key);
    }
    imports.push({ file: relative, platform, certification, questions });
    console.log(`Validated ${relative}: ${questions.length} questions → ${platform.name} / ${certification.title}.`);
  }
  return imports;
}

async function main() {
  // Validate every file before writing anything, including in validation-only mode.
  const imports = await loadFiles();
  const questionCount = imports.reduce((sum, item) => sum + item.questions.length, 0);
  if (process.argv.includes("--validate-only")) {
    console.log(`Validation complete: ${imports.length} files, ${questionCount} questions. No database changes.`);
    return;
  }

  const prisma = new PrismaClient();
  try {
    for (const [index, item] of imports.entries()) {
      console.log(`[${index + 1}/${imports.length}] Importing ${item.file}...`);
      // Each file commits as a unit; rerunning safely resumes after a failed file.
      await prisma.$transaction(async (tx) => {
        const platform = await tx.platform.upsert({
          where: { slug: item.platform.slug },
          update: item.platform,
          create: item.platform,
        });
        const certificationData = { ...item.certification, platformId: platform.id };
        const certification = await tx.certification.upsert({
          where: { slug: item.certification.slug },
          update: certificationData,
          create: certificationData,
        });
        console.log(`  Platform: ${platform.name}; certification: ${certification.title}.`);
        // Reuse older seeded records when their text matches, even if IDs differ.
        const existing = await tx.question.findMany({
          where: { certificationId: certification.id },
          select: { id: true, questionText: true },
          orderBy: { id: "asc" },
        });
        const idsByText = new Map(existing.map((question) => [question.questionText, question.id]));
        for (const [questionIndex, question] of item.questions.entries()) {
          const id = idsByText.get(question.questionText) ?? `import-${createHash("sha256")
            .update(`${certification.slug}\0${question.questionText}`).digest("hex")}`;
          const data = { ...question, certificationId: certification.id };
          await tx.question.upsert({ where: { id }, update: data, create: { id, ...data } });
          if ((questionIndex + 1) % 25 === 0 || questionIndex === item.questions.length - 1) {
            console.log(`  Processed ${questionIndex + 1}/${item.questions.length} questions (pending commit).`);
          }
        }
      }, { maxWait: 15_000, timeout: 180_000 });
      console.log(`  Committed ${item.questions.length} questions from ${item.file}.`);
    }
    console.log(`Seed complete: ${new Set(imports.map((item) => item.platform.slug)).size} platforms, ${new Set(imports.map((item) => item.certification.slug)).size} certifications, ${questionCount} questions upserted from ${imports.length} files.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
