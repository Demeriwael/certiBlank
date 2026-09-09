import type { PublicQuestion, Review } from "@/lib/exam-contract";
import { optionLetter, optionState } from "@/lib/exam-ui";
import { ExamIcon } from "./ExamIcon";
import { TechnicalText } from "./TechnicalText";
import { ExplanationPanel } from "./ExplanationPanel";

export function QuestionCard({ question, index, domain, selected, feedback, disabled, onSelect }: {
  question: PublicQuestion; index: number; domain: string; selected: string[]; feedback?: Review; disabled: boolean; onSelect: (id: string) => void;
}) {
  return <article className="qx-question-card">
    <div className="qx-question-meta"><span className="qx-domain"><span aria-hidden="true" />{domain}</span><span>{question.type === "multiple" ? "Multiple response" : "Single choice"}</span></div>
    <div className="qx-section-label qx-question-number">QUESTION {String(index + 1).padStart(2, "0")}</div>
    <h2 id="question-title" tabIndex={-1}><TechnicalText text={question.questionText} /></h2>
    <div className="qx-selection-guide" id="selection-guide"><span>{question.type === "multiple" ? `Select ${question.selectionCount} answers.` : "Select one answer."}</span><span aria-live="polite">{selected.length} of {question.selectionCount} selected</span></div>
    <fieldset className="qx-options" aria-labelledby="question-title" aria-describedby="selection-guide" disabled={disabled || Boolean(feedback)}>
      <legend className="sr-only">Answer options</legend>
      {question.options.map((option, optionIndex) => {
        const state = optionState(option.id, selected, feedback?.correctOptionIds);
        return <label className={`qx-option is-${state}`} key={option.id}>
          <input type={question.type === "single" ? "radio" : "checkbox"} name={`question-${question.id}`} checked={selected.includes(option.id)} onChange={() => onSelect(option.id)} aria-disabled={question.type === "multiple" && selected.length >= question.selectionCount && !selected.includes(option.id) && !feedback ? true : undefined} />
          <span className={`qx-choice-indicator ${question.type}`} aria-hidden="true">{selected.includes(option.id) && (question.type === "multiple" ? <ExamIcon name="check" /> : <span />)}</span>
          <span className="qx-letter">{optionLetter(optionIndex)}</span><span className="qx-option-text"><TechnicalText text={option.text} /></span>
          {feedback && (state === "correct" || state === "incorrect") && <span className={`qx-option-result ${state}`}><ExamIcon name={state === "correct" ? "check" : "close"} /><span>{state === "correct" ? "Correct answer" : "Your answer — incorrect"}</span></span>}
          {feedback && state === "correct" && selected.includes(option.id) && <span className="sr-only">Your selected answer</span>}
        </label>;
      })}
    </fieldset>
    {!feedback && question.hint && <details className="qx-hint"><summary><ExamIcon name="book" />Need a hint?<ExamIcon name="chevron" /></summary><p><TechnicalText text={question.hint} /></p></details>}
    {feedback && <ExplanationPanel question={feedback} />}
  </article>;
}

