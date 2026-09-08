import type { AnswerMap, BankQuestion, Domain, Results, Snapshot } from "./exam-contract";

export function isCorrect(expected: string[], actual: string[]) {
  return expected.length === actual.length && new Set(actual).size === actual.length && expected.every((id) => actual.includes(id));
}
export function domainQuotas(domains: Domain[], total: number) {
  const rows = domains.map((domain, index) => ({ id: domain.id, count: Math.floor(total * domain.weightPercent / 100), fraction: total * domain.weightPercent / 100 % 1, index }));
  const remaining = total - rows.reduce((sum, row) => sum + row.count, 0);
  const sorted = [...rows].sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (let i = 0; i < remaining; i++) sorted[i % sorted.length].count++;
  return Object.fromEntries(rows.map((row) => [row.id, row.count]));
}
export function shuffled<T>(items: T[], random = Math.random): T[] {
  const copy = [...items]; for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy;
}
export function selectMock(questions: BankQuestion[], domains: Domain[], count: number) {
  const quotas = domainQuotas(domains, count);
  return domains.flatMap((domain) => {
    const candidates = questions.filter((question) => question.domain === domain.id);
    if (candidates.length < quotas[domain.id]) throw new Error(`${domain.name} needs ${quotas[domain.id]} questions; ${candidates.length} available.`);
    return shuffled(candidates).slice(0, quotas[domain.id]);
  });
}
export function grade(snapshot: Snapshot, answers: AnswerMap): Results {
  const review = snapshot.questions.map((question) => ({ ...question, userAnswer: answers[question.id] ?? [], correct: isCorrect(question.correctOptionIds, answers[question.id] ?? []) }));
  const correct = review.filter((question) => question.correct).length;
  const total = review.length;
  const config = snapshot.config.scoring;
  const scaledScore = Math.round(config.minimumScore + (total ? correct / total : 0) * (config.maximumScore - config.minimumScore));
  return { correct, total, percentage: total ? Math.round(correct / total * 100) : 0, scaledScore, passingScore: config.passingScore, passed: scaledScore >= config.passingScore, review,
    domains: snapshot.domains.map((domain) => { const rows = review.filter((question) => question.domain === domain.id); const passed = rows.filter((question) => question.correct).length; return { id: domain.id, name: domain.name, total: rows.length, correct: passed, accuracy: rows.length ? Math.round(passed / rows.length * 100) : null }; }),
  };
}
export function validateAnswers(value: unknown, questions: BankQuestion[]): AnswerMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid answers");
  const answers: AnswerMap = {};
  for (const [id, choices] of Object.entries(value)) {
    const question = questions.find((item) => item.id === id);
    if (!question || !Array.isArray(choices) || choices.length > question.selectionCount || new Set(choices).size !== choices.length || choices.some((choice) => typeof choice !== "string" || !question.options.some((option) => option.id === choice))) throw new Error("Invalid answer selection");
    answers[id] = choices;
  }
  return answers;
}
