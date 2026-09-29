"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { AccountIcon } from "./account-icon";

export function AuthForm({ signup, returnTo, google, github, initialError = "" }: { signup: boolean; returnTo: string; google: boolean; github: boolean; initialError?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"email" | "google" | "github" | null>(null);
  const [error, setError] = useState(initialError);
  const [visible, setVisible] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const alert = useRef<HTMLDivElement>(null);
  const finish = `/auth/complete?returnTo=${encodeURIComponent(returnTo)}`;
  const continuing = returnTo.startsWith("/platform/");
  useEffect(() => { if (!initialError) heading.current?.focus({ preventScroll: true }); }, [initialError]);
  useEffect(() => { if (error) alert.current?.focus(); }, [error]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("email"); setError("");
    const data = new FormData(event.currentTarget);
    const credentials = { email: String(data.get("email")).trim(), password: String(data.get("password")) };
    try {
      const result = signup ? await authClient.signUp.email({ ...credentials, name: String(data.get("name")).trim() }) : await authClient.signIn.email(credentials);
      if (result.error) {
        setError(result.error.status === 429 ? "Too many attempts. Wait a minute, then try again." : signup ? "We couldn't create your account. Check your details, or log in if you already have an account." : "We couldn't log you in. Check your email and password, then try again.");
        setBusy(null); return;
      }
      router.replace(finish); router.refresh();
    } catch { setError("Connection interrupted. Your progress is safe. Please try again."); setBusy(null); }
  }
  async function social(provider: "google" | "github") {
    setBusy(provider); setError("");
    try {
      const result = await authClient.signIn.social({ provider, callbackURL: finish, errorCallbackURL: `/login?returnTo=${encodeURIComponent(returnTo)}` });
      if (result.error) { setError(`${provider === "google" ? "Google" : "GitHub"} sign-in isn't available right now. Try again or use another method.`); setBusy(null); }
    } catch { setError(`Couldn't connect to ${provider === "google" ? "Google" : "GitHub"}. Please try again.`); setBusy(null); }
  }
  return <div className="auth-split">
    <aside className="auth-story" aria-label="Your learning journey">
      <span className="auth-kicker"><span />BUILT FOR YOUR NEXT CHAPTER</span>
      <h2>A little practice.<br /><span>A lot of possibility.</span></h2>
      <p>One place for the work you put in, and the progress that comes next.</p>
      <div className="auth-journey">
        <div><span className="journey-icon"><AccountIcon name="book" /></span><div><strong>Make it a habit</strong><p>Practice by domain or test your knowledge.</p></div></div>
        <div><span className="journey-icon"><AccountIcon name="check" /></span><div><strong>Build understanding</strong><p>Learn the reasoning behind every answer.</p></div></div>
        <div><span className="journey-icon"><AccountIcon name="arrow" /></span><div><strong>Pick up where you left off</strong><p>Keep your sessions together across devices.</p></div></div>
      </div>
      <div className="auth-providers"><span>AWS</span><span>Azure</span><span>Cisco</span></div>
      <small>Your pace. Your next certification.</small>
    </aside>
    <section className="auth-card auth-entry">
      <nav className="auth-tabs" aria-label="Account access">
        <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`} aria-current={!signup ? "page" : undefined}>Log in</Link>
        <Link href={`/signup?returnTo=${encodeURIComponent(returnTo)}`} aria-current={signup ? "page" : undefined}>Sign up</Link>
      </nav>
      <h1 ref={heading} tabIndex={-1}>{signup ? "Make progress yours." : "Back for your next step."}</h1>
      <p className="auth-description">{signup ? "Create your free account. Keep every session within reach." : "Log in to your practice history and continue where you left off."}</p>
      <p className="legal-form-notice">By creating an account, including through Google or GitHub, you agree to the <Link href="/terms">Terms of Service</Link>. Read our <Link href="/privacy">Privacy Policy</Link> for how your information is used. Ages 13+; parent or guardian permission may be required where you live.</p>
      {continuing && <div className="auth-context"><AccountIcon name="shield" /><span>You’ll return to your practice session.<small>Timed exams keep counting down while you’re here.</small></span></div>}
      {error && <div className="auth-error" role="alert" ref={alert} tabIndex={-1}>{error}</div>}
      {(google || github) && <div className="auth-social-options">
        {google && <button type="button" className="auth-social" disabled={Boolean(busy)} onClick={() => social("google")}>{busy === "google" ? <span className="auth-spinner" /> : <span className="auth-google-mark" aria-hidden="true">G</span>}{busy === "google" ? "Connecting to Google…" : "Continue with Google"}</button>}
        {github && <button type="button" className="auth-social" disabled={Boolean(busy)} onClick={() => social("github")}>{busy === "github" ? <span className="auth-spinner" /> : <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.18c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.72 1.16 1.72 1.16 1 .17 2.64.6 3.27-.95.1-.73.39-1.23.71-1.51-2.5-.28-5.13-1.25-5.13-5.56 0-1.23.44-2.24 1.16-3.03-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.1 1.16a10.8 10.8 0 0 1 5.64 0c2.15-1.46 3.1-1.16 3.1-1.16.61 1.55.23 2.7.11 2.98.72.79 1.16 1.8 1.16 3.03 0 4.32-2.64 5.27-5.15 5.55.4.35.75 1.04.75 2.1v3.12c0 .3.2.65.77.54A11.25 11.25 0 0 0 12 .75Z" /></svg>}{busy === "github" ? "Connecting to GitHub…" : "Continue with GitHub"}</button>}
        <div className="auth-divider"><span>or with email</span></div>
      </div>}
      <form className="auth-form" onSubmit={submit} aria-busy={Boolean(busy)}>
        {signup && <label htmlFor="auth-name">Your name<input id="auth-name" name="name" autoComplete="name" placeholder="What should we call you?" required maxLength={100} readOnly={Boolean(busy)} /></label>}
        <label htmlFor="auth-email">Email address<input id="auth-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} readOnly={Boolean(busy)} /></label>
        <div className="auth-field"><label htmlFor="auth-password">Password</label><div className="auth-password"><input id="auth-password" name="password" type={visible ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} minLength={signup ? 12 : undefined} maxLength={128} required readOnly={Boolean(busy)} aria-describedby={signup ? "password-help" : undefined} /><button type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible(value => !value)}><AccountIcon name="eye" /><span>{visible ? "Hide" : "Show"}</span></button></div>{signup && <small id="password-help">12–128 characters. A memorable passphrase works well.</small>}</div>
        <button className="primary-button auth-submit" disabled={Boolean(busy)}>{busy === "email" ? <><span className="auth-spinner" />{signup ? "Creating your account…" : "Logging you in…"}</> : <>{signup ? "Create account" : "Log in"}<AccountIcon name="arrow" /></>}</button>
      </form>
      <p className="auth-switch">{signup ? "Already have an account?" : "New here?"} <Link href={`${signup ? "/login" : "/signup"}?returnTo=${encodeURIComponent(returnTo)}`}>{signup ? "Log in" : "Create an account"}</Link></p>
      <div className="auth-guest"><Link href={continuing ? returnTo : "/certifications"}>{continuing ? "Back to my practice session" : "Just exploring? Practice without an account"}<AccountIcon name="arrow" /></Link></div>
    </section>
  </div>;
}
