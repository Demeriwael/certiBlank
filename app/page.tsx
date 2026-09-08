"use client";

import CertificationCatalog from "@/components/certification-catalog";
import { useEffect, useState } from "react";

import { Brand } from "@/components/brand";

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


export default function Home() {
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
        <CertificationCatalog compact />
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


