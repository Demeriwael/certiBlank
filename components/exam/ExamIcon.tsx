import type { CSSProperties } from "react";

export type IconName = "next" | "previous" | "external" | "check" | "close" | "flag" | "grid" | "clock" | "book" | "keyboard" | "chevron" | "shield";
const paths: Record<IconName, string> = {
  next: "M4 12h16m-6-6 6 6-6 6",
  previous: "M20 12H4m6-6-6 6 6 6",
  external: "M14 4h6v6m0-6L10 14m0-9H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-5",
  check: "m5 12 4 4L19 6",
  close: "m6 6 12 12M18 6 6 18",
  flag: "M6 21V3h13l-3 5 3 5H6",
  grid: "M4 4h5v5H4zm11 0h5v5h-5zM4 15h5v5H4zm11 0h5v5h-5z",
  clock: "M12 8v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  book: "M12 5v15M3 4h5l4 2 4-2h5v15h-5l-4 2-4-2H3z",
  keyboard: "M3 5h18v14H3zM6 9h1m3 0h1m3 0h1m3 0h0M6 12h1m3 0h1m3 0h1m3 0h0M8 16h8",
  chevron: "m6 9 6 6 6-6",
  shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6",
};
export function ExamIcon({ name, className, style }: { name: IconName; className?: string; style?: CSSProperties }) {
  return <svg className={className} style={style} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]} /></svg>;
}
