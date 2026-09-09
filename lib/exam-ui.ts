export function timerLevel(seconds: number | null) {
  return seconds === null || seconds > 600 ? "normal" : seconds <= 120 ? "critical" : "warning";
}
export function optionLetter(index: number) { return String.fromCharCode(65 + index); }
export function optionState(id: string, selected: string[], correct?: string[]) {
  if (correct) return correct.includes(id) ? "correct" : selected.includes(id) ? "incorrect" : "muted";
  return selected.includes(id) ? "selected" : "idle";
}
export function shortcut(key: string): { type: "option"; index: number } | { type: "next" | "previous" | "flag" } | null {
  if (/^[1-4]$/.test(key)) return { type: "option", index: Number(key) - 1 };
  if (/^[a-d]$/i.test(key)) return { type: "option", index: key.toUpperCase().charCodeAt(0) - 65 };
  if (key === "ArrowRight" || key === "Enter") return { type: "next" };
  if (key === "ArrowLeft") return { type: "previous" };
  if (key.toLowerCase() === "f") return { type: "flag" };
  return null;
}
export function vendorLabel(url: string) {
  try {
    const host = new URL(url).hostname;
    if (host === "docs.aws.amazon.com" || host === "aws.amazon.com") return "View official AWS docs";
    if (host === "learn.microsoft.com") return "View official Microsoft docs";
    if (host === "platform.openai.com" || host === "developers.openai.com") return "View official OpenAI docs";
    if (host === "cisco.com" || host.endsWith(".cisco.com")) return "View official Cisco docs";
  } catch { /* Unrecognized references keep a neutral label. */ }
  return "View reference documentation";
}
