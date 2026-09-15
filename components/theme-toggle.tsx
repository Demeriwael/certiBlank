"use client";
import { useEffect } from "react";
import { savedTheme } from "@/lib/display-preferences";

export function ThemeToggle() {
  useEffect(() => {
    const update = (event: StorageEvent) => {
      if (event.key === "certi-theme") document.documentElement.dataset.theme = savedTheme(event.newValue);
    };
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);
  function toggle() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("certi-theme", next); } catch { /* Keep working when storage is unavailable. */ }
  }
  return <button type="button" className="theme-toggle" onClick={toggle}>
    <span className="theme-to-dark"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z" /></svg><span className="sr-only">Switch to dark theme</span></span>
    <span className="theme-to-light"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></svg><span className="sr-only">Switch to light theme</span></span>
  </button>;
}
