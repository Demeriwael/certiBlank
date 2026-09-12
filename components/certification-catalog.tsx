"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { mergeCatalog, questionCount, type Track } from "@/lib/catalog";
import type { Platform } from "@/lib/types";
import { CatalogIcon } from "./catalog-icon";
import { PlatformLogo } from "./platform-logo";
import { StartPracticeLink } from "./start-practice-link";

function ReadyTrack({ track, amount }: { track: Track; amount: number }) {
  return <article className="ready-track">
    <div className="ready-track-art">{track.badge ? <Image src={track.badge} alt={`${track.title} certification badge`} width={180} height={180} sizes="(max-width:600px) 100px, 180px" /> : <CatalogIcon name="check" />}<span>{track.examCode ?? track.level}</span></div>
    <div className="ready-track-content">
      <div className="ready-track-top"><span className="level-pill">{track.level}</span><span className="ready-label"><span className="status-dot" />Ready to practice</span></div>
      <h3>{track.title}</h3><p className="ready-description">{track.description}</p>
      <div className="ready-track-actions"><div><strong>{amount}</strong><span>practice questions</span></div><StartPracticeLink slug={track.slug} /></div>
      <details className="track-details"><summary>Explore exam details<CatalogIcon name="down" /></summary>
      {track.audience && <p className="track-audience">{track.audience}</p>}
      <div className="track-skills" aria-label="Topics covered">{(track.skills ?? [track.topic]).map(skill => <span key={skill}>{skill}</span>)}</div>
      {track.examOverview && <p className="track-exam-overview"><CatalogIcon name="clock" /><span>Official exam: {track.examOverview}</span></p>}
      <div className="track-practice-features"><span><CatalogIcon name="check" />Domain practice</span><span><CatalogIcon name="check" />Detailed explanations</span><span><CatalogIcon name="check" />Answer review & analytics</span></div>
      {track.officialUrl && <a className="track-docs" href={track.officialUrl} target="_blank" rel="noopener noreferrer">Official certification details<CatalogIcon name="external" /><span className="sr-only"> (opens in a new tab)</span></a>}
      </details>
    </div>
  </article>;
}

export default function CertificationCatalog({ compact = false, platformSlug }: { compact?: boolean; platformSlug?: string }) {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("All levels");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/platforms", { signal: controller.signal, cache: "no-store" })
      .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
      .then((data: Platform[]) => { if (!controller.signal.aborted) { setPlatforms(data); setStatus("ready"); } })
      .catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, [attempt]);
  const all = mergeCatalog(platforms);
  const scoped = platformSlug ? all.filter(item => item.slug === platformSlug) : all;
  const count = (slug: string, cert: string) => questionCount(platforms, slug, cert);
  const readyCount = scoped.reduce((sum, platform) => sum + platform.tracks.filter(track => count(platform.slug, track.slug) > 0).length, 0);
  const matches = (track: Track, name: string) => (level === "All levels" || track.level === level) && `${name} ${track.title} ${track.slug} ${track.examCode ?? ""} ${track.topic} ${track.skills?.join(" ") ?? ""}`.toLowerCase().includes(query.trim().toLowerCase());
  const sections = scoped.map(platform => ({ ...platform, ready: platform.tracks.filter(track => count(platform.slug, track.slug) > 0 && matches(track, platform.name)), upcoming: platform.tracks.filter(track => count(platform.slug, track.slug) === 0 && matches(track, platform.name)) }));
  const filteredCount = sections.reduce((sum, item) => sum + item.ready.length + item.upcoming.length, 0);
  const retry = () => { setStatus("loading"); setAttempt(value => value + 1); };

  if (compact) return <>
    <div className="section-heading"><div><div className="eyebrow section-kicker">01 / PICK YOUR ECOSYSTEM</div><h2 id="catalog-title">Your platform.<br /><span>Your next chapter.</span></h2></div><div><p className="catalog-intro">Three ecosystems. A focused path forward.<br />Start with a question bank that’s ready today.</p><Link className="text-action" href="/certifications">Explore certifications<CatalogIcon /></Link></div></div>
    <div className="hub-grid">{all.map((platform, index) => {
      const available = platform.tracks.filter(track => count(platform.slug, track.slug) > 0);
      return <Link href={`/platforms/${platform.slug}`} className={`hub-card platform-${platform.slug}`} key={platform.slug} style={{ "--platform-accent": platform.accent } as CSSProperties}>
        <div className="hub-card-top"><PlatformLogo slug={platform.slug} /><span className="hub-number">0{index + 1} /</span></div>
        <div className="card-category">{platform.category}</div><h3>{platform.name}<CatalogIcon /></h3><p>{platform.description}</p>
        <div className="hub-preview">{status === "ready" ? available.length ? available.map(track => <span className="hub-ready-track" key={track.slug}>{track.title}</span>) : <span>Question banks coming soon</span> : <span className={`hub-status ${status === "loading" ? "is-loading" : "is-error"}`}><i aria-hidden="true" />{status === "loading" ? "Checking question banks…" : "Availability temporarily unavailable"}</span>}</div>
        <div className="hub-card-footer"><span>{status === "ready" ? available.length ? `${available.length} ready to practice` : "Coming soon" : "Explore platform"}</span><CatalogIcon name="external" /></div>
      </Link>;
    })}</div><p className="catalog-disclaimer">Independent preparation for AWS, Microsoft Azure, and Cisco certifications.</p>
  </>;

  return <>
    <nav className="catalog-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/certifications">Certifications</Link>{platformSlug && <><span>/</span><span aria-current="page">{scoped[0]?.name}</span></>}</nav>
    <section className={`catalog-hero ${platformSlug ? "catalog-hero-scoped" : ""}`}><div>{platformSlug && <PlatformLogo slug={platformSlug} />}<div className="eyebrow section-kicker">{platformSlug ? scoped[0]?.category : "THE CERTI LEARNING CATALOG"}</div><h1>{platformSlug ? <>{scoped[0]?.name}<span>Build what comes next.</span></> : <>Your ambition.<span>Your next certification.</span></>}</h1><p>{platformSlug ? scoped[0]?.description : "Focused practice for AWS, Azure, and Cisco. Explore available question banks, understand every answer, and make your next study session count."}</p></div><div className="catalog-stat-panel"><span className="eyebrow section-kicker">READY WHEN YOU ARE</span><strong>{status === "ready" ? String(readyCount).padStart(2, "0") : "—"}<span>certifications to practice</span></strong><div><span className="status-dot" />{status === "ready" ? "More question banks coming soon" : status === "error" ? "Availability unavailable" : "Checking availability…"}</div></div></section>
    <nav className="platform-tabs" aria-label="Choose a platform"><Link href="/certifications" aria-current={!platformSlug ? "page" : undefined}>All platforms</Link>{all.map(platform => <Link href={`/platforms/${platform.slug}`} key={platform.slug} aria-current={platform.slug === platformSlug ? "page" : undefined}>{platform.name}</Link>)}</nav>
    <div className="catalog-toolbar"><div className="catalog-search"><CatalogIcon name="search" /><input type="search" aria-label="Search certifications" placeholder="Search certifications, exam codes, or skills…" value={query} onChange={event => setQuery(event.target.value)} /></div><label className="filter-select"><span className="sr-only">Certification level</span><select value={level} onChange={event => setLevel(event.target.value)}><option>All levels</option>{Array.from(new Set(scoped.flatMap(platform => platform.tracks.map(track => track.level)))).map(value => <option key={value}>{value}</option>)}</select></label></div>
    {status === "loading" && <div className="catalog-notice" role="status">Checking the latest question banks…</div>}
    {status === "error" && <div className="catalog-notice" role="alert">We couldn’t check question availability. Please retry to see what’s ready.<button onClick={retry}>Retry connection<CatalogIcon name="refresh" /></button></div>}
    {status === "ready" && <>
      <div className="catalog-results-bar" role="status"><span>{sections.reduce((sum, item) => sum + item.ready.length, 0)} ready to practice{query || level !== "All levels" ? " matching your filters" : ""}</span><span>Choose a certification to customize your session.</span></div>
      {!filteredCount && <div className="catalog-empty"><CatalogIcon name="search" /><h2>No certifications found.</h2><p>Try another keyword or clear your filters.</p><button className="secondary-button" onClick={() => { setQuery(""); setLevel("All levels"); }}>Clear filters</button></div>}
      {sections.filter(platform => platform.ready.length || platform.upcoming.length).map(platform => <section className="track-section" key={platform.slug} aria-labelledby={`heading-${platform.slug}`} style={{ "--platform-accent": platform.accent } as CSSProperties}>
        <div className={`track-section-heading ${platformSlug ? "track-heading-scoped" : ""}`}><div><PlatformLogo slug={platform.slug} /><h2 id={`heading-${platform.slug}`}>{platform.name}<span>{platform.category}</span></h2></div>{!platformSlug && <Link className="text-action" href={`/platforms/${platform.slug}`}>Explore platform<CatalogIcon /></Link>}</div>
        <div className="ready-track-list">{platform.ready.map(track => <ReadyTrack key={track.slug} track={track} amount={count(platform.slug, track.slug)} />)}</div>
        {!platform.ready.length && <p className="platform-coming-message">Practice for {platform.name} is coming soon. We’re preparing the question banks.</p>}
        {platform.upcoming.length > 0 && <div className="coming-soon-section"><div className="coming-soon-heading"><CatalogIcon name="clock" /><h3>Coming soon</h3><span>{platform.upcoming.length} certifications</span></div><div className="coming-soon-list">{platform.upcoming.map(track => <div className="coming-soon-row" key={track.slug}>{track.badge && <Image src={track.badge} alt="" width={44} height={44} />}<div><strong>{track.title}</strong><span>{track.examCode ? `${track.examCode} · ` : ""}{track.level} · {track.topic}</span></div><span className="coming-soon-label">Coming soon</span></div>)}</div></div>}
      </section>)}
    </>}
    <div className="catalog-bottom-note"><CatalogIcon name="check" /><p>Progress is personal. Pick one certification and make a start.<small>Independent exam preparation. Certification names and badges belong to their respective providers. Check official pages for current exam requirements.</small></p><Link href="/certifications">All platforms<CatalogIcon /></Link></div>
  </>;
}

