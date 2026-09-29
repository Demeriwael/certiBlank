"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "./brand";
import { AccountLink } from "./account-link";
import { AccountIcon } from "./account-icon";
import { GitHubButton } from "./github-button";
import { NavigationPopover } from "./navigation-popover";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  const pathname = usePathname();
  const catalogActive = pathname === "/certifications" || pathname.startsWith("/platforms/") || pathname.startsWith("/platform/");
  return <header className="site-header polished-header">
    <Brand />
    <nav className="desktop-navigation" aria-label="Main navigation">
      <Link className="nav-link" href="/certifications" aria-current={catalogActive ? "page" : undefined}>Certifications</Link>
      <Link className="nav-link" href="/request-certification" aria-current={pathname === "/request-certification" ? "page" : undefined}>Request an exam</Link>
      {pathname === "/" && <Link className="nav-link" href="/#how-it-works">How it works</Link>}
    </nav>
    <div className="header-actions">
      <NavigationPopover key={pathname} label="Navigation menu" className="mobile-navigation" trigger={<AccountIcon name="menu" />}>
        <div className="nav-popover-heading"><strong>Explore CertiBlank</strong><span>Your next step starts here.</span></div>
        <nav className="nav-popover-links" aria-label="Main navigation">
          <Link href="/" aria-current={pathname === "/" ? "page" : undefined}><AccountIcon name="user" />Home</Link>
          <Link href="/certifications" aria-current={catalogActive ? "page" : undefined}><AccountIcon name="book" />Certifications</Link>
          <Link href="/request-certification" aria-current={pathname === "/request-certification" ? "page" : undefined}><AccountIcon name="plus" />Request an exam</Link>
          <Link href="/#how-it-works"><AccountIcon name="arrow" />How it works</Link>
        </nav>
        <div className="nav-popover-appearance"><span>Appearance</span><ThemeToggle showLabel /></div>
        <div className="nav-popover-footer"><GitHubButton /></div>
      </NavigationPopover>
      <AccountLink />
      <div className="header-github"><GitHubButton /></div>
    </div>
  </header>;
}
