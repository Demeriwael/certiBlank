"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountIcon } from "./account-icon";
export function AccountLink() {
  const pathname = usePathname();
  const query = `?returnTo=${encodeURIComponent(pathname)}`;
  return <div className="account-nav"><div className="account-member"><Link className="account-link" href={`/account${query}`}><AccountIcon name="user" />My account</Link></div><div className="account-guest"><Link className="account-login" href={`/login${query}`}>Log in</Link><Link className="account-link" href={`/signup${query}`}>Sign up<AccountIcon name="arrow" /></Link></div></div>;
}
