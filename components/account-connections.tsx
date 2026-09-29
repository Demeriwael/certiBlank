"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { AccountIcon } from "./account-icon";

type Provider = "google" | "github";

export function AccountConnections({ google, github, connection }: { google: boolean; github: boolean; connection?: string }) {
  const [linked, setLinked] = useState<string[] | null>(null);
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    authClient.listAccounts().then(result => {
      if (!active) return;
      if (result.error) setError("Couldn't load your sign-in methods. Please reload this page.");
      else setLinked(result.data?.map(account => account.providerId) ?? []);
    }).catch(() => { if (active) setError("Couldn't load your sign-in methods. Please reload this page."); });
    return () => { active = false; };
  }, []);

  async function connect(provider: Provider) {
    setBusy(provider); setError("");
    try {
      const result = await authClient.linkSocial({
        provider,
        callbackURL: "/account?connection=linked",
        errorCallbackURL: "/account?connection=failed",
      });
      if (result.error) { setError(`Couldn't connect ${provider === "google" ? "Google" : "GitHub"}. Please try again.`); setBusy(null); }
    } catch { setError("Connection interrupted. Please try again."); setBusy(null); }
  }

  if (!google && !github) return null;
  return <section className="account-connections" aria-labelledby="connections-title">
    <h2 id="connections-title">Sign-in methods</h2>
    <p>Connect a provider while signed in so you can use it to access this account next time. Choose the same email address you use here.</p>
    {connection === "linked" && <p className="account-connection-success" role="status">Sign-in method connected.</p>}
    {connection === "failed" && <p className="auth-error" role="alert">Could not connect that sign-in method. Make sure the provider uses this account’s email, then try again.</p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    <div className="account-connection-actions" aria-busy={linked === null && !error}>
      {([google && "google", github && "github"].filter(Boolean) as Provider[]).map(provider => <div className="account-provider-connection" key={provider}>
        <span className="account-connection-symbol" aria-hidden="true"><AccountIcon name={linked?.includes(provider) ? "check" : "shield"} /></span>
        <div><strong>{provider === "google" ? "Google" : "GitHub"}</strong><span>{linked?.includes(provider) ? "Connected to your account" : linked === null ? error ? "Status unavailable" : "Checking connection…" : "Not connected"}</span></div>
        <button type="button" aria-label={`${provider === "google" ? "Google" : "GitHub"}: ${linked?.includes(provider) ? "Connected" : busy === provider ? "Connecting" : "Connect"}`} disabled={Boolean(busy) || linked === null || linked.includes(provider)} onClick={() => connect(provider)}>
          {linked?.includes(provider) ? "Connected" : busy === provider ? "Connecting…" : "Connect"}
        </button>
      </div>)}
    </div>
  </section>;
}
