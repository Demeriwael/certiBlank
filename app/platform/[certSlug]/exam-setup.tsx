"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Brand } from "@/components/brand";
import { ExamSync, restoreDraft, type Draft } from "@/lib/exam-sync";
import type { AttemptView, Domain, MockConfig, Review } from "@/lib/exam-contract";
type Setup = { title: string; config: MockConfig | null; domains: (Domain & { available: number; required: number })[]; available: number; mockReady: boolean };
async function api(url: string, body?: unknown) {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000), keepalive: Boolean(body), ...(body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
  const data = await response.json(); if (!response.ok) throw Object.assign(new Error(data.error ?? "Something went wrong. Please retry."), { status: response.status }); return data;
}
function Explanation({ question }: { question: Review }) {
  return <div className={`exam-feedback ${question.correct ? "is-correct" : "is-wrong"}`}>
    <strong>{question.correct ? "Correct answer" : question.userAnswer.length ? "Not quite" : "Unanswered"}</strong>
    <p>{question.correctExplanation}</p>
    <div className="answer-breakdown">{question.options.map(option => <div key={option.id}><b>{question.correctOptionIds.includes(option.id) ? "✓ Correct" : "✕ Distractor"}{question.userAnswer.includes(option.id) ? " · Your selection" : ""}</b><span>{option.text}</span>{question.distractorExplanations[option.id] && <p>{question.distractorExplanations[option.id]}</p>}</div>)}</div>
    <a href={question.referenceUrl} target="_blank" rel="noopener noreferrer">Read the vendor documentation ↗</a>
  </div>;
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
  const [reviewing, setReviewing] = useState(false);
  const [drawer, setDrawer] = useState(false);
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
  useEffect(() => {
    if (!active.current) return;
    const target = document.getElementById(reviewing ? "review-title" : "question-title") ?? document.getElementById("exam-title");
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [attempt?.id, attempt?.currentIndex, attempt?.isSubmitted, reviewing]);
  async function start() {
    setBusy(true); setError("");
    try { const value = await api("/api/exams", { certSlug, mode: examMode, domains, limit }); sessionStorage.removeItem(draftKey); install(value); sessionStorage.setItem(storageKey, value.id); setReviewing(false); }
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
  function restart() { sync.current?.dispose(); sync.current = null; sessionStorage.removeItem(storageKey); sessionStorage.removeItem(draftKey); active.current = null; deadline.current = null; setAttempt(null); setReviewing(false); setError(""); }
  const currentQuestionIndex = attempt?.currentIndex ?? 0;
  const userAnswers = attempt?.answers ?? {};
  const flaggedQuestions = new Set(attempt?.flagged ?? []);
  const isSubmitted = attempt?.isSubmitted ?? false;
  const question = attempt?.questions[currentQuestionIndex];
  const selected = question ? userAnswers[question.id] ?? [] : [];
  const feedback = question ? attempt?.feedback[question.id] : undefined;
  const answered = attempt?.questions.filter(q => userAnswers[q.id]?.length === q.selectionCount).length ?? 0;
  const disabled = busy || (attempt?.mode === "mock" && timeRemaining === 0);
  const available = setup?.domains.filter(d => domains.includes(d.id)).reduce((sum,d) => sum+d.available,0) ?? 0;
  function jump(index: number) { setReviewing(false); setDrawer(false); void change({ currentIndex: index }); }
  function grid() { return <div className="question-grid">{attempt?.questions.map((q,i) => <button key={q.id} disabled={disabled} onClick={() => jump(i)} aria-label={`Question ${i+1}, ${userAnswers[q.id]?.length === q.selectionCount ? "answered" : "unanswered"}${flaggedQuestions.has(q.id) ? ", flagged" : ""}`} aria-current={i === currentQuestionIndex ? "step" : undefined} className={`${userAnswers[q.id]?.length === q.selectionCount ? "answered" : ""} ${flaggedQuestions.has(q.id) ? "flagged" : ""}`}>{i+1}{flaggedQuestions.has(q.id) && <sup>⚑</sup>}</button>)}</div>; }
  return <div className="site-shell"><header className="site-header"><Brand/><Link className="nav-link" href="/certifications">All certifications ↗</Link></header>
    <main className="exam-main"><Link href="/certifications" className="back-link">← Certification catalog</Link>
      <div className={`exam-heading ${attempt && !isSubmitted ? "in-session" : ""}`}><div><div className="eyebrow section-kicker">CERTI / {attempt ? attempt.mode === "mock" ? "MOCK EXAM" : "DOMAIN PRACTICE" : "YOUR NEXT MILESTONE"}</div><h1 id="exam-title" tabIndex={-1}>{setup?.title ?? "Prepare with purpose."}</h1></div>{attempt && !isSubmitted && <div className={`exam-clock ${timeRemaining !== null && timeRemaining < 300 ? "urgent" : ""}`}><small>{timeRemaining === null ? "YOUR PACE" : "TIME REMAINING"}</small><strong>{timeRemaining === null ? "Untimed" : `${Math.floor(timeRemaining/60).toString().padStart(2,"0")}:${(timeRemaining%60).toString().padStart(2,"0")}`}</strong></div>}</div>
      {error && <div className="exam-error" role="alert">{error} <button onClick={() => window.location.reload()}>Reload</button>{!attempt && <button onClick={restart}>Clear saved session</button>}</div>}
      {loading ? <div className="exam-card" role="status">Loading your question bank…</div> : !attempt ? <>
        <p className="exam-intro">Build understanding. Then put it to the test. Choose how you want to prepare today.</p>
        {!setup?.config || !setup.available ? <div className="exam-card"><h2>Fresh questions are on the way.</h2><p>This certification needs an updated question bank before these practice modes become available.</p></div> : <>
          <div className="mode-grid">{(["domain", "mock"] as const).map(mode => <button key={mode} className={`mode-card ${examMode === mode ? "selected" : ""}`} aria-pressed={examMode === mode} onClick={() => setExamMode(mode)}><span className="mode-icon">{mode === "domain" ? "◎" : "◷"}</span><small>{mode === "domain" ? "LEARN & REFINE" : "SIMULATE & ASSESS"}</small><h2>{mode === "domain" ? "Domain practice" : "Timed mock exam"}</h2><p>{mode === "domain" ? "Focus on specific domains. Get instant feedback and understand every option after submitting your answer." : "A focused exam session. Save your answers, flag uncertainties, and review before you submit."}</p><span className="mode-meta">{mode === "domain" ? "Your pace · Immediate explanations" : `${setup.config!.questionCount} questions · ${setup.config!.durationSeconds/60} minutes`}</span></button>)}</div>
          <section className="exam-card setup-controls"><div className="eyebrow section-kicker">{examMode === "domain" ? "MAKE IT YOURS" : "EXAM BRIEFING"}</div><h2>{examMode === "domain" ? "Where do you want to focus?" : "Ready for the full picture?"}</h2>
            {examMode === "domain" ? <><div className="domain-options">{setup.domains.map(d => <label key={d.id}><input type="checkbox" checked={domains.includes(d.id)} disabled={!d.available} onChange={e => setDomains(e.target.checked ? [...domains,d.id] : domains.filter(id => id !== d.id))}/><span>{d.name}<small>{d.available} questions available</small></span><b>{d.weightPercent}% of blueprint</b></label>)}</div><div className="start-row"><label>Session length<select value={limit} onChange={e => setLimit(Number(e.target.value))}>{[5,10,20,30,50].map(n => <option key={n} value={n}>{n} questions</option>)}</select></label><button className="primary-button" disabled={busy || !available} onClick={start}>{busy ? "Preparing…" : `Start ${Math.min(limit,available)} questions →`}</button></div></> : <><div className="mock-facts"><div><strong>{setup.config.questionCount}</strong><span>Blueprint-weighted questions</span></div><div><strong>{setup.config.durationSeconds/60} min</strong><span>Timer continues on refresh</span></div><div><strong>{setup.config.scoring.passingScore}</strong><span>Practice passing score</span></div></div><p>Answers and explanations appear after submission. Multiple-response questions require every correct option; no partial credit. Unanswered questions count as incorrect. Time expiry submits your saved answers automatically.</p><p className="scoring-note">The linear {setup.config.scoring.minimumScore}–{setup.config.scoring.maximumScore} score is a practice estimate, not the vendor’s official scoring model.</p>{!setup.mockReady && <p role="status">More questions are needed to fill the blueprint: {setup.domains.filter(d => d.available < d.required).map(d => `${d.name} (${d.available}/${d.required})`).join(", ")}.</p>}<button className="primary-button" disabled={busy || !setup.mockReady} onClick={start}>{busy ? "Preparing…" : "Begin timed exam →"}</button></>}
          </section></>}
      </> : isSubmitted && attempt.results ? <section className="exam-results"><div className="exam-card result-hero"><div><div className="eyebrow section-kicker">SESSION COMPLETE</div><h2>{attempt.results.passed ? "Progress worth building on." : "Your next steps are clearer."}</h2><p>{attempt.results.correct} of {attempt.results.total} correct · {attempt.results.percentage}% accuracy</p></div><div className="score-number">{attempt.results.scaledScore}<small>{attempt.results.passed ? "PASS" : "BELOW THRESHOLD"} · target {attempt.results.passingScore}</small></div></div><p className="scoring-note">Practice estimate using linear scaling; this is not an official vendor score.</p><div className="domain-results">{attempt.results.domains.filter(d => d.total).sort((a,b) => (a.accuracy ?? 0)-(b.accuracy ?? 0)).map(d => <div className="exam-card" key={d.id}><h3>{d.name}</h3><strong>{d.accuracy}%</strong><div className="accuracy-track"><span style={{width:`${d.accuracy}%`}}/></div><small>{d.correct} of {d.total} correct{(d.accuracy ?? 0)<70 ? " · Focus area" : ""}</small></div>)}</div><div className="results-heading"><h2>Your answer review</h2><button className="secondary-button" onClick={restart}>New session ↗</button></div>{attempt.results.review.map((q,i) => <details className="exam-card result-question" key={q.id}><summary><span className={q.correct ? "correct-label" : "wrong-label"}>{q.correct ? "✓" : "✕"} {i+1}</span>{q.questionText}</summary><Explanation question={q}/></details>)}</section> : question && <>
        <div className="exam-toolbar"><span>Question <b>{currentQuestionIndex+1}</b> / {attempt.questions.length}</span><span>{answered} answered · {flaggedQuestions.size} flagged</span><button disabled={disabled} onClick={() => setDrawer(!drawer)} aria-expanded={drawer}>Question navigator ▦</button></div>
        <div className="exam-progress"><span style={{width:`${answered/attempt.questions.length*100}%`}}/></div>
        {drawer && <section className="exam-card navigator"><div className="results-heading"><h3>Jump to a question</h3><button onClick={() => setDrawer(false)}>Close ×</button></div><p>Filled = answered · ⚑ = flagged · outlined = current</p>{grid()}</section>}
        {reviewing ? <section className="exam-card"><div className="eyebrow section-kicker">ONE LAST LOOK</div><h2 id="review-title" tabIndex={-1}>Review before submitting</h2><p>{answered} answered · {attempt.questions.length-answered} unanswered or incomplete · {flaggedQuestions.size} flagged</p><p>Select a question to revisit it. Submission locks your answers and reveals your results.</p>{grid()}<div className="exam-actions"><button className="secondary-button" disabled={disabled} onClick={() => setReviewing(false)}>Back to questions</button><button className="primary-button" disabled={disabled} onClick={() => change({},"submit")}>{busy ? "Calculating results…" : "Submit final answers →"}</button></div></section> : <section className="exam-card question-card"><div className="question-meta"><span>{attempt.domains.find(d => d.id === question.domain)?.name}</span><button disabled={disabled} aria-pressed={flaggedQuestions.has(question.id)} onClick={() => change({flagged: flaggedQuestions.has(question.id) ? attempt.flagged.filter(id => id !== question.id) : [...attempt.flagged,question.id]})}>{flaggedQuestions.has(question.id) ? "⚑ Flagged" : "⚐ Flag for review"}</button></div><h2 id="question-title" tabIndex={-1}>{question.questionText}</h2><p className="selection-help">{question.type === "multiple" ? `Select ${question.selectionCount} options` : "Select one answer"} · {selected.length}/{question.selectionCount} selected</p><fieldset className="exam-options" aria-labelledby="question-title" disabled={disabled || !!feedback || checking === question.id}><legend className="sr-only">Answer options</legend>{question.options.map((option,i) => <label key={option.id} className={`${selected.includes(option.id) ? "chosen" : ""} ${feedback?.correctOptionIds.includes(option.id) ? "correct-option" : ""}`}><input type={question.type === "single" ? "radio" : "checkbox"} name={question.id} checked={selected.includes(option.id)} disabled={!selected.includes(option.id) && question.type === "multiple" && selected.length >= question.selectionCount} onChange={() => change({answers:{...userAnswers,[question.id]: question.type === "single" ? [option.id] : selected.includes(option.id) ? selected.filter(id => id !== option.id) : [...selected,option.id]}})}/><span className="option-letter">{String.fromCharCode(65+i)}</span><span>{option.text}</span></label>)}</fieldset>
          {attempt.mode === "domain" && !feedback && <div className="check-row">{question.hint && <details><summary>Need a hint?</summary><p>{question.hint}</p></details>}<button className="primary-button" disabled={disabled || !!checking || selected.length !== question.selectionCount} onClick={() => change({},"check")}>{checking === question.id ? "Checking answer…" : "Check answer →"}</button></div>}
          {feedback && <div aria-live="polite"><Explanation question={feedback}/></div>}
          <div className="exam-actions"><button className="secondary-button" disabled={disabled || currentQuestionIndex === 0} onClick={() => jump(currentQuestionIndex-1)}>← Previous</button>{currentQuestionIndex < attempt.questions.length-1 ? <button className="primary-button" disabled={disabled} onClick={() => jump(currentQuestionIndex+1)}>Next question →</button> : <button className="primary-button" disabled={disabled} onClick={() => setReviewing(true)}>Review session →</button>}</div>
        </section>}
        {!reviewing && <button className="exam-review-link" disabled={disabled} onClick={() => setReviewing(true)}>Review & finish session ↗</button>}
      </>}
    </main></div>;
}
