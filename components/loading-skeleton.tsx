import { Brand } from "./brand";

export function SkeletonLines() {
  return <div className="loading-lines" aria-hidden="true"><span className="loading-shape loading-heading" /><span className="loading-shape" /><span className="loading-shape loading-short" /></div>;
}

export function CatalogSkeleton() {
  return <section className="loading-region" aria-busy="true" aria-label="Certifications"><p className="loading-caption" role="status">Loading available certifications…</p><div className="loading-catalog" aria-hidden="true">{[0, 1, 2].map(item => <div className="loading-card loading-track" key={item}><span className="loading-shape loading-badge" /><div><SkeletonLines /><span className="loading-shape loading-action" /></div></div>)}</div></section>;
}

export function AccountSkeleton({ form = false }: { form?: boolean }) {
  return <section className={`loading-region ${form ? "loading-form" : "account-dashboard"}`} aria-busy="true" aria-label={form ? "Account page" : "Practice history"}><p className="loading-caption" role="status">{form ? "Getting your account page ready…" : "Loading your learning space…"}</p><div aria-hidden="true"><SkeletonLines /><div className={form ? "loading-card" : "loading-account-grid"}>{[0, 1].map(item => <div className={form ? "loading-field" : "loading-card"} key={item}><SkeletonLines /><span className="loading-shape loading-action" /></div>)}</div>{!form && <div className="loading-card">{[0, 1, 2].map(item => <div className="loading-history-row" key={item}><span className="loading-shape loading-avatar" /><SkeletonLines /></div>)}</div>}</div></section>;
}

export function PageSkeleton() {
  return <div className="site-shell"><header className="site-header"><Brand /></header><main className="section-wrap loading-page"><SkeletonLines /><CatalogSkeleton /></main></div>;
}

export function ResultsLoading() {
  return <section className="loading-region results-loading" aria-busy="true" aria-label="Exam results"><div className="results-orbit" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="19" /><path d="M15 25l6 6 13-15" /></svg></div><h1 id="calculating-title" tabIndex={-1}>Calculating your results</h1><p role="status">Saving your final answers and preparing your score.</p><div className="results-loading-cards" aria-hidden="true">{[0, 1, 2].map(item => <div className="loading-card" key={item}><SkeletonLines /></div>)}</div><p className="loading-caption">Your results will appear as soon as they’re ready.</p></section>;
}
