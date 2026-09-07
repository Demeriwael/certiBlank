"use client";

import { useEffect, useRef, useState } from "react";

export type Question = {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  hint: string | null;
};

export default function PracticeQuiz({ questions, onRestart }: {
  questions: Question[];
  onRestart: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  const finished = index === questions.length;
  const question = questions[index];
  const answered = index < answers.length;
  const score = answers.filter((answer, i) => answer === questions[i].correctAnswer).length;

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ behavior: "instant", block: "nearest" });
  }, [index]);

  function answer(option: string) {
    // Ignore subsequent clicks after this question has been answered.
    setAnswers((current) => current.length === index ? [...current, option] : current);
  }

  if (finished) {
    return <section className="quiz-summary" aria-label="Quiz results">
      <div className="eyebrow section-kicker">SESSION COMPLETE</div>
      <h2 ref={heading} tabIndex={-1}>Every answer is a step forward.</h2>
      <div className="score-panel">
        <div className="score-primary"><strong>{Math.round(score / questions.length * 100)}<span>%</span></strong><span>Your score</span></div>
        <div><strong>{score}<span> / {questions.length}</span></strong><span>Correct answers</span></div>
        <div><strong>{questions.length - score}</strong><span>To review</span></div>
      </div>
      <p>{score === questions.length ? "Perfect session. You answered every question correctly." : "Take a moment to review your answers. The next session starts with what you learned here."}</p>
      <button className="primary-button" onClick={onRestart}>Start a new session <span aria-hidden="true">↗</span></button>
      <div className="review-heading"><h3>Your answer breakdown</h3><span>{questions.length} QUESTIONS</span></div>
      <div className="answer-review">{questions.map((item, i) => {
        const correct = answers[i] === item.correctAnswer;
        return <article className="review-item" key={item.id}>
          <div className="review-top"><span className="eyebrow section-kicker">QUESTION {String(i + 1).padStart(2, "0")}</span><span className={`result-badge ${correct ? "is-correct" : "is-incorrect"}`}>{correct ? "✓ Correct" : "× Incorrect"}</span></div>
          <h4>{item.questionText}</h4>
          <p className={correct ? "review-correct" : "review-incorrect"}><span>Your answer</span>{answers[i]}</p>
          {!correct && <p className="review-correct"><span>Correct answer</span>{item.correctAnswer}</p>}
          {item.hint && <p className="review-hint"><span>Learning note</span>{item.hint}</p>}
        </article>;
      })}</div>
    </section>;
  }

  return <section className="quiz" aria-label="Interactive practice quiz">
    <div className="quiz-progress-label"><span>QUESTION {String(index + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}</span><span>{answers.length} answered</span></div>
    <progress className="quiz-progress" value={answers.length} max={questions.length} aria-label="Questions answered" />
    <h2 className="quiz-question" ref={heading} tabIndex={-1}>{question.questionText}</h2>
    <p className="quiz-instruction">Choose one answer. Your choice is final for this question.</p>
    <div className="quiz-options" role="group" aria-label="Answer choices">
      {question.options.map((option, i) => {
        const selected = answered && answers[index] === option;
        const correct = answered && question.correctAnswer === option;
        const wrong = selected && !correct;
        return <button
          key={option}
          className={`quiz-option ${correct ? "option-correct" : wrong ? "option-incorrect" : ""}`}
          disabled={answered}
          onClick={() => answer(option)}
          aria-pressed={selected}
        >
          <span className="option-letter" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
          <span className="option-text">{option}</span>
          {correct && <span className="option-verdict">✓ Correct answer{selected ? " · Your choice" : ""}</span>}
          {wrong && <span className="option-verdict">× Your choice</span>}
        </button>;
      })}
    </div>
    {!answered && question.hint && <details className="quiz-hint" key={question.id}><summary>Need a hint?</summary><p>{question.hint}</p></details>}
    {answered && <div className="quiz-feedback" role="status">
      <strong className={answers[index] === question.correctAnswer ? "feedback-correct" : "feedback-incorrect"}>{answers[index] === question.correctAnswer ? "✓ That’s correct. Nicely done." : "× Not quite. Here’s what to remember."}</strong>
      {answers[index] !== question.correctAnswer && <p>The correct answer is <b>{question.correctAnswer}</b>.</p>}
      {question.hint && <p>{question.hint}</p>}
    </div>}
    <div className="quiz-actions"><span>{answered ? "Ready when you are." : "Select an answer to continue."}</span><button className="primary-button" disabled={!answered} onClick={() => setIndex((current) => current + 1)}>{index === questions.length - 1 ? "View results" : "Next question"}<span aria-hidden="true">→</span></button></div>
  </section>;
}
