"use client";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { confirmedAccountState } from "@/lib/display-preferences";

export function AccountNavigationState() {
  const { data, isPending, error } = authClient.useSession();
  useEffect(() => {
    const next = confirmedAccountState(data, isPending, error);
    if (!next) return;
    document.documentElement.dataset.account = next;
    try { localStorage.setItem("certi-account-hint", next); } catch { /* Cosmetic persistence is optional. */ }
  }, [data, isPending, error]);
  useEffect(() => {
    const update = (event: StorageEvent) => {
      if (event.key === "certi-account-hint") document.documentElement.dataset.account = event.newValue === "member" ? "member" : "guest";
    };
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);
  return null;
}
