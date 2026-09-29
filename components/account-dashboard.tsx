"use client";
import Link from "next/link";
import { useState } from "react";
import { AccountIcon } from "./account-icon";
import { certificationLabel, filterAccountAttempts, practiceStatus, type AccountAttempt, type HistoryFilter } from "@/lib/account-ui";
import { AccountConnections } from "./account-connections";
import { ThemeToggle } from "./theme-toggle";

const filters: { value: HistoryFilter; label: string }[] = [
  { value: "all", label: "All" }, { value: "active", label: "In progress" },
  { value: "completed", label: "Completed" }, { value: "expired", label: "Time ended" },
];
const dateLabel = (date: string) => new Date(date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function AccountDashboard({ name, email, attempts, now, returnTo, google, github, connection }: { name: string; email: string; attempts: AccountAttempt[]; now: number; returnTo: string; google: boolean; github: boolean; connection?: string }) {
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(5);
  const active = attempts.filter(item => practiceStatus(item, now) === "active");
  const completed = attempts.filter(item => practiceStatus(item, now) === "completed");
  const shown = filterAccountAttempts(attempts, filter, search, now);
  const next = active[0];
  const nextLabel = next ? certificationLabel(next.certSlug) : null;
  const href = (item: AccountAttempt) => `/platform/${item.certSlug}?attempt=${item.id}`;
  return <div className="account-dashboard account-polished">
    <div className="account-heading">
      <div><span className="auth-kicker">YOUR LEARNING SPACE</span><h1>Welcome back, <span>{name.trim().split(/\s+/)[0] || "learner"}.</span></h1><p>A little practice. A clearer path forward.</p></div>
      <Link className="primary-button account-new-practice" href="/certifications"><AccountIcon name="plus" />New practice</Link>
    </div>
    <nav className="account-section-nav" aria-label="On this account page">
      <a href="#account-overview">Overview</a><a href="#practice-history">Practice history</a><a href="#account-settings">Sign-in & settings</a>
    </nav>
    <div className="account-overview" id="account-overview">
      <section className="account-next" aria-labelledby="next-title">
        <span className="auth-kicker">{next ? "PICK UP WHERE YOU LEFT OFF" : "YOUR NEXT STEP"}</span>
        <div className="account-next-icon"><AccountIcon name="book" /></div>
        <h2 id="next-title">{nextLabel ? nextLabel.title : "Start something worth learning."}</h2>
        <p>{next ? `${nextLabel!.provider} · ${next.mode === "mock" ? "Timed mock exam — the timer keeps running" : "Domain practice — learn at your pace"}` : "Choose a certification and make your first session your own. No perfect score required."}</p>
        <Link className="primary-button" href={next ? href(next) : "/certifications"}>{next ? "Resume practice" : "Explore certifications"}<AccountIcon name="arrow" /></Link>
        {next && <span className="account-resume-note">Started {dateLabel(next.createdAt)}</span>}
      </section>
      <section className="account-profile" aria-label="Your account">
        <div className="account-identity"><span className="account-avatar" aria-hidden="true">{name.trim().slice(0, 1).toUpperCase() || "C"}</span><div><h2>{name}</h2><p>{email}</p></div></div>
        <div className="account-stat-grid"><div><strong>{active.length}</strong><span>In progress</span></div><div><strong>{completed.length}</strong><span>Completed</span></div></div>
        <p className="account-stat-note">From your latest {attempts.length} saved {attempts.length === 1 ? "session" : "sessions"}.</p>
        <div className="account-profile-foot"><AccountIcon name="shield" /><span>Your history, saved to your account</span></div>
      </section>
    </div>
    <section className="account-history-section" id="practice-history" aria-labelledby="history-title">
      <div className="account-history-heading"><div><h2 id="history-title">Practice history</h2><p>Continue a session or revisit what you learned.</p></div><span className="account-section-count">{attempts.length} {attempts.length === 1 ? "session" : "sessions"}</span></div>
      {attempts.length > 0 && <div className="account-history-tools">
        <label className="account-search"><AccountIcon name="search" /><span className="sr-only">Search practice history</span><input type="search" value={search} placeholder="Search certification or exam code" maxLength={120} onChange={event => { setSearch(event.target.value); setVisibleCount(5); }} /></label>
        <div className="account-filters" role="group" aria-label="Filter practice history">{filters.map(({ value, label }) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => { setFilter(value); setVisibleCount(5); }}>{label}<span>{value === "all" ? attempts.length : attempts.filter(item => practiceStatus(item, now) === value).length}</span></button>)}</div>
      </div>}
      <span className="sr-only" role="status">{shown.length} matching sessions. Showing {Math.min(visibleCount, shown.length)}.</span>
      {shown.length ? <ul className="auth-history">{shown.slice(0, visibleCount).map(item => {
        const label = certificationLabel(item.certSlug);
        const status = practiceStatus(item, now);
        return <li key={item.id}>
          <span className={`account-provider provider-${label.provider.toLowerCase()}`} aria-hidden="true">{label.code}</span>
          <div className="account-session-info"><h3>{label.title}</h3><p>{item.mode === "mock" ? "Mock exam" : "Domain practice"}<span aria-hidden="true"> · </span><time dateTime={item.createdAt}>{dateLabel(item.createdAt)}</time></p></div>
          <span className={`account-status ${status}`}><span aria-hidden="true" />{status === "active" ? "In progress" : status === "completed" ? "Completed" : "Time ended"}</span>
          <Link className="account-session-action" href={href(item)} aria-label={`${status === "active" ? "Resume" : "Review"} ${label.title} ${item.mode === "mock" ? "mock exam" : "domain practice"} from ${dateLabel(item.createdAt)}`}>{status === "active" ? "Resume" : "Review"}<AccountIcon name="arrow" /></Link>
        </li>;
      })}</ul> : <div className="account-empty"><AccountIcon name={attempts.length ? "search" : "book"} /><h3>{attempts.length ? "No matching sessions." : "Your first session starts here."}</h3><p>{attempts.length ? "Try another certification name or change the status filter." : "Your sessions will appear here, ready to resume or review."}</p>{attempts.length ? <button className="secondary-button" type="button" onClick={() => { setFilter("all"); setSearch(""); setVisibleCount(5); }}>Clear filters</button> : <Link className="primary-button" href="/certifications">Find your certification<AccountIcon name="arrow" /></Link>}</div>}
      {shown.length > 5 && <button className="account-show-more" type="button" disabled={visibleCount >= shown.length} onClick={() => setVisibleCount(count => count + 5)}>{visibleCount < shown.length ? `Show more sessions (${shown.length - visibleCount} remaining)` : "All matching sessions shown"}<AccountIcon name="chevron" /></button>}
      <p className="account-history-note">Your latest 50 sessions are available here. <Link href={`/auth/complete?returnTo=${encodeURIComponent(returnTo)}`}>Bring over practice from this browser</Link></p>
    </section>
    <section className="account-settings-section" id="account-settings" aria-labelledby="settings-title">
      <div className="account-history-heading"><div><h2 id="settings-title">Sign-in & settings</h2><p>A few preferences to make this space yours.</p></div><AccountIcon name="shield" /></div>
      <AccountConnections google={google} github={github} connection={connection} />
      <div className="account-preference-row"><div><h3>Appearance</h3><p>Choose the theme that feels right for you.</p></div><ThemeToggle showLabel /></div>
      <div className="account-preference-row"><div><h3>Finished for now?</h3><p>Your saved practice will be here when you return.</p></div><Link className="account-session-action" href="/logout" prefetch={false}><AccountIcon name="logout" />Log out</Link></div>
    </section>
  </div>;
}
