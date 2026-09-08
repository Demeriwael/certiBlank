import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { validateBank, type Bank } from "../lib/exam-contract";
async function files(directory: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(location));
    else if (entry.name.toLowerCase().endsWith(".json")) result.push(location);
  }
  return result.sort();
}
async function main() {
  const roots = (await readdir(__dirname)).filter(name => name.toLowerCase() === "data");
  if (roots.length !== 1) throw new Error("Expected one prisma/data directory");
  const imports: { file: string; bank: Bank }[] = [];
  const ids = new Set<string>(); const slugs = new Set<string>();
  for (const file of await files(path.join(__dirname, roots[0]))) {
    const data = JSON.parse((await readFile(file, "utf8")).replace(/^\uFEFF/, ""));
    if (Array.isArray(data)) { console.log(`Skipped legacy file: ${path.basename(file)}. Supply schemaVersion 2 to enable exam modes.`); continue; }
    const bank = validateBank(data);
    if (slugs.has(bank.certification.slug)) throw new Error(`Duplicate certification: ${bank.certification.slug}`);
    slugs.add(bank.certification.slug);
    for (const q of bank.questions) { if (ids.has(q.id)) throw new Error(`Duplicate question ID: ${q.id}`); ids.add(q.id); }
    imports.push({ file, bank }); console.log(`Validated ${path.basename(file)}: ${bank.questions.length} questions`);
  }
  if (!imports.length) throw new Error("No version 2 question banks found");
  if (process.argv.includes("--validate-only")) { console.log(`Validation complete: ${ids.size} questions. No database changes.`); return; }
  const prisma = new PrismaClient();
  try {
    for (const { file, bank } of imports) {
      console.log(`Importing ${path.basename(file)}…`);
      await prisma.$transaction(async tx => {
        const platform = await tx.platform.upsert({ where: { slug: bank.platform.slug }, create: bank.platform, update: bank.platform });
        const { mockExam, domains, ...metadata } = bank.certification;
        const data = { ...metadata, platformId: platform.id, examConfig: mockExam, domains };
        const cert = await tx.certification.upsert({ where: { slug: metadata.slug }, create: data, update: data });
        for (const [index, q] of bank.questions.entries()) {
          const { id, options, ...fields } = q;
          const existing = await tx.question.findUnique({ where: { id }, select: { certificationId: true } });
          if (existing && existing.certificationId !== cert.id) throw new Error(`Question ID belongs to another certification: ${id}`);
          const record = { ...fields, schemaVersion: 2, certificationId: cert.id, optionItems: options, options: options.map(o => o.text), correctAnswer: options.filter(o => q.correctOptionIds.includes(o.id)).map(o => o.text).join("; "), explanation: q.correctExplanation };
          await tx.question.upsert({ where: { id }, create: { id, ...record }, update: record });
          if ((index + 1) % 25 === 0) console.log(`  ${index + 1}/${bank.questions.length} upserted (pending commit)`);
        }
        await tx.question.updateMany({ where: { certificationId: cert.id, schemaVersion: 2, id: { notIn: bank.questions.map(q => q.id) } }, data: { schemaVersion: 1 } });
      }, { timeout: 240000, maxWait: 15000 });
      console.log(`Committed ${bank.questions.length} questions.`);
    }
    console.log(`Seed complete: ${imports.length} certifications and ${ids.size} questions upserted.`);
  } finally { await prisma.$disconnect(); }
}
main().catch(error => { console.error("Seed failed:", error); process.exitCode = 1; });
