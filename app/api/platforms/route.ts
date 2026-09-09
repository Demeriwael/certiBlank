import { prisma } from "@/lib/prisma";
import { databaseDiagnostics } from "@/lib/database-diagnostics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const platforms = await prisma.platform.findMany({
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

