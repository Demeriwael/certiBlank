"use client";
import { useEffect, useRef } from "react";
import type { AttemptView } from "@/lib/exam-contract";
import { ExamIcon } from "./ExamIcon";

export function QuestionPalette({ attempt, currentIndex, onJump, disabled = false }: { attempt: AttemptView; currentIndex: number; onJump: (index: number) => void; disabled?: boolean }) {
  return <div className="qx-palette">{attempt.questions.map((q, index) => {
    const answered = attempt.answers[q.id]?.length === q.selectionCount;
    const flagged = attempt.flagged.includes(q.id);
    const feedback = attempt.isSubmitted ? attempt.feedback[q.id] : undefined;
    const status = feedback ? feedback.correct ? "Correct" : "Incorrect" : answered ? "Answered" : "Unanswered";
    return <button type="button" key={q.id} disabled={disabled} onClick={() => onJump(index)} aria-current={index === currentIndex ? "step" : undefined} aria-label={`Question ${index + 1}: ${status}${flagged ? ", flagged for review" : ""}`} className={`${answered ? "is-answered" : ""} ${flagged ? "is-flagged" : ""}`}>
      <span>{index + 1}</span>{flagged && <ExamIcon name="flag" className="qx-palette-flag" />}{feedback && <span className={`qx-result-dot ${feedback.correct ? "correct" : "incorrect"}`}><ExamIcon name={feedback.correct ? "check" : "close"} /></span>}
    </button>;
  })}</div>;
}
export function QuestionGridDrawer({ open, attempt, currentIndex, disabled, onClose, onJump, shortcuts, setShortcuts }: {
  open: boolean; attempt: AttemptView; currentIndex: number; disabled: boolean; onClose: () => void; onJump: (index: number) => void; shortcuts: boolean; setShortcuts: (value: boolean) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!open || !dialog.current) return;
    const element = dialog.current;
    const trigger = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element.showModal(); document.body.style.overflow = "hidden";
    return () => { element.close(); document.body.style.overflow = overflow; if (trigger?.isConnected) trigger.focus({ preventScroll: true }); };
  }, [open]);
  return <dialog ref={dialog} className="qx-drawer" aria-labelledby="question-drawer-title" aria-describedby="question-drawer-help" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); } }} onKeyDown={event => {
    if (event.key !== "Tab") return;
    const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),a[href],[tabindex="0"]')];
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }}>
    <div className="qx-drawer-inner"><header><div><div className="qx-section-label">YOUR SESSION</div><h2 id="question-drawer-title">Question navigator</h2></div><button className="qx-icon-button" onClick={onClose} aria-label="Close question navigator"><ExamIcon name="close" /></button></header>
      <p id="question-drawer-help">Jump to any question. Your selections stay with you.</p>
      <div className="qx-legend"><span><i />Unanswered</span><span><i className="answered" />Answered</span><span><ExamIcon name="flag" />Flagged</span>{attempt.isSubmitted && <><span><i className="correct" />Correct</span><span><i className="incorrect" />Incorrect</span></>}</div>
      <QuestionPalette attempt={attempt} currentIndex={currentIndex} disabled={disabled} onJump={index => { onClose(); onJump(index); }} />
      <div className="qx-shortcut-panel"><div><ExamIcon name="keyboard" /><h3>Keyboard shortcuts</h3></div><label><input type="checkbox" checked={shortcuts} onChange={event => setShortcuts(event.target.checked)} />Enable keyboard shortcuts</label><dl><div><dt><kbd>1–4</kbd> / <kbd>A–D</kbd></dt><dd>Select an answer</dd></div><div><dt><kbd>F</kbd></dt><dd>Flag for review</dd></div><div><dt><kbd><ExamIcon name="previous" /><span className="sr-only">Left arrow</span></kbd> <kbd><ExamIcon name="next" /><span className="sr-only">Right arrow</span></kbd></dt><dd>Previous / next</dd></div><div><dt><kbd>Enter</kbd></dt><dd>Next question</dd></div></dl><p>Shortcuts pause in dialogs and text fields. Enter on a focused control keeps its normal action.</p></div>
    </div>
  </dialog>;
}
