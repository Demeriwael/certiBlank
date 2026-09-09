import { CatalogIcon } from "@/components/catalog-icon";
import Link from "next/link";
import { Brand } from "@/components/brand";
import CertificationCatalog from "@/components/certification-catalog";

export const metadata = { title: "Explore certifications | Certi", description: "Find your next AWS, Azure, or Cisco certification. Browse by platform, level, and topic." };

export default function CertificationsPage() {
  return <div className="site-shell"><header className="site-header"><Brand /><Link className="nav-link" href="/">Back to home <CatalogIcon /></Link></header><main className="catalog-page section-wrap"><CertificationCatalog /></main></div>;
}

