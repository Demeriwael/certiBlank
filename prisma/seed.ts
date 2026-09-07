import "dotenv/config";
import { PrismaClient } from "@prisma/client";

type SampleQuestion = {
  key: string;
  questionText: string;
  options: [string, string, string, string];
  correctAnswer: string;
  hint: string;
};

type SamplePlatform = {
  name: string;
  slug: string;
  certification: {
    title: string;
    slug: string;
    questions: SampleQuestion[];
  };
};

// Original practice questions, not official exam content.
// OpenAI's "Certified Developer" is a fictional certification for test data.
const platforms: SamplePlatform[] = [
  {
    name: "AWS",
    slug: "aws",
    certification: {
      title: "Cloud Practitioner",
      slug: "cloud-practitioner",
      questions: [
        {
          key: "object-storage",
          questionText: "Which AWS service provides object storage for files such as images and backups?",
          options: ["Amazon EC2", "Amazon S3", "Amazon RDS", "Amazon Route 53"],
          correctAnswer: "Amazon S3",
          hint: "Look for the service that stores objects in buckets.",
        },
        {
          key: "virtual-servers",
          questionText: "Which AWS service lets you run virtual servers called instances?",
          options: ["Amazon S3", "Amazon CloudFront", "Amazon EC2", "Amazon SNS"],
          correctAnswer: "Amazon EC2",
          hint: "Its name includes Elastic Compute Cloud.",
        },
        {
          key: "least-privilege",
          questionText: "What does the principle of least privilege mean when assigning AWS permissions?",
          options: ["Give every user administrator access", "Share the root account", "Disable all authentication", "Grant only the permissions needed for a task"],
          correctAnswer: "Grant only the permissions needed for a task",
          hint: "Keep access limited to the work the identity must perform.",
        },
        {
          key: "managed-relational-database",
          questionText: "Which AWS service helps manage relational databases such as PostgreSQL?",
          options: ["Amazon RDS", "Amazon Route 53", "Amazon CloudFront", "Amazon S3"],
          correctAnswer: "Amazon RDS",
          hint: "The abbreviation stands for Relational Database Service.",
        },
        {
          key: "multiple-zones",
          questionText: "Why deploy an application across multiple Availability Zones?",
          options: ["To eliminate the need for passwords", "To improve availability if one zone fails", "To guarantee zero cost", "To replace all backups"],
          correctAnswer: "To improve availability if one zone fails",
          hint: "Consider what happens when one deployment location becomes unavailable.",
        },
      ],
    },
  },
  {
    name: "Azure",
    slug: "azure",
    certification: {
      title: "AZ-900 Fundamentals",
      slug: "az-900-fundamentals",
      questions: [
        {
          key: "resource-group",
          questionText: "What is the purpose of an Azure resource group?",
          options: ["Store only passwords", "Replace a subscription", "Organize related Azure resources", "Provide a physical keyboard"],
          correctAnswer: "Organize related Azure resources",
          hint: "Think of a logical container for resources managed together.",
        },
        {
          key: "blob-storage",
          questionText: "Which Azure service stores unstructured objects such as images and videos?",
          options: ["Azure Virtual Machines", "Azure DNS", "Azure SQL Database", "Azure Blob Storage"],
          correctAnswer: "Azure Blob Storage",
          hint: "A blob can hold unstructured binary or text data.",
        },
        {
          key: "iaas",
          questionText: "Which cloud service model gives you virtual machines while you manage their operating systems?",
          options: ["Infrastructure as a Service (IaaS)", "Software as a Service (SaaS)", "A fully managed email application", "A finished web-based spreadsheet"],
          correctAnswer: "Infrastructure as a Service (IaaS)",
          hint: "The provider supplies infrastructure; you manage the software installed on it.",
        },
        {
          key: "scaling-out",
          questionText: "What does scaling out an application mean?",
          options: ["Increasing one server's memory", "Adding more instances to handle demand", "Deleting every instance", "Moving all data to a laptop"],
          correctAnswer: "Adding more instances to handle demand",
          hint: "Horizontal scaling increases the number of instances.",
        },
        {
          key: "hybrid-cloud",
          questionText: "Which scenario describes a hybrid cloud?",
          options: ["Using only a home computer", "Using only public cloud resources", "Connecting on-premises infrastructure with public cloud resources", "Removing all network connectivity"],
          correctAnswer: "Connecting on-premises infrastructure with public cloud resources",
          hint: "Hybrid combines infrastructure in different environments.",
        },
      ],
    },
  },
  {
    name: "OpenAI",
    slug: "openai",
    certification: {
      title: "Certified Developer",
      slug: "certified-developer",
      questions: [
        {
          key: "api-key-storage",
          questionText: "Where should a web application keep its OpenAI API key?",
          options: ["In a public Git repository", "In browser JavaScript", "In a public image", "In a server-side secret or environment variable"],
          correctAnswer: "In a server-side secret or environment variable",
          hint: "The browser should never receive your private API key.",
        },
        {
          key: "clear-instructions",
          questionText: "Which prompt is most likely to communicate a summarization task clearly?",
          options: ["Summarize the following text in three bullet points for a beginner", "Do something", "Here", "Ignore the text and guess"],
          correctAnswer: "Summarize the following text in three bullet points for a beginner",
          hint: "Specify the task, audience, and desired output format.",
        },
        {
          key: "output-validation",
          questionText: "What should an application do before relying on model-generated data for an important operation?",
          options: ["Assume every answer is correct", "Validate the output against the application's requirements", "Disable error handling", "Publish it without checking"],
          correctAnswer: "Validate the output against the application's requirements",
          hint: "Model output can contain errors or unsuitable values.",
        },
        {
          key: "embeddings",
          questionText: "What is a common use of text embeddings?",
          options: ["Encrypting passwords", "Compressing video files", "Finding text with similar meaning", "Replacing network authentication"],
          correctAnswer: "Finding text with similar meaning",
          hint: "Embeddings represent text numerically so semantic similarity can be compared.",
        },
        {
          key: "evaluation",
          questionText: "How can a developer compare two prompts for the same application task?",
          options: ["Choose whichever prompt is longer", "Test only an unrelated example", "Skip testing entirely", "Evaluate both on representative examples using consistent criteria"],
          correctAnswer: "Evaluate both on representative examples using consistent criteria",
          hint: "Use the same test cases and success criteria for a fair comparison.",
        },
      ],
    },
  },
];

async function main() {
  // Validate before opening a database connection.
  const questionIds = new Set<string>();
  for (const platform of platforms) {
    for (const question of platform.certification.questions) {
      const id = `seed-${platform.slug}-${question.key}`;
      if (
        questionIds.has(id) ||
        question.options.length !== 4 ||
        new Set(question.options).size !== 4 ||
        !question.options.includes(question.correctAnswer) ||
        !question.hint.trim()
      ) {
        throw new Error(`Invalid sample question: ${id}`);
      }
      questionIds.add(id);
    }
  }

  // Allows checking the fixture data without reading or writing the database.
  if (process.argv.includes("--validate-only")) {
    console.log(`Validated ${platforms.length} platforms, ${platforms.length} certifications, and ${questionIds.size} questions.`);
    return;
  }

  const prisma = new PrismaClient();
  try {
    // One transaction prevents a failed run from leaving partially seeded data.
    await prisma.$transaction(async (tx) => {
      for (const sample of platforms) {
        const platformData = { name: sample.name, slug: sample.slug };
        const platform = await tx.platform.upsert({
          where: { slug: sample.slug },
          update: platformData,
          create: platformData,
        });

        const certificationData = {
          title: sample.certification.title,
          slug: sample.certification.slug,
          platformId: platform.id,
        };
        const certification = await tx.certification.upsert({
          where: { slug: certificationData.slug },
          update: certificationData,
          create: certificationData,
        });

        for (const { key, ...question } of sample.certification.questions) {
          // Stable IDs let edits to question text update the same seeded record.
          const id = `seed-${sample.slug}-${key}`;
          const data = { ...question, certificationId: certification.id };
          await tx.question.upsert({
            where: { id },
            update: data,
            create: { id, ...data },
          });
        }
      }
    }, { timeout: 60_000 });

    console.log(`Seed complete: ${platforms.length} platforms, ${platforms.length} certifications, and ${questionIds.size} sample questions upserted.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Seeding failed:", error);
  process.exitCode = 1;
});
