"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true); setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error();
      // Remove this tab's account-specific drafts on shared devices.
      try { Object.keys(sessionStorage).filter(key => key.startsWith("certi-attempt:")).forEach(key => sessionStorage.removeItem(key)); } catch { /* Storage may be disabled. Server access is still revoked. */ }
      router.replace("/login"); router.refresh();
    } catch { setError("Unable to log out. Please try again."); setBusy(false); }
  }
  return <><button className="secondary-button" disabled={busy} onClick={logout}>{busy ? "Logging out…" : "Log out"}</button>{error && <p role="alert">{error}</p>}</>;
}
