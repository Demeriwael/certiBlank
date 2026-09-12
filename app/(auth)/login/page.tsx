import { AuthForm } from "@/components/auth-form";
import { authReturnPath } from "@/lib/auth-logic";
import { googleEnabled } from "@/lib/auth";
export const dynamic = "force-dynamic";
export const metadata = { title: "Log in | CertiBlank" };
export default async function Login({ searchParams }: { searchParams: Promise<{ returnTo?: string; error?: string }> }) {
  const params = await searchParams;
  return <AuthForm signup={false} returnTo={authReturnPath(params.returnTo)} google={googleEnabled} initialError={params.error ? "Google sign-in didn't finish. Try again or use the sign-in method you originally registered with." : ""} />;
}
