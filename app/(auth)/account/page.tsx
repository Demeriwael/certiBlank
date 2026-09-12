import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth-session";
import { authReturnPath } from "@/lib/auth-logic";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function Account({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const returnTo = authReturnPath((await searchParams).returnTo);
  const user = await currentUser();
  if (!user) redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  const attempts = await prisma.examAttempt.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, certSlug: true, mode: true, createdAt: true, submittedAt: true, expiresAt: true } });
  return <><section className="auth-card"><div className="eyebrow">YOUR ACCOUNT</div><h1>{user.name}</h1><p>{user.email}</p><p>Your practice history follows you across devices. Showing your latest 50 sessions.</p><div className="auth-actions"><Link href={returnTo === "/account" ? "/certifications" : returnTo}>Continue practicing</Link><Link href="/logout">Log out</Link></div></section><h2>Practice history</h2>{!attempts.length && <p>No linked sessions yet. Start practicing, or <Link href={`/auth/complete?returnTo=${encodeURIComponent(returnTo)}`}>link practice from this browser</Link>.</p>}<ul className="auth-history">{attempts.map(attempt => <li key={attempt.id}><Link href={`/platform/${attempt.certSlug}?attempt=${attempt.id}`}>{attempt.certSlug.replaceAll("-", " ")}<span>{attempt.mode === "mock" ? "Mock exam" : "Domain practice"} · {attempt.submittedAt ? "Completed — review answers" : attempt.expiresAt && attempt.expiresAt < new Date() ? "Time ended — view results" : "In progress — resume"} · {attempt.createdAt.toLocaleDateString("en", { timeZone: "UTC" })}</span></Link></li>)}</ul></>;
}
