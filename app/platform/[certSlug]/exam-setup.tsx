"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Brand } from "@/components/brand";
import type { Platform } from "@/lib/types";

import PracticeQuiz, { type Question } from "@/components/practice-quiz";

export default function ExamSetup({ certSlug }: { certSlug: string }) {
  const [title, setTitle] = useState<string | null>(null);
  const [platformName, setPlatformName] = useState("");
  const [status, setStatus] = useState("loading");
  const [limit, setLimit] = useState(10);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/platforms", { signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error(); return response.json(); })
      .then((platforms: Platform[]) => {
        for (const platform of platforms) {
          const cert = platform.certifications.find((item) => item.slug === certSlug);
          if (cert) { setTitle(cert.title); setPlatformName(platform.name); setStatus("ready"); return; }
        }
        setStatus("missing");
      }).catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, [certSlug]);

  async function start(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`/api/questions?${new URLSearchParams({ certSlug, limit: String(limit) })}`, { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data: Question[] = await response.json();
      setQuestions(data);
    } catch { setError("Couldn’t load your questions. Please try again."); }
    finally { setBusy(false); }
  }

  return <div className="site-shell">
    <header className="site-header"><Brand /><Link className="nav-link" href="/#certifications">All certifications ↗</Link></header>
    <main className="setup-main">
      <Link href="/#certifications" className="back-link">← Back to certifications</Link>
      <section className="setup-panel">
        {status === "loading" ? <p role="status">Loading your certification…</p> : status === "missing" ? <><h1>Certification not found.</h1><p>Choose an available certification to get started.</p></> : status === "error" ? <><h1>Let’s try that again.</h1><p role="alert">We couldn’t load this certification.</p><button className="secondary-button" onClick={() => window.location.reload()}>Retry</button></> : <>
          <div className="eyebrow section-kicker">{platformName.toUpperCase()} / YOUR PRACTICE SESSION</div>
          <h1>{title}</h1>
          {questions?.length ? <PracticeQuiz questions={questions} onRestart={() => { setQuestions(null); setError(""); }} /> : <>
            <p>One question at a time. Pick your answer, learn from the feedback, and see your full results when you finish.</p>
            {platformName === "OpenAI" && <p>Independent sample practice track; not an official OpenAI certification.</p>}
            <form onSubmit={start}>
              <label htmlFor="question-count">Number of questions</label>
              <select id="question-count" value={limit} disabled={busy} onChange={(event) => setLimit(Number(event.target.value))}>{[5, 10, 15, 20].map((count) => <option key={count} value={count}>{count} questions</option>)}</select>
              <button className="primary-button" disabled={busy} type="submit">{busy ? "Preparing…" : "Start practicing"}<span aria-hidden="true">↗</span></button>
              <p>If fewer questions are available, we’ll include all of them.</p>
            </form>
            {error && <p className="setup-error" role="alert">{error}</p>}
            {questions?.length === 0 && <p role="status">No questions are available for this certification yet.</p>}
          </>}
        </>}
      </section>
    </main>
  </div>;
}
