// Run explicitly against the local development server; creates and removes only its own attempts.
import "dotenv/config";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import type { AttemptView } from "../lib/exam-contract";
const prisma = new PrismaClient();
const ids: string[] = [];
let cookie = "";
async function call(path: string, body?: unknown, useCookie = true) {
  const response = await fetch(`http://127.0.0.1:3000/api/${path}`, { headers: { "Content-Type": "application/json", ...(useCookie && cookie ? { Cookie: cookie } : {}) }, ...(body ? { method: "POST", body: JSON.stringify(body) } : {}) });
  if (response.headers.get("set-cookie")) cookie = response.headers.get("set-cookie")!.split(";")[0];
  return { status: response.status, data: await response.json() };
}
const state = (a: AttemptView, action: string) => ({ action, version: a.version, answers: a.answers, flagged: a.flagged, currentIndex: a.currentIndex });
async function main() {
  try {
    const config = await call("exams?certSlug=cloud-practitioner"); assert.equal(config.data.available,274); assert.equal(config.data.mockReady,true);
    const started = await call("exams",{certSlug:"cloud-practitioner",mode:"domain",domains:["cloud-concepts"],limit:5});
    let domain = started.data;
    assert.equal(started.status,201);ids.push(domain.id);
    assert.equal(domain.questions.length,5); assert.ok(domain.questions.every((q: {domain: string})=>q.domain==="cloud-concepts"));
    assert.equal((await call(`exams/${domain.id}`,undefined,false)).status,404);
    const q=domain.questions[0];domain.answers[q.id]=q.options.slice(0,q.selectionCount).map((o:{id:string})=>o.id);domain.flagged=[q.id];
    domain=(await call(`exams/${domain.id}`,state(domain,"check"))).data;
    assert.ok(domain.feedback[q.id]);assert.equal(Object.keys(domain.feedback).length,1);
    const restored=(await call(`exams/${domain.id}`)).data;assert.deepEqual(restored.answers,domain.answers);assert.deepEqual(restored.flagged,[q.id]);
    const tampered={...state(domain,"save"),answers:{[q.id]:[]}};assert.equal((await call(`exams/${domain.id}`,tampered)).status,400);
    const result=(await call(`exams/${domain.id}`,state(domain,"submit"))).data;assert.equal(result.isSubmitted,true);assert.equal(result.results.total,5);
    let mock=(await call("exams",{certSlug:"cloud-practitioner",mode:"mock"})).data;ids.push(mock.id);
    assert.equal(mock.questions.length,65);assert.ok(!JSON.stringify(mock).includes("correctOptionIds"));
    assert.equal((await call(`exams/${mock.id}`,state(mock,"check"))).status,400);
    const first=mock.questions[0];mock.answers[first.id]=first.options.slice(0,first.selectionCount).map((o:{id:string})=>o.id);
    mock=(await call(`exams/${mock.id}`,state(mock,"save"))).data;
    assert.equal((await call(`exams/${mock.id}`,{...state(mock,"save"),version:mock.version-1})).status,409);
    await prisma.examAttempt.update({where:{id:mock.id},data:{expiresAt:new Date(Date.now()-1000)}});
    const second=mock.questions[1];mock.answers[second.id]=second.options.slice(0,second.selectionCount).map((o:{id:string})=>o.id);
    const expired=(await call(`exams/${mock.id}`,state(mock,"submit"))).data;
    assert.equal(expired.isSubmitted,true);assert.equal(expired.answers[second.id],undefined);assert.ok(expired.answers[first.id]);
    assert.deepEqual((await call(`exams/${mock.id}`,state(mock,"submit"))).data.results,expired.results);
    console.log("Live checks passed: ownership, filtering, persistence, feedback locking, stale writes, mock privacy, expiry, and idempotent submission.");
  } finally { await prisma.examAttempt.deleteMany({where:{id:{in:ids}}});await prisma.$disconnect(); }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
