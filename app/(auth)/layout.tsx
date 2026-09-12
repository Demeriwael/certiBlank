import Link from "next/link";
import { Brand } from "@/components/brand";
import "./auth.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="site-shell auth-shell"><a className="auth-skip" href="#account-main">Skip to account content</a><header className="site-header"><Brand /><Link className="nav-link" href="/certifications">Explore certifications</Link></header><main id="account-main" className="auth-main" tabIndex={-1}>{children}</main></div>;
}
