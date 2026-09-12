"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AccountIcon } from "./account-icon";
export function ClaimProgress({ returnTo }: { returnTo: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const started = useRef(false);
  const alert = useRef<HTMLDivElement>(null);
  const claim = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/account/claim", { method: "POST", signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error("Claim failed");
      const result = await response.json();
      try { sessionStorage.setItem("certi-auth-notice", result.count > 0 ? "Progress saved to your account. You're ready to continue." : "You're signed in. Welcome back."); } catch { /* A confirmation is optional; never block returning to practice. */ }
      window.location.replace(returnTo);
    } catch { setError("You're signed in, but we couldn't bring your practice history over yet. Your saved session is safe. Check your connection and try again."); setBusy(false); }
  }, [returnTo]);
  useEffect(() => { if (!started.current) { started.current = true; void claim(); } }, [claim]);
  useEffect(() => { if (error) alert.current?.focus(); }, [error]);
  return <section className="auth-card auth-transition"><div className="auth-transition-symbol">{busy ? <span className="auth-spinner" /> : <AccountIcon name="shield" />}</div><span className="auth-kicker">RIGHT WHERE YOU LEFT OFF</span><h1>{error ? "Let's try that again." : "Getting your next step ready."}</h1><p role="status">{busy ? "Just a moment. Your practice history is coming with you." : "Finish saving your progress to continue."}</p>{error && <><div ref={alert} tabIndex={-1} role="alert" className="auth-error">{error}</div><button className="primary-button auth-submit" onClick={claim}>Try again<AccountIcon name="arrow" /></button></>}</section>;
}

