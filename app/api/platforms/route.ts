import { prisma } from "@/lib/prisma";

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
  } catch {
    console.error("GET /api/platforms: database query failed.");
    return Response.json(
      { error: "Unable to fetch platforms." },
      { status: 500 },
    );
  }
}

