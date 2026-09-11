"use client";

import { useState } from "react";
import { CatalogIcon } from "./catalog-icon";

const options = ["Amazon EC2", "Amazon S3", "Amazon RDS", "Amazon Route 53"];

export function LandingQuiz() {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const correct = answer === "Amazon S3";

  return <section className="landing-demo" aria-labelledby="demo-question">
    <div className="demo-chrome"><span className="demo-dots" aria-hidden="true"><i /><i /><i /></span><span>practice / cloud-foundations</span><span className="demo-live">Interactive demo</span></div>
    <div className="demo-body">
      <div className="demo-meta"><span>AWS · CLOUD PRACTITIONER</span><span>01 / 01</span></div>
      <h2 id="demo-question">Which AWS service stores objects such as images, videos, and backups?</h2>
      <p className="demo-instruction">One question. A clearer understanding.</p>
      <form onSubmit={event => { event.preventDefault(); if (answer) setSubmitted(true); }}>
        <fieldset disabled={submitted} className="demo-options">
          <legend className="sr-only">Choose one AWS service</legend>
          {options.map((option, index) => <label key={option} className={`demo-option ${answer === option ? "chosen" : ""} ${submitted && option === "Amazon S3" ? "correct" : ""} ${submitted && answer === option && !correct ? "incorrect" : ""}`}>
            <input type="radio" name="landing-answer" value={option} checked={answer === option} onChange={() => setAnswer(option)} />
            <span className="demo-letter" aria-hidden="true">{String.fromCharCode(65 + index)}</span><span>{option}</span>
            {submitted && option === "Amazon S3" && <span className="demo-result-label">Correct</span>}
            {submitted && answer === option && !correct && <span className="demo-result-label">Incorrect</span>}
          </label>)}
        </fieldset>
        <div className="demo-feedback" role="status" aria-live="polite">{submitted ? <><strong>{correct ? "Exactly right." : "A useful one to remember."}</strong> Amazon S3 stores objects in buckets. EC2 provides compute, RDS manages relational databases, and Route 53 provides DNS.</> : <span>Try it out. Select an answer to see the explanation.</span>}</div>
        <div className="demo-actions"><span><CatalogIcon name="check" />No account needed</span>{submitted ? <button type="button" onClick={() => { setSubmitted(false); setAnswer(""); }}>Try again<CatalogIcon name="refresh" /></button> : <button type="submit" disabled={!answer}>Submit answer<CatalogIcon /></button>}</div>
      </form>
    </div>
    <div className="demo-caption"><span className="status-dot" />A small preview of your next study session.</div>
  </section>;
}
