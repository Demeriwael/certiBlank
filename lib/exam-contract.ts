export type Domain = { id: string; name: string; weightPercent: number };
export type Scoring = { method: "linear"; minimumScore: number; maximumScore: number; passingScore: number; multipleResponsePolicy: "all-or-nothing" };
export type MockConfig = { questionCount: number; durationSeconds: number; shuffleQuestions: boolean; shuffleOptions: boolean; scoring: Scoring };
export type PublicQuestion = { id: string; type: "single" | "multiple"; questionText: string; selectionCount: number; options: { id: string; text: string }[]; domain: string; hint: string | null };
export type BankQuestion = PublicQuestion & { correctOptionIds: string[]; correctExplanation: string; distractorExplanations: Record<string, string>; referenceUrl: string };
export type Bank = { schemaVersion: 2; platform: { name: string; slug: string }; certification: { title: string; slug: string; examCode: string; blueprintUrl: string; mockExam: MockConfig; domains: Domain[] }; questions: BankQuestion[] };
export type Snapshot = { title: string; questions: BankQuestion[]; domains: Domain[]; config: MockConfig };
export type AnswerMap = Record<string, string[]>;
export type Review = BankQuestion & { userAnswer: string[]; correct: boolean };
export type Results = { correct: number; total: number; percentage: number; scaledScore: number; passingScore: number; passed: boolean; domains: { id: string; name: string; total: number; correct: number; accuracy: number | null }[]; review: Review[] };
export type AttemptView = { id: string; mode: "mock" | "domain"; title: string; questions: PublicQuestion[]; domains: Domain[]; answers: AnswerMap; checked: string[]; flagged: string[]; currentIndex: number; expiresAt: string | null; serverNow: string; isSubmitted: boolean; feedback: Record<string, Review>; results: Results | null; version: number };
export type AttemptProgress = Omit<AttemptView, "questions" | "domains" | "title" | "mode">;

function ensure(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
function record(value: unknown): asserts value is Record<string, unknown> { ensure(value && typeof value === "object" && !Array.isArray(value), "Expected an object"); }
function text(value: unknown): asserts value is string { ensure(typeof value === "string" && value.trim().length > 0, "Expected a non-empty string"); }
function url(value: unknown) { text(value); const parsed = new URL(value); ensure(parsed.protocol === "https:", "Reference URLs must use HTTPS"); }
function integer(value: unknown, min: number, max: number) { ensure(Number.isInteger(value) && Number(value) >= min && Number(value) <= max, `Expected an integer between ${min} and ${max}`); }
export function validateBank(value: unknown): Bank {
  record(value); ensure(value.schemaVersion === 2, "Expected schemaVersion 2");
  record(value.platform); text(value.platform.name); text(value.platform.slug);
  record(value.certification); const cert = value.certification;
  for (const field of ["title", "slug", "examCode"]) text(cert[field]);
  ensure(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(cert.slug)), "Invalid certification slug");
  ensure(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.platform.slug), "Invalid platform slug");
  url(cert.blueprintUrl); record(cert.mockExam); const config = cert.mockExam;
  integer(config.questionCount, 1, 200); integer(config.durationSeconds, 60, 86400);
  ensure(typeof config.shuffleQuestions === "boolean" && typeof config.shuffleOptions === "boolean", "Shuffle settings must be boolean");
  record(config.scoring); const scoring = config.scoring;
  ensure(scoring.method === "linear" && scoring.multipleResponsePolicy === "all-or-nothing", "Unsupported scoring configuration");
  integer(scoring.minimumScore, 0, 10000); integer(scoring.maximumScore, 1, 10000);
  ensure(Number(scoring.minimumScore) < Number(scoring.maximumScore), "Score maximum must exceed minimum");
  integer(scoring.passingScore, Number(scoring.minimumScore), Number(scoring.maximumScore));
  ensure(Array.isArray(cert.domains) && cert.domains.length > 0, "Domains are required");
  const domainIds = new Set<string>(); let weight = 0;
  for (const domain of cert.domains) {
    record(domain); text(domain.id); text(domain.name);
    ensure(!domainIds.has(domain.id), `Duplicate domain ${domain.id}`); domainIds.add(domain.id);
    ensure(typeof domain.weightPercent === "number" && domain.weightPercent > 0 && domain.weightPercent <= 100, "Invalid domain weight"); weight += domain.weightPercent;
  }
  ensure(Math.abs(weight - 100) < 0.0001, "Domain weights must total 100");
  ensure(Array.isArray(value.questions) && value.questions.length > 0, "Questions are required");
  const ids = new Set<string>();
  for (const [index, question] of value.questions.entries()) {
    try {
      record(question); text(question.id); ensure(!ids.has(question.id), `Duplicate ID ${question.id}`); ids.add(question.id);
      text(question.questionText); text(question.correctExplanation); url(question.referenceUrl);
      ensure(question.hint === null || typeof question.hint === "string", "hint must be a string or null");
      ensure(question.type === "single" || question.type === "multiple", "Invalid question type");
      ensure(typeof question.domain === "string" && domainIds.has(question.domain), "Unknown domain");
      ensure(Array.isArray(question.options) && question.options.length >= 2 && question.options.length <= 10, "Expected 2–10 options");
      const options = new Set<string>(); const texts = new Set<string>();
      for (const option of question.options) { record(option); text(option.id); text(option.text); ensure(!options.has(option.id) && !texts.has(option.text), "Duplicate option ID or text"); options.add(option.id); texts.add(option.text); }
      integer(question.selectionCount, question.type === "single" ? 1 : 2, question.type === "single" ? 1 : options.size - 1);
      ensure(Array.isArray(question.correctOptionIds) && question.correctOptionIds.length === question.selectionCount && new Set(question.correctOptionIds).size === question.correctOptionIds.length, "Correct IDs must match selectionCount");
      for (const id of question.correctOptionIds) ensure(options.has(id), "Unknown correct option ID");
      record(question.distractorExplanations);
      const incorrect = [...options].filter((id) => !(question.correctOptionIds as string[]).includes(id));
      ensure(Object.keys(question.distractorExplanations).length === incorrect.length, "Each distractor needs exactly one explanation");
      for (const id of incorrect) text(question.distractorExplanations[id]);
    } catch (error) { throw new Error(`Question ${index + 1}: ${error instanceof Error ? error.message : "invalid question"}`); }
  }
  return value as unknown as Bank;
}
