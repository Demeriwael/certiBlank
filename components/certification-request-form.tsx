"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { CatalogIcon } from "./catalog-icon";

export function CertificationRequestForm({ initialPlatform = "", initialCertification = "" }: { initialPlatform?: string; initialCertification?: string }) {
  const [platform, setPlatform] = useState(initialPlatform);
  const [certification, setCertification] = useState(initialCertification);
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const statusRef = useRef<HTMLParagraphElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setMessage("");
    try {
      const response = await fetch("/api/certification-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, certification }),
      });
      const data: { error?: string; message?: string } = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to send your request. Please try again.");
      setState("success");
      setMessage(data.message ?? "Your request has been received.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Unable to send your request. Please try again.");
    }
    requestAnimationFrame(() => statusRef.current?.focus());
  }

  return <form className="cert-request-form" onSubmit={submit}>
    <label htmlFor="request-platform">Platform</label>
    <input id="request-platform" name="platform" list="request-platforms" required maxLength={80} autoComplete="off" value={platform} onChange={event => setPlatform(event.target.value)} disabled={state === "success"} placeholder="e.g. AWS, Azure, Cisco" />
    <datalist id="request-platforms"><option value="AWS" /><option value="Azure" /><option value="Cisco" /></datalist>
    <label htmlFor="request-certification">Certification name</label>
    <input id="request-certification" name="certification" required maxLength={120} autoComplete="off" value={certification} onChange={event => setCertification(event.target.value)} disabled={state === "success"} placeholder="e.g. Solutions Architect – Associate" />
    <p className="cert-request-help">No account or email is required. Requests help us decide which question banks to prepare next.</p>
    <p className="legal-form-notice">Please include only the platform and certification name, not personal information. <Link href="/privacy">How we handle requests</Link>.</p>
    {state !== "idle" && state !== "sending" && <p ref={statusRef} tabIndex={-1} className={`cert-request-status ${state}`} role={state === "error" ? "alert" : "status"}>{message}</p>}
    <button className="primary-button" type="submit" disabled={state === "sending" || state === "success"}>{state === "sending" ? "Sending…" : state === "success" ? "Request sent" : "Send request"}<CatalogIcon name="arrow" /></button>
  </form>;
}
