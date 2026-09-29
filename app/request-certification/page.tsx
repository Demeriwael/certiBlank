import { SiteHeader } from "@/components/site-header";
import Link from "next/link";
import { CatalogIcon } from "@/components/catalog-icon";
import { CertificationRequestForm } from "@/components/certification-request-form";

export const metadata = { title: "Request a certification | Certi", description: "Tell CertiBlank which IT certification you would like to practice next." };

export default async function RequestCertification({ searchParams }: { searchParams: Promise<{ platform?: string; certification?: string }> }) {
  const params = await searchParams;
  return <div className="site-shell"><SiteHeader />
    <main className="section-wrap cert-request-page"><div className="eyebrow section-kicker">HELP SHAPE THE CATALOG</div><h1>What should we add next?</h1><p>Looking for an exam we don’t have yet? Tell us the platform and certification. We review requests when planning new question banks.</p>
      <CertificationRequestForm initialPlatform={params.platform?.slice(0, 80) ?? ""} initialCertification={params.certification?.slice(0, 120) ?? ""} />
      <Link className="text-action" href="/certifications">Back to certifications<CatalogIcon name="arrow" /></Link>
    </main>
  </div>;
}
