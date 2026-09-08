"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { mergeCatalog, questionCount } from "@/lib/catalog";
import type { Platform } from "@/lib/types";

export default function CertificationCatalog({ compact = false, platformSlug }: { compact?: boolean; platformSlug?: string }) {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("All levels");
  const [topic, setTopic] = useState("All topics");
  const [availableOnly, setAvailableOnly] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/platforms", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw new Error(); return response.json(); })
      .then((data: Platform[]) => { if (!controller.signal.aborted) { setPlatforms(data); setStatus("ready"); } })
      .catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, [attempt]);
  const all = mergeCatalog(platforms);
  const scoped = platformSlug ? all.filter((item) => item.slug === platformSlug) : all;
  const count = (slug: string, cert: string) => questionCount(platforms, slug, cert);
  const readyCount = scoped.reduce((sum, platform) => sum + platform.tracks.filter((track) => count(platform.slug, track.slug) > 0).length, 0);
  const total = scoped.reduce((sum, platform) => sum + platform.tracks.length, 0);
  const visible = scoped.map((platform) => ({ ...platform, tracks: platform.tracks.filter((track) =>
    (!availableOnly || count(platform.slug, track.slug) > 0) &&
    (level === "All levels" || track.level === level) &&
    (topic === "All topics" || track.topic === topic) &&
    `${platform.name} ${track.title} ${track.slug} ${track.topic}`.toLowerCase().includes(query.trim().toLowerCase())
  ) })).filter((platform) => platform.tracks.length);
  const results = visible.reduce((sum, platform) => sum + platform.tracks.length, 0);
  function reset() { setQuery(""); setLevel("All levels"); setTopic("All topics"); setAvailableOnly(false); }

  if (compact) return <>
    <div className="section-heading"><div><div className="eyebrow section-kicker">01 / PICK YOUR ECOSYSTEM</div><h2 id="catalog-title">One platform.<br /><span>So many possibilities.</span></h2></div><div><p className="catalog-intro">Find your platform, explore its certifications,<br />and build a path that feels like you.</p><Link className="text-action" href="/certifications">Browse the full catalog <span aria-hidden="true">↗</span></Link></div></div>
    <div className="hub-grid">{all.map((platform, index) => <Link href={`/platforms/${platform.slug}`} className={`hub-card platform-${platform.slug}`} key={platform.slug} style={{ "--platform-accent": platform.accent } as CSSProperties}>
      <div className="hub-card-top"><span className="platform-symbol" aria-hidden="true">{platform.symbol}</span><span className="hub-number">0{index + 1} /</span></div>
      <div className="card-category">{platform.category}</div><h3>{platform.name}<span aria-hidden="true">↗</span></h3><p>{platform.description}</p>
      <div className="hub-preview">{platform.tracks.slice(0, 3).map((track) => <span key={track.slug}>{track.title}</span>)}{platform.tracks.length > 3 && <span>+{platform.tracks.length - 3} more</span>}</div>
      <div className="hub-card-footer"><span>{platform.tracks.length} {platform.slug === "openai" ? "learning track" : "certifications"}</span><span>{status === "ready" ? `${platform.tracks.filter((track) => count(platform.slug, track.slug) > 0).length} ready to practice` : "Explore platform"}</span></div>
    </Link>)}</div><p className="catalog-disclaimer">Independent exam preparation. Tracks without questions are marked coming soon. OpenAI tracks are independent learning material.</p>
  </>;

  return <>
    <nav className="catalog-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/certifications">Certifications</Link>{platformSlug && <><span>/</span><span aria-current="page">{scoped[0]?.name ?? "Platform"}</span></>}</nav>
    <section className="catalog-hero">
      <div><div className="eyebrow section-kicker">{platformSlug ? scoped[0]?.category ?? "PLATFORM" : "THE CERTI LEARNING CATALOG"}</div><h1>{platformSlug ? <>{scoped[0]?.name ?? "Unknown platform"}<span>Find your next move.</span></> : <>Your ambition.<span>Your next certification.</span></>}</h1><p>{platformSlug ? scoped[0]?.description : "Cloud, networking, security, and AI. Explore the ecosystem, find your focus, and turn a little practice into real progress."}</p></div>
      <div className="catalog-stat-panel"><span className="eyebrow section-kicker">YOUR POSSIBILITIES</span><strong>{String(total).padStart(2, "0")}<span>tracks to explore</span></strong><div><span className="status-dot" />{status === "ready" ? `${readyCount} ready to practice` : status === "error" ? "Availability unavailable" : "Checking availability…"}</div></div>
    </section>
    <nav className="platform-tabs" aria-label="Choose a platform"><Link href="/certifications" aria-current={!platformSlug ? "page" : undefined}>All platforms</Link>{all.map((platform) => <Link href={`/platforms/${platform.slug}`} key={platform.slug} aria-current={platform.slug === platformSlug ? "page" : undefined}>{platform.name}<span>{platform.tracks.length}</span></Link>)}</nav>
    {platformSlug === "openai" && <p className="catalog-notice">These are independent AI learning tracks, not official OpenAI certifications.</p>}
    <div className="catalog-toolbar"><div className="catalog-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Search certifications" placeholder="Search a certification, skill, or exam…" value={query} onChange={(event) => setQuery(event.target.value)} /></div><label className="filter-select"><span className="sr-only">Certification level</span><select aria-label="Certification level" value={level} onChange={(event) => setLevel(event.target.value)}><option>All levels</option>{Array.from(new Set(scoped.flatMap((platform) => platform.tracks.map((track) => track.level)))).map((value) => <option key={value}>{value}</option>)}</select></label><label className="filter-select"><span className="sr-only">Certification topic</span><select aria-label="Certification topic" value={topic} onChange={(event) => setTopic(event.target.value)}><option>All topics</option>{Array.from(new Set(scoped.flatMap((platform) => platform.tracks.map((track) => track.topic)))).map((value) => <option key={value}>{value}</option>)}</select></label></div>
    <div className="catalog-results-bar"><span role="status">{results} {results === 1 ? "track" : "tracks"} {query || level !== "All levels" || topic !== "All topics" || availableOnly ? "matching your filters" : "to explore"}</span><label><input type="checkbox" checked={availableOnly} disabled={status !== "ready"} onChange={(event) => setAvailableOnly(event.target.checked)} />Ready to practice only</label></div>
    {status === "error" && <div className="catalog-notice" role="alert">We couldn’t check question availability. You can still explore the catalog. <button onClick={() => { setStatus("loading"); setAttempt((value) => value + 1); }}>Retry connection ↻</button></div>}
    {!results && <div className="catalog-empty"><span aria-hidden="true">⌕</span><h2>No tracks found.</h2><p>Try a different keyword or give your filters a little more room.</p><button className="secondary-button" onClick={reset}>Clear filters</button></div>}
    {visible.map((platform) => <section className="track-section" key={platform.slug} aria-labelledby={`heading-${platform.slug}`} style={{ "--platform-accent": platform.accent } as CSSProperties}>
      <div className="track-section-heading"><div><span className={`mini-platform platform-${platform.slug}`} aria-hidden="true">{platform.symbol}</span><h2 id={`heading-${platform.slug}`}>{platform.name}<span>{platform.category}</span></h2></div>{!platformSlug && <Link className="text-action" href={`/platforms/${platform.slug}`}>Explore platform ↗</Link>}</div>
      <div className="track-grid">{platform.tracks.map((track) => {
        const amount = count(platform.slug, track.slug);
        return <article className={`track-card ${amount > 0 ? "track-ready" : ""}`} key={track.slug}><div className="track-card-meta"><span className="level-pill">{track.level}</span><span className={`availability ${amount > 0 ? "available" : ""}`}>{status === "loading" ? "Checking…" : status === "error" ? "Availability unknown" : amount > 0 ? "● Ready to practice" : "Coming soon"}</span></div><span className="track-topic">{track.topic}</span><h3>{track.title}</h3><p>{track.description}</p>{track.sample && <span className="sample-note">Independent sample track</span>}<div className="track-card-bottom"><span>{status === "ready" ? amount > 0 ? `${amount} practice questions` : "Practice not available yet" : "Checking question bank"}</span>{status === "ready" && amount > 0 ? <Link href={`/platform/${track.slug}`} className="track-start">Start practicing <span aria-hidden="true">↗</span></Link> : track.officialUrl ? <a href={track.officialUrl} target="_blank" rel="noopener noreferrer" className="track-official">Official certification <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a> : <span className="track-official">Practice coming soon</span>}</div></article>;
      })}</div>
    </section>)}
    <div className="catalog-bottom-note"><span aria-hidden="true">+</span><p>Progress is personal. Pick one track and make a start.<small>Certi is independent of certification providers. Check official provider pages for current exam requirements.</small></p><Link href="/certifications">Explore all platforms ↗</Link></div>
  </>;
}


