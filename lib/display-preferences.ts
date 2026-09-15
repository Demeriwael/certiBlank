export type Theme = "light" | "dark";
export function savedTheme(value: string | null): Theme { return value === "dark" ? "dark" : "light"; }
export function confirmedAccountState(session: unknown, pending: boolean, error: unknown): "member" | "guest" | null {
  if (session) return "member";
  if (pending) return null;
  if (error) return typeof error === "object" && "status" in error && error.status === 401 ? "guest" : null;
  return "guest";
}

// Cosmetic preferences only. Never store tokens, user details, or authorization here.
// Runs before paint so a saved theme/account label does not flash on a full reload.
export const displayBootstrap = `(function(){var d=document.documentElement;try{d.dataset.theme=localStorage.getItem("certi-theme")==="dark"?"dark":"light";d.dataset.account=localStorage.getItem("certi-account-hint")==="member"?"member":"guest"}catch(e){d.dataset.theme="light";d.dataset.account="guest"}})();`;
