"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CatalogIcon } from "./catalog-icon";

export function StartPracticeLink({ slug }: { slug: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const href = `/platform/${slug}`;

  return <Link href={href} className="track-start" aria-busy={pending} aria-disabled={pending}
    onNavigate={event => {
      event.preventDefault();
      if (!pending) startTransition(() => router.push(href));
    }}>
    <span role="status">{pending ? "Loading practice…" : "Start practicing"}</span>
    {pending ? <span className="practice-spinner" aria-hidden="true" /> : <CatalogIcon />}
  </Link>;
}
