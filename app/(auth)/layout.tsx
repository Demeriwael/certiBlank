import { SiteHeader } from "@/components/site-header";
import "./auth.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="site-shell auth-shell"><a className="auth-skip" href="#account-main">Skip to account content</a><SiteHeader /><main id="account-main" className="auth-main" tabIndex={-1}>{children}</main></div>;
}
