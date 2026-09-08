import Link from "next/link";
import { Brand } from "@/components/brand";
import CertificationCatalog from "@/components/certification-catalog";
import { catalog } from "@/lib/catalog";

export async function generateMetadata({ params }: { params: Promise<{ platformSlug: string }> }) {
  const { platformSlug } = await params;
  const platform = catalog.find((item) => item.slug === platformSlug);
  return { title: `${platform?.name ?? "Platform"} certifications | Certi`, description: platform?.description };
}
export default async function PlatformHub({ params }: { params: Promise<{ platformSlug: string }> }) {
  const { platformSlug } = await params;
  return <div className="site-shell"><header className="site-header"><Brand /><Link className="nav-link" href="/certifications">All certifications ↗</Link></header><main className="catalog-page section-wrap"><CertificationCatalog key={platformSlug} platformSlug={platformSlug} /></main></div>;
}
