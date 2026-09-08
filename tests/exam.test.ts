import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { validateBank, type Snapshot } from "../lib/exam-contract";
import { domainQuotas, grade, isCorrect, selectMock, validateAnswers } from "../lib/exam-logic";
import { attemptView } from "../lib/exam-server";
import type { ExamAttempt } from "@prisma/client";
const bank = validateBank(JSON.parse(readFileSync("prisma/Data/AWS/AWS_Cloud_Practitioner_CLF_C02/AWS_Cloud_Practitioner_CLF_C02_updated.json.json", "utf8")));
const snapshot: Snapshot = { title: bank.certification.title, config: bank.certification.mockExam, domains: bank.certification.domains, questions: bank.questions.slice(0, 5) };
test("new bank validates all questions and rejects missing distractor reasoning", () => {
  assert.equal(bank.questions.length,274);
  const invalid = structuredClone(bank); invalid.questions[0].distractorExplanations = {};
  assert.throws(() => validateBank(invalid), /distractor/);
});
test("mock quotas total 65 and sampling respects the blueprint without repeats", () => {
  const quotas = domainQuotas(bank.certification.domains,65);
  assert.deepEqual(Object.values(quotas),[16,19,22,8]);
  const sample = selectMock(bank.questions,bank.certification.domains,65);
  assert.equal(new Set(sample.map(q=>q.id)).size,65);
  for(const [domain,count] of Object.entries(quotas)) assert.equal(sample.filter(q=>q.domain===domain).length,count);
  assert.throws(()=>selectMock(bank.questions.slice(0,2),bank.certification.domains,65),/needs/);
});
test("multiple responses require the exact set; partial, extra and duplicate answers fail", () => {
  assert.ok(isCorrect(["a","b"],["b","a"]));
  for(const answer of [["a"],["a","b","c"],["a","a"]]) assert.equal(isCorrect(["a","b"],answer),false);
  assert.throws(()=>validateAnswers({missing:["a"]},snapshot.questions));
  assert.throws(()=>validateAnswers({[snapshot.questions[0].id]:["unknown"]},snapshot.questions));
});
test("scores cover endpoints and unanswered domains have no fabricated accuracy",()=>{
  const empty = grade(snapshot,{}); assert.equal(empty.scaledScore,100); assert.equal(empty.correct,0); assert.equal(empty.passed,false);
  const perfect=grade(snapshot,Object.fromEntries(snapshot.questions.map(q=>[q.id,q.correctOptionIds])));
  assert.equal(perfect.scaledScore,1000);assert.equal(perfect.passed,true);
  assert.ok(perfect.domains.filter(d=>d.total===0).every(d=>d.accuracy===null));
});
test("mock responses redact keys, explanations and hints until submission",()=>{
  const attempt = {id:"test",mode:"mock",snapshot,answers:{},checked:[snapshot.questions[0].id],flagged:[],currentIndex:0,expiresAt:new Date(Date.now()+10000),submittedAt:null,version:0} as unknown as ExamAttempt;
  const view=attemptView(attempt); assert.equal(view.results,null);assert.deepEqual(view.feedback,{});
  assert.ok(view.questions.every(q=>q.hint===null));
  assert.ok(!JSON.stringify(view).includes("correctOptionIds"));
  const checked=attemptView({...attempt,mode:"domain"});assert.equal(Object.keys(checked.feedback).length,1);
  const submitted=attemptView({...attempt,submittedAt:new Date()});assert.equal(submitted.results?.review.length,5);
});
