// Local fixture benchmark; no database connection or live attempt creation.
import { readFileSync } from "node:fs";
import type { ExamAttempt } from "@prisma/client";
import { validateBank, type Snapshot } from "../lib/exam-contract";
import { attemptProgress } from "../lib/exam-server";
const bank = validateBank(JSON.parse(readFileSync("prisma/Data/AWS/AWS_Cloud_Practitioner_CLF_C02/AWS_Cloud_Practitioner_CLF_C02_updated.json.json", "utf8")));
const snapshot: Snapshot = { title: bank.certification.title, config: bank.certification.mockExam, domains: bank.certification.domains, questions: bank.questions.slice(0, 65) };
const attempt = { id: "benchmark", mode: "domain", snapshot, answers: Object.fromEntries(snapshot.questions.map(q => [q.id, q.correctOptionIds])), checked: snapshot.questions.map(q => q.id), flagged: [], currentIndex: 64, expiresAt: null, submittedAt: null, version: 65 } as unknown as ExamAttempt;
const bytes = (value: unknown) => Buffer.byteLength(JSON.stringify(value));
const oldSave = bytes(attemptProgress(attempt));
const newSave = bytes(attemptProgress(attempt, null));
const oldBank = bytes(bank.questions);
const setupDomains = bytes(bank.questions.map(q => ({ domain: q.domain })));
console.log(JSON.stringify({ fixture: "65-question domain session, all answers revealed", oldSaveBytes: oldSave, incrementalSaveBytes: newSave, saveReductionPercent: +(100 * (1 - newSave / oldSave)).toFixed(2), bankQuestionBytes: oldBank, setupDomainBytes: setupDomains, setupQuestionReductionPercent: +(100 * (1 - setupDomains / oldBank)).toFixed(2) }, null, 2));
