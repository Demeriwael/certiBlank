import type { Review } from "@/lib/exam-contract";
import { optionLetter, vendorLabel } from "@/lib/exam-ui";
import { ExamIcon } from "./ExamIcon";
import { TechnicalText } from "./TechnicalText";

export function ExplanationPanel({ question }: { question: Review }) {
  const correct = question.options.map((option, index) => ({ ...option, letter: optionLetter(index) })).filter(option => question.correctOptionIds.includes(option.id));
  return <section className="qx-explanations" aria-label="Answer explanations">
    <div className={`qx-verdict ${question.correct ? "is-correct" : "is-incorrect"}`} role="status">
      <ExamIcon name={question.correct ? "check" : "close"} />
      <div><strong>{question.correct ? "You got it right." : question.userAnswer.length ? "Not quite. Let’s break it down." : "You left this question unanswered."}</strong><span>{question.correct ? "Here’s the reasoning behind the answer." : "Review the correct answer and compare each option."}</span></div>
    </div>
    <div className="qx-correct-explanation">
      <div className="qx-section-label"><ExamIcon name="book" /> UNDERSTAND THE CONCEPT</div>
      <h3>Why {correct.length > 1 ? "options" : "option"} {correct.map(option => option.letter).join(" and ")} {correct.length > 1 ? "are" : "is"} correct</h3>
      <p><TechnicalText text={question.correctExplanation} /></p>
    </div>
    <h3 className="qx-distractor-title">Why the other options don’t fit</h3>
    <div className="qx-distractors">{question.options.map((option, index) => !question.correctOptionIds.includes(option.id) && <details key={option.id}>
      <summary><span className="qx-letter">{optionLetter(index)}</span><span><b>Option {optionLetter(index)}</b><span>{option.text}</span>{question.userAnswer.includes(option.id) && <em>Your selection</em>}</span><ExamIcon name="chevron" /></summary>
      <p><TechnicalText text={question.distractorExplanations[option.id]} /></p>
    </details>)}</div>
    <a className="qx-doc-link" href={question.referenceUrl} target="_blank" rel="noopener noreferrer"><ExamIcon name="book" />{vendorLabel(question.referenceUrl)}<ExamIcon name="external" /><span className="sr-only"> (opens in a new tab)</span></a>
  </section>;
}
