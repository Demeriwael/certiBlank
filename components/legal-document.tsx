import Link from "next/link";
import type { ReactNode } from "react";

type LegalSection = { id: string; title: string; content: ReactNode };

export function LegalDocument({ title, description, sections }: { title: string; description: string; sections: LegalSection[] }) {
  return <main id="legal-main" className="legal-main section-wrap" tabIndex={-1}>
    <header className="legal-heading">
      <p className="eyebrow">CLEAR TERMS. INFORMED CHOICES.</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <p className="legal-date">Last updated <time dateTime="2026-09-29">September 29, 2026</time></p>
      <nav aria-label="Policy documents"><Link href="/privacy" aria-current={title === "Privacy Policy" ? "page" : undefined}>Privacy Policy</Link><Link href="/terms" aria-current={title === "Terms of Service" ? "page" : undefined}>Terms of Service</Link></nav>
    </header>
    <div className="legal-columns">
      <nav className="legal-contents" aria-label="On this page"><h2>On this page</h2><ol>{sections.map(section => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}</ol></nav>
      <article className="legal-copy" aria-label={title}>{sections.map(section => <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`}><h2 id={`${section.id}-heading`}>{section.title}</h2>{section.content}</section>)}</article>
    </div>
  </main>;
}
