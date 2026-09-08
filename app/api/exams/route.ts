import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { attemptView, json, loadExam } from "@/lib/exam-server";
import { domainQuotas, selectMock, shuffled } from "@/lib/exam-logic";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("certSlug");
  if (!slug) return Response.json({ error: "certSlug is required" }, { status: 400 });
  try {
    const bank = await loadExam(slug);
    if (!bank) return Response.json({ error: "Certification not found" }, { status: 404 });
    const quotas = bank.config ? domainQuotas(bank.domains, bank.config.questionCount) : {};
    const domains = bank.domains.map(d => ({ ...d, available: bank.questions.filter(q => q.domain === d.id).length, required: quotas[d.id] ?? 0 }));
    return Response.json({ title: bank.title, config: bank.config, domains, available: bank.questions.length, mockReady: Boolean(bank.config && domains.length && domains.every(d => d.available >= d.required)) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Unable to load exam configuration" }, { status: 500 }); }
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Expected a JSON object" }, { status: 400 });
    if (typeof body.certSlug !== "string" || !["mock", "domain"].includes(body.mode)) return Response.json({ error: "Provide certSlug and a valid mode" }, { status: 400 });
    const bank = await loadExam(body.certSlug);
    if (!bank?.config || !bank.questions.length) return Response.json({ error: "This question bank is awaiting updated data" }, { status: 409 });
    let questions;
    if (body.mode === "mock") {
      try { questions = selectMock(bank.questions, bank.domains, bank.config.questionCount); }
      catch (error) { return Response.json({ error: (error as Error).message }, { status: 409 }); }
      if (bank.config.shuffleQuestions) questions = shuffled(questions);
    } else {
      if (!Array.isArray(body.domains) || !body.domains.length || body.domains.some((id: unknown) => !bank.domains.some(d => d.id === id)) || !Number.isInteger(body.limit) || body.limit < 1 || body.limit > 200) return Response.json({ error: "Select valid domains and 1–200 questions" }, { status: 400 });
      questions = shuffled(bank.questions.filter(q => body.domains.includes(q.domain))).slice(0, body.limit);
      if (!questions.length) return Response.json({ error: "No questions in the selected domains" }, { status: 409 });
    }
    if (bank.config.shuffleOptions) questions = questions.map(q => ({ ...q, options: shuffled(q.options) }));
    const jar = await cookies(); const owner = jar.get("certi-owner")?.value ?? randomUUID();
    const attempt = await prisma.examAttempt.create({ data: { owner, certSlug: body.certSlug, mode: body.mode, snapshot: json({ title: bank.title, config: bank.config, domains: bank.domains, questions }), answers: {}, expiresAt: body.mode === "mock" ? new Date(Date.now() + bank.config.durationSeconds * 1000) : null } });
    jar.set("certi-owner", owner, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return Response.json(attemptView(attempt), { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return Response.json({ error: error instanceof SyntaxError ? "Invalid JSON" : "Unable to start exam" }, { status: error instanceof SyntaxError ? 400 : 500 }); }
}
