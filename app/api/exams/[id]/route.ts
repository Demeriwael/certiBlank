import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { attemptProgress, attemptView, json } from "@/lib/exam-server";
import { validateAnswers } from "@/lib/exam-logic";
import type { AnswerMap, Snapshot } from "@/lib/exam-contract";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
async function find(context: Context) {
  const owner = (await cookies()).get("certi-owner")?.value;
  if (!owner) return null;
  return prisma.examAttempt.findFirst({ where: { id: (await context.params).id, owner } });
}
async function handle(request: Request, context: Context, mutate: boolean) {
  try {
    let compact = false;
    let attempt = await find(context);
    if (!attempt) return Response.json({ error: "Attempt not found" }, { status: 404 });
    if (!attempt.submittedAt && attempt.expiresAt && attempt.expiresAt.getTime() <= Date.now()) {
      await prisma.examAttempt.updateMany({ where: { id: attempt.id, submittedAt: null }, data: { submittedAt: new Date(), version: { increment: 1 } } });
      attempt = (await find(context))!;
    }
    if (mutate && !attempt.submittedAt) {
      const body = await request.json();
      if (!body || typeof body !== "object" || Array.isArray(body)) throw new TypeError("Expected a JSON object");
      compact = body.compact === true;
      const snapshot = attempt.snapshot as unknown as Snapshot;
      if (!["save", "check", "submit"].includes(body.action)) throw new TypeError("Invalid action");
      if (body.version !== attempt.version) return Response.json({ error: "Progress changed in another tab. Reload to continue." }, { status: 409 });
      let answers: AnswerMap;
      try { answers = validateAnswers(body.answers, snapshot.questions); } catch { throw new TypeError("Invalid answers"); }
      for (const id of attempt.checked) if (JSON.stringify([...(answers[id] ?? [])].sort()) !== JSON.stringify([...((attempt.answers as AnswerMap)[id] ?? [])].sort())) throw new TypeError("Checked answers cannot be changed");
      if (!Number.isInteger(body.currentIndex) || body.currentIndex < 0 || body.currentIndex >= snapshot.questions.length || !Array.isArray(body.flagged) || body.flagged.some((id: unknown) => !snapshot.questions.some(q => q.id === id))) throw new TypeError("Invalid navigation state");
      const checked = new Set(attempt.checked);
      if (body.action === "check") {
        const q = snapshot.questions[body.currentIndex];
        if (attempt.mode !== "domain" || answers[q.id]?.length !== q.selectionCount) throw new TypeError("Select the required number of answers first");
        checked.add(q.id);
      }
      const updated = await prisma.examAttempt.updateManyAndReturn({ where: { id: attempt.id, version: attempt.version, submittedAt: null }, data: { answers: json(answers), checked: [...checked], flagged: [...new Set<string>(body.flagged)], currentIndex: body.currentIndex, submittedAt: body.action === "submit" ? new Date() : null, version: { increment: 1 } } });
      if (!updated.length) return Response.json({ error: "Progress changed. Reload to continue." }, { status: 409 });
      attempt = updated[0];
    }
    return Response.json(compact ? attemptProgress(attempt) : attemptView(attempt), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { const bad = error instanceof TypeError || error instanceof SyntaxError; return Response.json({ error: bad ? error.message : "Unable to save exam. Please retry." }, { status: bad ? 400 : 500 }); }
}
export const GET = (request: Request, context: Context) => handle(request, context, false);
export const POST = (request: Request, context: Context) => handle(request, context, true);
