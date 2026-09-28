import { AuthForm } from "@/components/auth-form";
import { authReturnPath } from "@/lib/auth-logic";
import { githubEnabled, googleEnabled } from "@/lib/auth";
export const dynamic = "force-dynamic";
export const metadata = { title: "Log in | CertiBlank" };
export default async function Login({ searchParams }: { searchParams: Promise<{ returnTo?: string; error?: string | string[] }> }) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error.at(-1) : params.error;
  const initialError = error === "account_not_linked"
    ? "This email already has a CertiBlank account. Log in with its original method, then connect Google or GitHub from your account page."
    : error ? "Social sign-in didn't finish. Please try again." : "";
  return <AuthForm signup={false} returnTo={authReturnPath(params.returnTo)} google={googleEnabled} github={githubEnabled} initialError={initialError} />;
}
