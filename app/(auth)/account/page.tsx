import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth-session";
import { authReturnPath } from "@/lib/auth-logic";
import { prisma } from "@/lib/prisma";
import { AccountDashboard } from "@/components/account-dashboard";
export const dynamic = "force-dynamic";
export const metadata = { title: "Your learning space | CertiBlank" };
export default async function Account({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const returnTo = authReturnPath((await searchParams).returnTo);
  const user = await currentUser();
  if (!user) redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  const attempts = await prisma.examAttempt.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, certSlug: true, mode: true, createdAt: true, submittedAt: true, expiresAt: true } });
  // This dynamic server page captures one timestamp per request for consistent hydration.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  return <AccountDashboard name={user.name} email={user.email} returnTo={returnTo} now={now} attempts={attempts.map(attempt => ({ ...attempt, createdAt: attempt.createdAt.toISOString(), submittedAt: attempt.submittedAt?.toISOString() ?? null, expiresAt: attempt.expiresAt?.toISOString() ?? null }))} />;
}
