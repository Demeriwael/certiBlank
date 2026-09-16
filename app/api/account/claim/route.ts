import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { currentUser } from "@/lib/auth-session";
import { claimAttempts } from "@/lib/auth-logic";
import { requireOrigin, requestError } from "@/lib/request-security";
import { limitExam } from "@/lib/exam-rate-limit";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    requireOrigin(request);
    const limited = await limitExam(request, "save"); if (limited) return limited;
    const user = await currentUser();
    if (!user) return Response.json({ error: "Please log in first" }, { status: 401 });
    const jar = await cookies();
    const count = await claimAttempts(prisma, user.id, jar.get("certi-owner")?.value);
    // Rotate only after the atomic claim succeeds. Failed requests can safely retry.
    jar.set("certi-owner", randomUUID(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return Response.json({ count }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return requestError(error, "Your account is signed in, but progress could not be linked. Please retry.");
  }
}
