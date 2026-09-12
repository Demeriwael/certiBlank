"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export function ClaimProgress({ returnTo }: { returnTo: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const started = useRef(false);
  const alert = useRef<HTMLDivElement>(null);
  const claim = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/account/claim", { method: "POST" });
      if (!response.ok) throw new Error("Unable to link your practice progress. Retry to keep your session attached to this account.");
      window.location.replace(returnTo);
    } catch { setError("Unable to link your practice progress. Your saved attempt is still intact. Please retry."); }
    finally { setBusy(false); }
  }, [returnTo]);
  useEffect(() => { if (!started.current) { started.current = true; void claim(); } }, [claim]);
  useEffect(() => { if (error) alert.current?.focus(); }, [error]);
  return <section className="auth-card"><h1>Bringing your progress with you.</h1><p role="status">{busy ? "Linking your practice history to your account…" : "Finish connecting your practice history."}</p>{error && <div ref={alert} tabIndex={-1} role="alert" className="auth-error">{error}</div>}<button className="primary-button" disabled={busy} onClick={claim}>Retry linking progress</button></section>;
}
