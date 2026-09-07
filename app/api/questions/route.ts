import type { Question } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const certSlug = params.get("certSlug")?.trim();

  if (!certSlug || params.getAll("certSlug").length !== 1) {
    return Response.json(
      { error: "Provide one non-empty certSlug query parameter." },
      { status: 400 },
    );
  }

  const rawLimit = params.get("limit");
  const limit = rawLimit === null ? 10 : Number(rawLimit);

  if (
    params.getAll("limit").length > 1 ||
    (rawLimit !== null && !/^\d+$/.test(rawLimit)) ||
    !Number.isSafeInteger(limit) ||
    limit < 1
  ) {
    return Response.json(
      { error: "limit must be a positive safe integer." },
      { status: 400 },
    );
  }

  try {
    // Tagged-template values are bound parameters, never interpolated SQL.
    const questions = await prisma.$queryRaw<Question[]>`
      SELECT q.*
      FROM "Question" AS q
      INNER JOIN "Certification" AS c ON c."id" = q."certificationId"
      WHERE c."slug" = ${certSlug}
      ORDER BY RANDOM()
      LIMIT ${limit}
    `;

    return Response.json(questions, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    console.error("GET /api/questions: database query failed.");
    return Response.json(
      { error: "Unable to fetch questions." },
      { status: 500 },
    );
  }
}
