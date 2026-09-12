"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ signup, returnTo, google }: { signup: boolean; returnTo: string; google: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const alert = useRef<HTMLDivElement>(null);
  const finish = `/auth/complete?returnTo=${encodeURIComponent(returnTo)}`;
  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => { if (error) alert.current?.focus(); }, [error]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    const credentials = { email: String(data.get("email")).trim(), password: String(data.get("password")) };
    try {
      const result = signup ? await authClient.signUp.email({ ...credentials, name: String(data.get("name")).trim() }) : await authClient.signIn.email(credentials);
      if (result.error) { setError(signup ? "Unable to create this account. Check your details or try logging in." : "Unable to log in. Check your email and password, or try again shortly."); return; }
      router.replace(finish); router.refresh();
    } catch { setError("Unable to connect. Please try again."); }
    finally { setBusy(false); }
  }
  async function social() {
    setBusy(true); setError("");
    try {
      const result = await authClient.signIn.social({ provider: "google", callbackURL: finish, errorCallbackURL: `/login?error=oauth&returnTo=${encodeURIComponent(returnTo)}` });
      if (result.error) setError("Google login is unavailable. Please try again or use email.");
    } catch { setError("Unable to connect to Google. Please try again."); }
    finally { setBusy(false); }
  }
  return <section className="auth-card"><div className="eyebrow">YOUR NEXT MILESTONE</div><h1 ref={heading} tabIndex={-1}>{signup ? "Keep your progress." : "Welcome back."}</h1><p>{signup ? "Create an account to keep your practice history across devices. Your current practice session comes with you." : "Log in to continue your certification journey."}</p>
    {error && <div className="auth-error" role="alert" ref={alert} tabIndex={-1}>{error}</div>}
    <form className="auth-form" onSubmit={submit} aria-busy={busy}>
      {signup && <label>Your name<input name="name" autoComplete="name" required maxLength={100} disabled={busy} /></label>}
      <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} disabled={busy} /></label>
      <label>Password<input name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} minLength={signup ? 12 : undefined} maxLength={128} required disabled={busy} aria-describedby={signup ? "password-help" : undefined} />{signup && <small id="password-help">Use 12–128 characters. Password managers and pasting are supported.</small>}</label>
      <button className="primary-button" disabled={busy}>{busy ? "Please wait…" : signup ? "Create account" : "Log in"}</button>
    </form>
    {google && <button className="secondary-button" disabled={busy} onClick={social}>Continue with Google</button>}
    <p>{signup ? "Already have an account?" : "New to CertiBlank?"} <Link href={`${signup ? "/login" : "/signup"}?returnTo=${encodeURIComponent(returnTo)}`}>{signup ? "Log in" : "Create an account"}</Link></p>
    <Link href={returnTo === "/account" ? "/certifications" : returnTo}>Continue practicing without an account</Link>
  </section>;
}
