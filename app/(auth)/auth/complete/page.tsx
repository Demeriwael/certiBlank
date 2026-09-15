import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth-session";
import { authReturnPath } from "@/lib/auth-logic";
import { ClaimProgress } from "@/components/claim-progress";
export const dynamic = "force-dynamic";
export default async function Complete({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const returnTo = authReturnPath((await searchParams).returnTo);
  if (!await currentUser()) redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  return <ClaimProgress returnTo={returnTo} />;
}
