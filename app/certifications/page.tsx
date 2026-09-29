import { SiteHeader } from "@/components/site-header";
import CertificationCatalog from "@/components/certification-catalog";

export const metadata = { title: "Explore certifications | Certi", description: "Find your next AWS, Azure, or Cisco certification. Browse by platform, level, and topic." };

export default function CertificationsPage() {
  return <div className="site-shell"><SiteHeader /><main className="catalog-page section-wrap"><CertificationCatalog /></main></div>;
}

