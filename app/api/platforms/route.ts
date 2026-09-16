import { prisma } from "@/lib/prisma";
import { databaseDiagnostics } from "@/lib/database-diagnostics";
import { limitExam } from "@/lib/exam-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const limited = await limitExam(request, "read"); if (limited) return limited;
    const platforms = await prisma.platform.findMany({
      where: { slug: { in: ["aws", "azure", "cisco"] } },
      include: {
        certifications: { orderBy: { title: "asc" }, include: { _count: { select: { questions: { where: { schemaVersion: 2 } } } } } },
      },
      orderBy: { name: "asc" },
    });

    return Response.json(platforms);
  } catch (error) {
    console.error("GET /api/platforms: database query failed.", databaseDiagnostics(error, process.env));
    return Response.json(
      { error: "Unable to fetch platforms." },
      { status: 500 },
    );
  }
}

