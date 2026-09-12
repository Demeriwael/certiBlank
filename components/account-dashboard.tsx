"use client";
import Link from "next/link";
import { useState } from "react";
import { AccountIcon } from "./account-icon";
import { certificationLabel, practiceStatus, type AccountAttempt } from "@/lib/account-ui";

export function AccountDashboard({ name, email, attempts, now, returnTo }: { name: string; email: string; attempts: AccountAttempt[]; now: number; returnTo: string }) {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const active = attempts.filter(item => practiceStatus(item, now) === "active");
  const completed = attempts.filter(item => practiceStatus(item, now) === "completed");
  const shown = attempts.filter(item => filter === "all" || practiceStatus(item, now) === filter);
  const next = active[0];
  const nextLabel = next ? certificationLabel(next.certSlug) : null;
  const href = (item: AccountAttempt) => `/platform/${item.certSlug}?attempt=${item.id}`;
  return <div className="account-dashboard">
    <div className="account-heading"><div><span className="auth-kicker">YOUR LEARNING SPACE</span><h1>Keep your momentum, <span>{name.trim().split(/\s+/)[0] || "learner"}.</span></h1><p>Every session is another step forward.</p></div><Link className="account-profile-link" href="/logout">Log out<AccountIcon name="arrow" /></Link></div>
    <div className="account-overview">
      <section className="account-next"><span className="auth-kicker">{next ? "PICK UP WHERE YOU LEFT OFF" : "YOUR NEXT STEP"}</span><div className="account-next-icon"><AccountIcon name="book" /></div><h2>{nextLabel ? nextLabel.title : "Make room for a little practice."}</h2><p>{next ? `${nextLabel!.provider} · ${next.mode === "mock" ? "Timed mock exam — the timer keeps running" : "Domain practice — learn at your pace"}` : "Choose a certification, find your focus, and start building confidence."}</p><Link className="primary-button" href={next ? href(next) : returnTo !== "/account" ? returnTo : "/certifications"}>{next ? "Resume practice" : "Explore certifications"}<AccountIcon name="arrow" /></Link></section>
      <section className="account-profile" aria-label="Your account"><div className="account-identity"><span className="account-avatar" aria-hidden="true">{name.trim().slice(0, 1).toUpperCase() || "C"}</span><div><h2>{name}</h2><p>{email}</p></div></div><div className="account-stat-grid"><div><strong>{active.length}</strong><span>In progress</span></div><div><strong>{completed.length}</strong><span>Completed</span></div></div><p className="account-stat-note">From your latest {attempts.length} saved sessions.</p><div className="account-profile-foot"><AccountIcon name="shield" /><span>History saved to your account</span></div></section>
    </div>
    <section className="account-history-section" aria-labelledby="history-title"><div className="account-history-heading"><div><h2 id="history-title">Your practice history</h2><p>Revisit your answers or get back into a session.</p></div><Link href="/certifications">New practice<AccountIcon name="arrow" /></Link></div>
      <div className="account-filters" role="group" aria-label="Filter practice history">{(["all", "active", "completed"] as const).map(value => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === "all" ? "All sessions" : value === "active" ? "In progress" : "Completed"}<span>{value === "all" ? attempts.length : value === "active" ? active.length : completed.length}</span></button>)}</div>
      <span className="sr-only" role="status">{shown.length} sessions shown</span>
      {shown.length ? <ul className="auth-history">{shown.map(item => {
        const label = certificationLabel(item.certSlug);
        const status = practiceStatus(item, now);
        return <li key={item.id}><span className={`account-provider provider-${label.provider.toLowerCase()}`} aria-hidden="true">{label.code}</span><div className="account-session-info"><h3>{label.title}</h3><p>{item.mode === "mock" ? "Mock exam" : "Domain practice"}<span aria-hidden="true"> · </span><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</time></p></div><span className={`account-status ${status}`}><span />{status === "active" ? "In progress" : status === "completed" ? "Completed" : "Time ended"}</span><Link className="account-session-action" href={href(item)} aria-label={`${status === "active" ? "Resume" : "Review"} ${label.title} ${item.mode === "mock" ? "mock exam" : "domain practice"} from ${new Date(item.createdAt).toLocaleDateString("en", { timeZone: "UTC" })}`}>{status === "active" ? "Resume" : "Review"}<AccountIcon name="arrow" /></Link></li>;
      })}</ul> : <div className="account-empty"><AccountIcon name="book" /><h3>{attempts.length ? "Nothing here just yet." : "Your journey starts with one session."}</h3><p>{attempts.length ? "Try another filter, or start a new practice session." : "Your practice sessions will appear here, ready to resume or review."}</p><Link className="primary-button" href="/certifications">Find your certification<AccountIcon name="arrow" /></Link></div>}
      <p className="account-history-note">Showing up to 50 recent sessions. <Link href={`/auth/complete?returnTo=${encodeURIComponent(returnTo)}`}>Bring over practice from this browser</Link></p>
    </section>
  </div>;
}

