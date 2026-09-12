"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AccountLink() {
  const pathname = usePathname();
  return <Link className="nav-link account-link" href={`/account?returnTo=${encodeURIComponent(pathname)}`}>Account</Link>;
}
