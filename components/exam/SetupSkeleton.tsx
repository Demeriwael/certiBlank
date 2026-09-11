import Link from "next/link";
import { Brand } from "@/components/brand";

export function SetupSkeleton({ fullPage = false }: { fullPage?: boolean }) {
  const content = <section className="practice-skeleton" aria-busy="true" aria-label="Exam setup">
    <p role="status" className="practice-loading-label">Loading your practice setup…</p>
    <div aria-hidden="true">
      <div className="skeleton-bar skeleton-intro" />
      <div className="mode-grid">
        {[0, 1].map(card => <div className="exam-card skeleton-mode" key={card}>
          <div className="skeleton-bar skeleton-icon" />
          <div className="skeleton-bar skeleton-title" />
          <div className="skeleton-bar" /><div className="skeleton-bar skeleton-short" />
        </div>)}
      </div>
      <div className="exam-card skeleton-controls">
        <div className="skeleton-bar skeleton-title" />
        {[0, 1, 2].map(row => <div className="skeleton-bar skeleton-row" key={row} />)}
        <div className="skeleton-bar skeleton-button" />
      </div>
    </div>
  </section>;

  if (!fullPage) return content;
  return <div className="site-shell exam-setup-shell">
    <header className="site-header"><Brand /><Link className="nav-link" href="/certifications">All certifications</Link></header>
    <main className="exam-main">
      <Link className="back-link" href="/certifications">Certification catalog</Link>
      <div className="exam-heading"><div><div className="eyebrow section-kicker">CERTI / YOUR NEXT MILESTONE</div><h1>Prepare with purpose.</h1></div></div>
      {content}
    </main>
  </div>;
}
