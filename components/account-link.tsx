"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountIcon } from "./account-icon";
import { NavigationPopover } from "./navigation-popover";
import { ThemeToggle } from "./theme-toggle";
export function AccountLink() {
  const pathname = usePathname();
  const query = `?returnTo=${encodeURIComponent(pathname)}`;
  return <div className="account-nav">
    <div className="account-member">
      <NavigationPopover key={pathname} label="My account" className="account-disclosure" hover trigger={<><span className="nav-account-avatar"><AccountIcon name="user" /></span><span>My account</span><AccountIcon name="chevron" /></>}>
        <div className="nav-popover-heading"><strong>Your learning space</strong><span>Pick up where you left off.</span></div>
        <nav aria-label="Account shortcuts" className="nav-popover-links">
          <Link href={`/account${query}`}><AccountIcon name="user" /><span>Account overview</span></Link>
          <Link href={`/account${query}#practice-history`}><AccountIcon name="history" /><span>Practice history</span></Link>
          <Link href={`/account${query}#account-settings`}><AccountIcon name="shield" /><span>Sign-in & settings</span></Link>
          <Link href="/certifications"><AccountIcon name="book" /><span>Start a practice session</span></Link>
        </nav>
        <div className="nav-popover-appearance"><span>Appearance</span><ThemeToggle showLabel /></div>
        <Link className="nav-signout" href="/logout" prefetch={false}><AccountIcon name="logout" />Log out</Link>
      </NavigationPopover>
    </div>
    <div className="account-guest"><Link className="account-login" href={`/login${query}`}>Log in</Link><Link className="account-link" href={`/signup${query}`}>Sign up<AccountIcon name="arrow" /></Link></div>
  </div>;
}
