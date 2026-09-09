"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { AttemptView } from "@/lib/exam-contract";
import type { Draft } from "@/lib/exam-sync";
import { shortcut, timerLevel } from "@/lib/exam-ui";
import { Brand } from "@/components/brand";
import { ExamIcon } from "./ExamIcon";
import { QuestionCard } from "./QuestionCard";
import { QuestionGridDrawer, QuestionPalette } from "./QuestionGridDrawer";
import { QuizFooter } from "./QuizFooter";
import "./exam-workspace.css";

type Props = {
  attempt: AttemptView; timeRemaining: number | null; busy: boolean; checking: string | null; error: string;
  onChange: (patch: Partial<Draft>, action?: "save" | "check" | "submit") => Promise<void>;
  onRestart: () => void;
};
export function ExamWorkspace({ attempt, timeRemaining, busy, checking, error, onChange, onRestart }: Props) {
  const [drawer, setDrawer] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);
  const [shortcuts, setShortcuts] = useState(() => {
    try { return typeof window === "undefined" || localStorage.getItem("certi-keyboard-shortcuts") !== "off"; }
    catch { return true; }
  });
  const index = attempt.isSubmitted ? reviewIndex ?? 0 : attempt.currentIndex;
  const question = attempt.questions[index];
  const feedback = attempt.feedback[question.id];
  const selected = attempt.answers[question.id] ?? [];
  const flagged = attempt.flagged.includes(question.id);
  const answered = attempt.questions.filter(q => attempt.answers[q.id]?.length === q.selectionCount).length;
  const disabled = busy || (!attempt.isSubmitted && attempt.mode === "mock" && timeRemaining === 0);
  const summary = attempt.isSubmitted && reviewIndex === null;
  const confirmation = confirming && !attempt.isSubmitted;
  const domain = attempt.domains.find(d => d.id === question.domain)?.name ?? question.domain;
  const level = timerLevel(timeRemaining);
  const modeLabel = attempt.mode === "domain" ? "Domain practice" : "Full timed mock exam";
  const time = timeRemaining === null ? "Untimed" : `${Math.floor(timeRemaining / 60).toString().padStart(2, "0")}:${(timeRemaining % 60).toString().padStart(2, "0")}`;

  function toggleShortcuts(value: boolean) {
    setShortcuts(value);
    try { localStorage.setItem("certi-keyboard-shortcuts", value ? "on" : "off"); } catch { /* Preference remains active for this session. */ }
  }
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(summary ? "results-title" : confirmation ? "review-title" : "question-title");
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: "start", behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [index, summary, confirmation]);

  function jump(next: number) {
    if (disabled || next < 0 || next >= attempt.questions.length) return;
    setConfirming(false); setDrawer(false);
    if (attempt.isSubmitted) setReviewIndex(next);
    else void onChange({ currentIndex: next });
  }
  function next() {
    if (index < attempt.questions.length - 1) jump(index + 1);
    else if (attempt.isSubmitted) setReviewIndex(null);
    else setConfirming(true);
  }
  function flag() {
    if (disabled || attempt.isSubmitted) return;
    void onChange({ flagged: flagged ? attempt.flagged.filter(id => id !== question.id) : [...attempt.flagged, question.id] });
  }
  function choose(id: string) {
    if (disabled || feedback || checking === question.id || attempt.isSubmitted) return;
    if (question.type === "multiple" && !selected.includes(id) && selected.length >= question.selectionCount) return;
    const choices = question.type === "single" ? [id] : selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id];
    void onChange({ answers: { ...attempt.answers, [question.id]: choices } });
  }
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (!shortcuts || drawer || confirmation || summary || disabled || event.repeat || event.isComposing || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('textarea,select,[contenteditable="true"],input:not([type="radio"]):not([type="checkbox"])')) return;
      const action = shortcut(event.key);
      if (!action) return;
      // Preserve native button activation and radio-group arrow navigation.
      if (target?.closest("button,a,summary,input") && (event.key === "Enter" || event.key.startsWith("Arrow"))) return;
      if (target?.closest('input[type="checkbox"]') && !target.closest(".qx-options")) return;
      event.preventDefault();
      if (action.type === "option") { const option = question.options[action.index]; if (option) choose(option.id); }
      else if (action.type === "flag") flag();
      else if (action.type === "previous") jump(index - 1);
      else next();
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  });

  const reveal = attempt.mode === "domain" && !feedback && !attempt.isSubmitted;
  const results = attempt.results;
  return <div className="qx-workspace">
    <a className="qx-skip" href="#qx-main">Skip to exam content</a>
    <header className="qx-hud">
      <div className="qx-hud-top"><Brand /><span className="qx-hud-divider" /><div className="qx-hud-title"><h1>{attempt.title}</h1><div className={`qx-mode ${attempt.mode}`}><ExamIcon name={attempt.mode === "domain" ? "book" : "shield"} />{modeLabel}<span>{attempt.mode === "domain" ? "Instant feedback" : "Exam simulation"}</span></div></div>
        <div className={`qx-timer ${level}`} role="timer" aria-live="off" aria-label={attempt.isSubmitted ? "Session complete" : `Time remaining: ${time}`}><ExamIcon name="clock" /><div><small>{attempt.isSubmitted ? "SESSION" : timeRemaining === null ? "AT YOUR PACE" : "TIME REMAINING"}</small><strong>{attempt.isSubmitted ? "Complete" : time}</strong></div></div>
        <button className="qx-button qx-navigator-button" aria-label="Questions" onClick={() => setDrawer(true)} aria-haspopup="dialog" aria-expanded={drawer}><ExamIcon name="grid" /><span>Questions</span></button>
      </div>
      <div className="qx-hud-bottom"><span>Question <b>{index + 1}</b> of {attempt.questions.length}</span><div className="qx-hud-progress" role="progressbar" aria-label="Answered questions" aria-valuemin={0} aria-valuemax={attempt.questions.length} aria-valuenow={answered} aria-valuetext={`${answered} of ${attempt.questions.length} answered`}><span style={{ width: `${answered / attempt.questions.length * 100}%` }} /></div><span className="qx-completed">{answered} answered</span><button onClick={() => setDrawer(true)} className="qx-flag-count" aria-label={`${attempt.flagged.length} flagged questions. Open navigator`}><ExamIcon name="flag" />{attempt.flagged.length}<span>flagged</span></button></div>
    </header>
    <span className="sr-only" role="status">{attempt.isSubmitted || timeRemaining === null ? "" : level === "critical" ? "Two minutes or less remaining. Your saved answers will be submitted when time expires." : level === "warning" ? "Ten minutes or less remaining." : ""}</span>
    <main id="qx-main" tabIndex={-1} className={`qx-main ${summary ? "qx-summary-layout" : ""}`}>
      {error && <div className="qx-error" role="alert">{error}<button className="qx-button" onClick={() => window.location.reload()}>Reload session</button></div>}
      {summary && results ? <section className="qx-results">
        <div className="qx-results-hero"><div><div className="qx-section-label">SESSION COMPLETE</div><h1 id="results-title" tabIndex={-1}>{results.passed ? "A strong step forward." : "Turn insight into progress."}</h1><p>{results.correct} of {results.total} correct. Your next study session starts with what you learned here.</p></div><div className="qx-score"><strong>{results.scaledScore}</strong><span>{results.passed ? "Practice pass" : "Below practice threshold"}</span><small>Target {results.passingScore}</small></div></div>
        <p className="qx-score-note">Linear practice estimate; not an official vendor score.</p>
        <div className="qx-domain-results">{results.domains.filter(d => d.total).sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0)).map(d => <div key={d.id}><span>{d.name}</span><strong>{d.accuracy}%</strong><div className="qx-mini-track"><span style={{ width: `${d.accuracy}%` }} /></div><small>{d.correct} of {d.total} correct</small></div>)}</div>
        <div className="qx-results-heading"><h2>Review your answers</h2><button className="qx-button qx-primary" onClick={onRestart}>New session<ExamIcon name="next" /></button></div>
        <div className="qx-result-list">{results.review.map((q, i) => <button key={q.id} onClick={() => jump(i)}><span className={`qx-result-symbol ${q.correct ? "correct" : "incorrect"}`}><ExamIcon name={q.correct ? "check" : "close"} /><span className="sr-only">{q.correct ? "Correct" : q.userAnswer.length ? "Incorrect" : "Unanswered"}</span></span><span><small>QUESTION {i + 1}{attempt.flagged.includes(q.id) ? " · FLAGGED" : ""}</small>{q.questionText}</span><ExamIcon name="next" /></button>)}</div>
      </section> : <>
        <div className="qx-content">{confirmation ? <section className="qx-confirmation"><div className="qx-section-label">BEFORE YOU FINISH</div><h1 id="review-title" tabIndex={-1}>A final look at your session.</h1><p>Revisit any question below, or submit when you’re ready. Submission locks your answers and opens your full review.</p><div className="qx-review-counts"><div><strong>{answered}</strong><span>Answered</span></div><div><strong>{attempt.questions.length - answered}</strong><span>Unanswered or incomplete</span></div><div><strong>{attempt.flagged.length}</strong><span>Flagged</span></div></div><QuestionPalette attempt={attempt} currentIndex={index} onJump={jump} disabled={disabled} /><p>Unanswered and incomplete responses count as incorrect.</p><div className="qx-confirm-actions"><button className="qx-button" disabled={disabled} onClick={() => setConfirming(false)}><ExamIcon name="previous" />Back to question</button><button className="qx-button qx-primary" disabled={disabled} onClick={() => void onChange({}, "submit")} aria-busy={busy}>{busy ? "Calculating results…" : "Submit final answers"}<ExamIcon name="check" /></button></div></section> : <QuestionCard key={question.id} question={question} index={index} domain={domain} selected={selected} feedback={feedback} disabled={disabled || checking === question.id} onSelect={choose} />}</div>
        <aside className="qx-aside" aria-label="Session information"><section><div className="qx-section-label">YOUR PROGRESS</div><div className="qx-aside-count"><strong>{answered}</strong><span>/ {attempt.questions.length} answered</span></div><div className="qx-mini-track"><span style={{ width: `${answered / attempt.questions.length * 100}%` }} /></div><p>{attempt.isSubmitted ? "Explore the reasoning behind each answer." : attempt.mode === "domain" ? "Take your time. Understanding is the goal." : "Stay focused. You can revisit any question before submitting."}</p><button className="qx-button" onClick={() => setDrawer(true)}><ExamIcon name="grid" />Open question navigator</button></section><section className="qx-shortcuts-inline"><div className="qx-section-label"><ExamIcon name="keyboard" />KEYBOARD CONTROLS</div><dl><div><dt><kbd>1–4</kbd> / <kbd>A–D</kbd></dt><dd>Choose an option</dd></div><div><dt><kbd>F</kbd></dt><dd>Flag question</dd></div><div><dt><kbd><ExamIcon name="previous" /><span className="sr-only">Left arrow</span></kbd> <kbd><ExamIcon name="next" /><span className="sr-only">Right arrow</span></kbd></dt><dd>Move between questions</dd></div><div><dt><kbd>Enter</kbd></dt><dd>Next question</dd></div></dl><label><input type="checkbox" checked={shortcuts} onChange={event => toggleShortcuts(event.target.checked)} />Enable shortcuts</label></section><Link href="/certifications" className="qx-catalog-link"><ExamIcon name="previous" />Certification catalog</Link></aside>
      </>}
    </main>
    {!summary && !confirmation && <QuizFooter index={index} total={attempt.questions.length} flagged={flagged} disabled={disabled} isSubmitted={attempt.isSubmitted} checking={checking === question.id} primaryLabel={attempt.isSubmitted ? "Results overview" : reveal ? checking === question.id ? "Checking answer…" : "Reveal answer" : "Review & submit"} primaryDisabled={reveal && (Boolean(checking) || selected.length !== question.selectionCount)} onPrevious={() => jump(index - 1)} onNext={next} onFlag={flag} onPrimary={() => { if (attempt.isSubmitted) setReviewIndex(null); else if (reveal) void onChange({}, "check"); else setConfirming(true); }} />}
    <QuestionGridDrawer open={drawer} attempt={attempt} currentIndex={index} disabled={disabled} onClose={() => setDrawer(false)} onJump={jump} shortcuts={shortcuts} setShortcuts={toggleShortcuts} />
  </div>;
}

