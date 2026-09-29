import { SiteHeader } from "@/components/site-header";
import "./legal.css";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <div className="site-shell legal-shell"><a className="legal-skip" href="#legal-main">Skip to policy content</a><SiteHeader />{children}</div>;
}
