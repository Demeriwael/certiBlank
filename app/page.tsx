"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Brand } from "@/components/brand";
import type { Platform } from "@/lib/types";
const words = ["AWS", "Azure", "OpenAI", "Cisco"];

function TypedBrand() {
  const [text, setText] = useState("AWS");
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout>;
    let index = 0;
    let length = words[0].length;
    let deleting = true;
    function tick() {
      if (preference.matches) return;
      length += deleting ? -1 : 1;
      setText(words[index].slice(0, length));
      let delay = deleting ? 70 : 140;
      if (length === 0) { deleting = false; index = (index + 1) % words.length; delay = 350; }
      else if (length === words[index].length && !deleting) { deleting = true; delay = 1900; }
      timer = setTimeout(tick, delay);
    }
    function restart() { clearTimeout(timer); if (!preference.matches) timer = setTimeout(tick, 1900); else setText(words[index]); }
    restart();
    preference.addEventListener("change", restart);
    return () => { clearTimeout(timer); preference.removeEventListener("change", restart); };
  }, []);
  return <h1 className="hero-title" aria-label="Certi AWS, Azure, OpenAI, and Cisco"><span>Certi</span>{" "}<span className="typed-word" aria-hidden="true">{text}<span className="typing-caret" /></span></h1>;
}


const platformInfo: Record<string, { category: string; description: string; symbol: string }> = {
  aws: { category: "CLOUD COMPUTING", description: "Build your foundation in the cloud.", symbol: "aws" },
  azure: { category: "CLOUD & INFRASTRUCTURE", description: "Make your next move with Microsoft Azure.", symbol: "A" },
  openai: { category: "ARTIFICIAL INTELLIGENCE", description: "Get hands-on with the building blocks of AI.", symbol: "✳" },
};

export default function Home() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/platforms", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw new Error("Unable to load platforms"); return response.json(); })
      .then((data: Platform[]) => { if (!controller.signal.aborted) { setPlatforms(data); setStatus("ready"); } })
      .catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, [attempt]);

  return <div className="site-shell">
    <header className="site-header"><Brand /><nav aria-label="Main navigation"><a className="nav-link" href="#certifications">Certifications</a><a className="nav-link" href="#how-it-works">How it works</a></nav><a className="nav-cta" href="#certifications">Find your next cert <span aria-hidden="true">↗</span></a></header>
    <main>
      <section className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="eyebrow"><span className="status-dot" /> YOUR NEXT CHAPTER STARTS HERE</div>
        <TypedBrand />
        <p className="hero-tagline">Customized exam prep questions, flashcards, and practice tests for top IT certifications.</p>
        <a className="primary-button" href="#certifications">Find your certification <span aria-hidden="true">↗</span></a>
        <div className="hero-note"><span aria-hidden="true">⌘</span> Less guessing. More understanding.</div>
        <div className="hero-bottom"><span>BUILT FOR THE WAY DEVELOPERS LEARN</span><span className="scroll-note">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></span></div>
      </section>
      <section className="catalog section-wrap" id="certifications" aria-labelledby="catalog-title">
        <div className="section-heading"><div><div className="eyebrow section-kicker">01 / CHOOSE YOUR DIRECTION</div><h2 id="catalog-title">Big ambitions.<br /><span>Start with one cert.</span></h2></div><p>Pick your platform. Find your certification.<br />Make the next step yours.</p></div>
        {status === "loading" && <div className="platform-grid" aria-label="Loading certifications" aria-busy="true">{[0, 1, 2].map((key) => <div className="platform-card skeleton" key={key}><div /><div /><div /></div>)}</div>}
        {status === "error" && <div className="empty-state" role="alert"><h3>Couldn’t load certifications.</h3><p>Check your connection and give it another try.</p><button className="secondary-button" onClick={() => { setStatus("loading"); setAttempt((value) => value + 1); }}>Try again ↻</button></div>}
        {status === "ready" && (platforms.length ? <div className="platform-grid">{platforms.map((platform, index) => {
          const info = platformInfo[platform.slug] ?? { category: "TECHNOLOGY", description: "Take the next step in your learning journey.", symbol: platform.name.slice(0, 2) };
          return <article className={`platform-card platform-${platform.slug}`} key={platform.id}>
            <div className="card-top"><span className="platform-symbol" aria-hidden="true">{info.symbol}</span><span className="card-index">0{index + 1} /</span></div>
            <div className="card-category">{info.category}</div><h3>{platform.name}</h3><p className="card-description">{info.description}</p>
            <div className="certification-list">{platform.certifications.length ? platform.certifications.map((certification) => <Link className="certification-link" key={certification.id} href={`/platform/${encodeURIComponent(certification.slug)}`}><span><span className="cert-label">EXPLORE CERTIFICATION</span>{certification.title}</span><span className="link-arrow" aria-hidden="true">↗</span></Link>) : <p className="no-certifications">New certifications coming soon.</p>}</div>
            {platform.slug === "openai" && <span className="sample-note">Independent practice track · sample certification</span>}
          </article>;
        })}</div> : <div className="empty-state"><h3>Your next certification is on its way.</h3><p>Check back soon for available platforms.</p></div>)}
        <div className="catalog-footnote"><span className="tiny-cross" aria-hidden="true">+</span> One focused session today. One step closer tomorrow.<span className="catalog-count">{status === "ready" ? `${String(platforms.length).padStart(2, "0")} PLATFORMS / MORE TO COME` : "CURATED FOR YOUR NEXT STEP"}</span></div>
      </section>
      <section className="how-section section-wrap" id="how-it-works" aria-labelledby="how-title"><div className="eyebrow section-kicker">02 / A LITTLE STRUCTURE. A LOT OF PROGRESS.</div><div className="how-heading"><h2 id="how-title">Your pace. Your path.</h2><span className="outline-pill">FROM CURIOUS TO CONFIDENT ↗</span></div><div className="steps-grid">{[
        ["01", "Find your focus", "Choose the platform and certification that match where you want to go."],
        ["02", "Make it your session", "Set your question count and build a practice session around your time."],
        ["03", "Understand the why", "Work through questions, use a hint, and learn from every answer."],
      ].map(([number, title, description]) => <div className="step" key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{description}</p></div>)}</div></section>
    </main>
    <footer className="site-footer section-wrap"><Brand /><span>Built for the next version of you.</span><a href="#certifications">Let’s get started <span aria-hidden="true">↗</span></a></footer>
  </div>;
}

