import { catalog } from "./catalog";
export type AccountAttempt = { id: string; certSlug: string; mode: string; createdAt: string; submittedAt: string | null; expiresAt: string | null };
export type PracticeStatus = "active" | "completed" | "expired";
export function practiceStatus(attempt: Pick<AccountAttempt, "submittedAt" | "expiresAt">, now: number): PracticeStatus {
  if (attempt.submittedAt) return "completed";
  if (attempt.expiresAt && Date.parse(attempt.expiresAt) <= now) return "expired";
  return "active";
}
export function certificationLabel(slug: string) {
  for (const platform of catalog) {
    const track = platform.tracks.find(item => item.slug === slug);
    if (track) return { title: track.title, provider: platform.name, code: track.examCode ?? platform.name };
  }
  return { title: slug.replaceAll("-", " ").replace(/\b\w/g, letter => letter.toUpperCase()), provider: "Certification", code: "PRACTICE" };
}

