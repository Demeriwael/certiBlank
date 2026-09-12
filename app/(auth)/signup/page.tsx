import { AuthForm } from "@/components/auth-form";
import { authReturnPath } from "@/lib/auth-logic";
import { googleEnabled } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function Signup({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  return <AuthForm signup returnTo={authReturnPath((await searchParams).returnTo)} google={googleEnabled} />;
}
