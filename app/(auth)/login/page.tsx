import { AuthForm } from "@/components/auth-form";
import { authReturnPath } from "@/lib/auth-logic";
import { googleEnabled } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function Login({ searchParams }: { searchParams: Promise<{ returnTo?: string; error?: string }> }) {
  const params = await searchParams;
  return <>{params.error && <p role="alert" className="auth-error">Google sign-in did not finish. Try again, or use your existing email login. Different sign-in methods are not automatically linked.</p>}<AuthForm signup={false} returnTo={authReturnPath(params.returnTo)} google={googleEnabled} /></>;
}
