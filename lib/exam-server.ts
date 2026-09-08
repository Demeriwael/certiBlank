import type { ExamAttempt, Prisma } from "@prisma/client";
import type { AnswerMap, AttemptProgress, AttemptView, BankQuestion, Domain, MockConfig, Snapshot } from "./exam-contract";
import { grade, isCorrect } from "./exam-logic";
import { prisma } from "./prisma";
export const json = (value: unknown) => value as Prisma.InputJsonValue;
export async function loadExam(slug: string) {
  const cert = await prisma.certification.findUnique({ where: { slug }, include: { questions: { where: { schemaVersion: 2 } } } });
  if (!cert) return null;
  const questions = cert.questions.map(q => ({ id: q.id, type: q.type, questionText: q.questionText, selectionCount: q.selectionCount, options: q.optionItems, domain: q.domain, hint: q.hint, correctOptionIds: q.correctOptionIds, correctExplanation: q.correctExplanation, distractorExplanations: q.distractorExplanations, referenceUrl: q.referenceUrl })) as BankQuestion[];
  return { title: cert.title, config: cert.examConfig as MockConfig | null, domains: (cert.domains ?? []) as Domain[], questions };
}
export function attemptProgress(attempt: ExamAttempt): AttemptProgress {
  const snapshot = attempt.snapshot as unknown as Snapshot;
  const answers = attempt.answers as AnswerMap;
  // Ordinary saves never grade the whole exam or serialize its question bank.
  const results = attempt.submittedAt ? grade(snapshot, answers) : null;
  const review = results?.review ?? (attempt.mode === "domain" ? snapshot.questions.filter(q => attempt.checked.includes(q.id)).map(q => ({ ...q, userAnswer: answers[q.id] ?? [], correct: isCorrect(q.correctOptionIds, answers[q.id] ?? []) })) : []);
  return { id: attempt.id, answers, checked: attempt.checked, flagged: attempt.flagged, currentIndex: attempt.currentIndex, expiresAt: attempt.expiresAt?.toISOString() ?? null, serverNow: new Date().toISOString(), isSubmitted: Boolean(attempt.submittedAt), version: attempt.version, feedback: Object.fromEntries(review.map(q => [q.id, q])), results };
}
export function attemptView(attempt: ExamAttempt): AttemptView {
  const snapshot = attempt.snapshot as unknown as Snapshot;
  return { ...attemptProgress(attempt), mode: attempt.mode as "mock" | "domain", title: snapshot.title,
    questions: snapshot.questions.map(q => ({ id: q.id, type: q.type, questionText: q.questionText, selectionCount: q.selectionCount, options: q.options, domain: q.domain, hint: attempt.mode === "domain" ? q.hint : null })), domains: snapshot.domains };
}
