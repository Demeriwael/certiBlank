import { cookies } from "next/headers";
import { currentUser } from "@/lib/auth-session";
import { attemptAccess } from "@/lib/auth-logic";
import { prisma } from "@/lib/prisma";
import { attemptProgress, attemptView, json } from "@/lib/exam-server";
import { validateAnswers } from "@/lib/exam-logic";
import type { AnswerMap, Snapshot } from "@/lib/exam-contract";
import { readJson, requireOrigin, requestError, RequestValidationError } from "@/lib/request-security";
import { limitExam } from "@/lib/exam-rate-limit";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
async function find(context: Context) {
  const owner = (await cookies()).get("certi-owner")?.value;
  const access = attemptAccess((await currentUser())?.id, owner);
  if (!access) return null;
  return prisma.examAttempt.findFirst({ where: { id: (await context.params).id, ...access } });
}
async function handle(request: Request, context: Context, mutate: boolean) {
  try {
    if (mutate) requireOrigin(request);
    const body = mutate ? await readJson(request) : null;
    const limited = await limitExam(request, mutate ? "save" : "read"); if (limited) return limited;
    let compact = false;
    let attempt = await find(context);
    if (!attempt) return Response.json({ error: "Attempt not found" }, { status: 404 });
    if (!attempt.submittedAt && attempt.expiresAt && attempt.expiresAt.getTime() <= Date.now()) {
      await prisma.examAttempt.updateMany({ where: { id: attempt.id, userId: attempt.userId, submittedAt: null }, data: { submittedAt: new Date(), version: { increment: 1 } } });
      attempt = (await find(context))!;
    }
    if (body && !attempt.submittedAt) {
      compact = body.compact === true;
      const snapshot = attempt.snapshot as unknown as Snapshot;
      if (body.action !== "save" && body.action !== "check" && body.action !== "submit") throw new RequestValidationError("Invalid action");
      if (body.version !== attempt.version) return Response.json({ error: "Progress changed in another tab. Reload to continue." }, { status: 409 });
      let answers: AnswerMap;
      try { answers = validateAnswers(body.answers, snapshot.questions); } catch { throw new RequestValidationError("Invalid answers"); }
      for (const id of attempt.checked) if (JSON.stringify([...(answers[id] ?? [])].sort()) !== JSON.stringify([...((attempt.answers as AnswerMap)[id] ?? [])].sort())) throw new RequestValidationError("Checked answers cannot be changed");
      if (typeof body.currentIndex !== "number" || !Number.isInteger(body.currentIndex) || body.currentIndex < 0 || body.currentIndex >= snapshot.questions.length || !Array.isArray(body.flagged) || body.flagged.length > snapshot.questions.length || body.flagged.some((id: unknown) => !snapshot.questions.some(q => q.id === id))) throw new RequestValidationError("Invalid navigation state");
      const checked = new Set(attempt.checked);
      if (body.action === "check") {
        const q = snapshot.questions[body.currentIndex];
        if (attempt.mode !== "domain" || answers[q.id]?.length !== q.selectionCount) throw new RequestValidationError("Select the required number of answers first");
        checked.add(q.id);
      }
      const updated = await prisma.examAttempt.updateManyAndReturn({ where: { id: attempt.id, userId: attempt.userId, version: attempt.version, submittedAt: null }, omit: { snapshot: true }, data: { answers: json(answers), checked: [...checked], flagged: [...new Set<string>(body.flagged)], currentIndex: body.currentIndex, submittedAt: body.action === "submit" ? new Date() : null, version: { increment: 1 } } });
      if (!updated.length) return Response.json({ error: "Progress changed. Reload to continue." }, { status: 409 });
      attempt = { ...attempt, ...updated[0] };
    }
    return Response.json(compact ? attemptProgress(attempt, body?.incrementalFeedback === true ? body.action === "check" ? (attempt.snapshot as unknown as Snapshot).questions[attempt.currentIndex].id : null : undefined) : attemptView(attempt), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return requestError(error, "Unable to save exam. Please retry."); }
}
export const GET = (request: Request, context: Context) => handle(request, context, false);
export const POST = (request: Request, context: Context) => handle(request, context, true);
