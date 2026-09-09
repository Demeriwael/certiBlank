"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Brand } from "@/components/brand";
import { ExamWorkspace } from "@/components/exam/ExamWorkspace";
import { ExamIcon } from "@/components/exam/ExamIcon";
import { ExamSync, restoreDraft, type Draft } from "@/lib/exam-sync";
import type { AttemptView, Domain, MockConfig } from "@/lib/exam-contract";
type Setup = { title: string; config: MockConfig | null; domains: (Domain & { available: number; required: number })[]; available: number; mockReady: boolean };
async function api(url: string, body?: unknown) {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000), keepalive: Boolean(body), ...(body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
  const data = await response.json(); if (!response.ok) throw Object.assign(new Error(data.error ?? "Something went wrong. Please retry."), { status: response.status }); return data;
}
export default function ExamSetup({ certSlug }: { certSlug: string }) {
  const [setup, setSetup] = useState<Setup | null>(null);
  const [attempt, setAttempt] = useState<AttemptView | null>(null);
  const [examMode, setExamMode] = useState<"mock" | "domain">("domain");
  const [domains, setDomains] = useState<string[]>([]);
  const [limit, setLimit] = useState(10);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const deadline = useRef<number | null>(null);
  const active = useRef<AttemptView | null>(null);
  const saving = useRef(false);
  const sync = useRef<ExamSync | null>(null);
  const [checking, setChecking] = useState<string | null>(null);
  const serverTime = useRef("");
  const storageKey = `certi-attempt:${certSlug}`;
  const draftKey = `${storageKey}:draft`;
  const accept = useCallback((value: AttemptView) => {
    active.current = value; setAttempt(value);
    if (serverTime.current !== value.serverNow) {
      serverTime.current = value.serverNow;
      deadline.current = value.expiresAt ? Date.now() + Math.max(0, Date.parse(value.expiresAt) - Date.parse(value.serverNow)) : null;
      setTimeRemaining(deadline.current === null ? null : Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)));
    }
  }, []);
  const install = useCallback((value: AttemptView) => {
    sync.current?.dispose();
    accept(value);
    sync.current = new ExamSync(value, {
      send: (id, body) => api(`/api/exams/${id}`, body),
      publish: accept,
      onError: setError,
      persist: draft => {
        try {
          if (draft) sessionStorage.setItem(draftKey, JSON.stringify(draft));
          else sessionStorage.removeItem(draftKey);
        } catch { setError("Browser storage is unavailable. Keep this tab open until your connection is restored."); }
      },
    });
  }, [accept, draftKey]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data: Setup = await api(`/api/exams?certSlug=${encodeURIComponent(certSlug)}`);
        if (cancelled) return;
        setSetup(data); setDomains(data.domains.filter(d => d.available).map(d => d.id));
        const saved = sessionStorage.getItem(storageKey);
        if (saved) { const value = await api(`/api/exams/${saved}`); if (!cancelled) { install(value); const draft = restoreDraft(value, sessionStorage.getItem(draftKey)); if (draft) sync.current?.edit(draft); } }
      } catch (e) { if (!cancelled) setError((e as Error).message); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; sync.current?.dispose(); };
  }, [certSlug, storageKey, draftKey, install]);
  useEffect(() => {
    const interval = setInterval(async () => {
      if (deadline.current === null || !active.current || active.current.isSubmitted) return;
      const remaining = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)); setTimeRemaining(remaining);
      if (remaining === 0 && !saving.current) {
        saving.current = true; setBusy(true);
        try { await sync.current?.action("submit"); }
        catch { setError("Time is up. Reconnecting to finalize your saved answers…"); }
        finally { saving.current = false; setBusy(false); }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  async function start() {
    setBusy(true); setError("");
    try { const value = await api("/api/exams", { certSlug, mode: examMode, domains, limit }); sessionStorage.removeItem(draftKey); install(value); sessionStorage.setItem(storageKey, value.id); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  useEffect(() => {
    const flush = () => { void sync.current?.flush().catch(() => {}); };
    const hidden = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("online", flush);
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("online", flush);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);
  async function change(patch: Partial<Draft>, action: "save" | "check" | "submit" = "save") {
    if (!sync.current || !active.current) return;
    if (action === "save") { sync.current.edit(patch); return; }
    const index = active.current.currentIndex;
    if (action === "check") setChecking(active.current.questions[index].id);
    else { saving.current = true; setBusy(true); }
    try { await sync.current.action(action, action === "check" ? index : undefined); }
    catch { /* The queue retains the draft and surfaces the connection error. */ }
    finally { setChecking(null); if (action === "submit") { saving.current = false; setBusy(false); } }
  }
  function restart() { sync.current?.dispose(); sync.current = null; sessionStorage.removeItem(storageKey); sessionStorage.removeItem(draftKey); active.current = null; deadline.current = null; setAttempt(null); setError(""); }
  const available = setup?.domains.filter(d => domains.includes(d.id)).reduce((sum, d) => sum + d.available, 0) ?? 0;
  if (attempt) return <ExamWorkspace key={attempt.id} attempt={attempt} timeRemaining={timeRemaining} busy={busy} checking={checking} error={error} onChange={change} onRestart={restart} />;
  return <div className="site-shell exam-setup-shell">
    <header className="site-header"><Brand /><Link className="nav-link" href="/certifications">All certifications <ExamIcon name="external" /></Link></header>
    <main className="exam-main">
      <Link href="/certifications" className="back-link"><ExamIcon name="previous" />Certification catalog</Link>
      <div className="exam-heading"><div><div className="eyebrow section-kicker">CERTI / YOUR NEXT MILESTONE</div><h1>{setup?.title ?? "Prepare with purpose."}</h1></div></div>
      {error && <div className="exam-error" role="alert">{error} <button onClick={() => window.location.reload()}>Reload</button><button onClick={restart}>Clear saved session</button></div>}
      {loading ? <div className="exam-card" role="status">Loading your question bank…</div> : <>
        <p className="exam-intro">Build understanding. Then put it to the test. Choose how you want to prepare today.</p>
        {!setup?.config || !setup.available ? <div className="exam-card"><h2>Fresh questions are on the way.</h2><p>This certification needs an updated question bank before these practice modes become available.</p></div> : <>
          <div className="mode-grid">{(["domain", "mock"] as const).map(mode => <button key={mode} className={`mode-card ${examMode === mode ? "selected" : ""}`} aria-pressed={examMode === mode} onClick={() => setExamMode(mode)}><span className="mode-icon"><ExamIcon name={mode === "domain" ? "book" : "clock"} /></span><small>{mode === "domain" ? "LEARN & REFINE" : "SIMULATE & ASSESS"}</small><h2>{mode === "domain" ? "Domain practice" : "Timed mock exam"}</h2><p>{mode === "domain" ? "Focus on specific domains. Get instant feedback and understand every option after submitting your answer." : "A focused exam session. Save your answers, flag uncertainties, and review before you submit."}</p><span className="mode-meta">{mode === "domain" ? "Your pace · Immediate explanations" : `${setup.config!.questionCount} questions · ${setup.config!.durationSeconds/60} minutes`}</span></button>)}</div>
          <section className="exam-card setup-controls"><div className="eyebrow section-kicker">{examMode === "domain" ? "MAKE IT YOURS" : "EXAM BRIEFING"}</div><h2>{examMode === "domain" ? "Where do you want to focus?" : "Ready for the full picture?"}</h2>
            {examMode === "domain" ? <><div className="domain-options">{setup.domains.map(d => <label key={d.id}><input type="checkbox" checked={domains.includes(d.id)} disabled={!d.available} onChange={e => setDomains(e.target.checked ? [...domains,d.id] : domains.filter(id => id !== d.id))}/><span>{d.name}<small>{d.available} questions available</small></span><b>{d.weightPercent}% of blueprint</b></label>)}</div><div className="start-row"><label>Session length<select value={limit} onChange={e => setLimit(Number(e.target.value))}>{[5,10,20,30,50].map(n => <option key={n} value={n}>{n} questions</option>)}</select></label><button className="primary-button" disabled={busy || !available} onClick={start}>{busy ? "Preparing…" : `Start ${Math.min(limit,available)} questions`}</button></div></> : <><div className="mock-facts"><div><strong>{setup.config.questionCount}</strong><span>Blueprint-weighted questions</span></div><div><strong>{setup.config.durationSeconds/60} min</strong><span>Timer continues on refresh</span></div><div><strong>{setup.config.scoring.passingScore}</strong><span>Practice passing score</span></div></div><p>Answers and explanations appear after submission. Multiple-response questions require every correct option; no partial credit. Unanswered questions count as incorrect. Time expiry submits your saved answers automatically.</p><p className="scoring-note">The linear {setup.config.scoring.minimumScore}–{setup.config.scoring.maximumScore} score is a practice estimate, not the vendor’s official scoring model.</p>{!setup.mockReady && <p role="status">More questions are needed to fill the blueprint: {setup.domains.filter(d => d.available < d.required).map(d => `${d.name} (${d.available}/${d.required})`).join(", ")}.</p>}<button className="primary-button" disabled={busy || !setup.mockReady} onClick={start}>{busy ? "Preparing…" : "Begin timed exam"}</button></>}
          </section></>}

      </>}
    </main>
  </div>;
}
