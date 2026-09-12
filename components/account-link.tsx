"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AccountIcon } from "./account-icon";
export function AccountLink() {
  const pathname = usePathname();
  const { data: session, isPending, error } = authClient.useSession();
  const query = `?returnTo=${encodeURIComponent(pathname)}`;
  if (isPending) return <span className="account-nav account-nav-pending" role="status"><span className="account-nav-placeholder" /><span className="sr-only">Checking account</span></span>;
  if (session || error) return <div className="account-nav"><Link className="account-link" href={`/account${query}`}><AccountIcon name="user" />My account</Link></div>;
  return <div className="account-nav"><Link className="account-login" href={`/login${query}`}>Log in</Link><Link className="account-link" href={`/signup${query}`}>Sign up<AccountIcon name="arrow" /></Link></div>;
}

