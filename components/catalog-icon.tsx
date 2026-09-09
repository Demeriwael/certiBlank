export function CatalogIcon({ name = "arrow", className = "" }: { name?: "arrow" | "external" | "search" | "refresh" | "check" | "clock" | "down"; className?: string }) {
  const paths = {
    arrow: "M4 12h16m-6-6 6 6-6 6",
    external: "M7 17 17 7M7 7h10v10",
    search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    refresh: "M20 7V3m0 4h-4m4 0a9 9 0 1 0 1 8",
    check: "m5 12 4 4L19 6",
    clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
    down: "M12 4v16m-6-6 6 6 6-6",
  };
  return <svg className={`catalog-icon ${className}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]} /></svg>;
}
