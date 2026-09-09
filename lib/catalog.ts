import type { Platform } from "./types";
export type Track = { slug: string; title: string; level: string; topic: string; description: string; officialUrl?: string; sample?: boolean; badge?: string; examCode?: string; audience?: string; skills?: string[]; examOverview?: string };
export type CatalogPlatform = { slug: string; name: string; symbol: string; category: string; description: string; accent: string; tracks: Track[] };
const aws = "https://aws.amazon.com/certification/";
const ms = "https://learn.microsoft.com/en-us/credentials/certifications/";
const cisco = "https://www.cisco.com/site/us/en/learn/training-certifications/certifications/index.html";
function track(slug: string, title: string, level: string, topic: string, description: string, officialUrl?: string): Track { return { slug, title, level, topic, description, officialUrl }; }
// Provider catalog names checked September 2026. Availability comes from live
// database counts, not this editorial catalog. Official links cover exam details.
export const catalog: CatalogPlatform[] = [
  { slug: "aws", name: "AWS", symbol: "aws", category: "CLOUD COMPUTING", accent: "#efbd7c", description: "From your first cloud concept to architecture at scale. Find your place in the AWS ecosystem.", tracks: [
    { ...track("cloud-practitioner", "Cloud Practitioner", "Foundational", "Cloud", "Build a practical understanding of the AWS Cloud: how its services fit together, how to secure workloads, and how to make informed cost decisions.", aws + "certified-cloud-practitioner/"), badge: "/certifications/aws-cloud-practitioner.png", examCode: "CLF-C02", audience: "A starting point for cloud newcomers, career changers, and business professionals working with technical teams.", skills: ["Cloud concepts", "Security & compliance", "Cloud technology & services", "Billing, pricing & support"], examOverview: "65 questions · 90 minutes · Single and multiple response" },
    track("aws-ai-practitioner", "AI Practitioner", "Foundational", "AI & data", "Explore AI, machine learning, and responsible generative AI on AWS.", aws),
    track("aws-solutions-architect-associate", "Solutions Architect – Associate", "Associate", "Architecture", "Design resilient, secure, and cost-conscious cloud architectures.", aws),
    track("aws-developer-associate", "Developer – Associate", "Associate", "Development", "Develop, deploy, and troubleshoot applications built on AWS.", aws),
    track("aws-solutions-architect-professional", "Solutions Architect – Professional", "Professional", "Architecture", "Work through complex architectures, migrations, and organizational requirements.", aws),
    track("aws-security-specialty", "Security – Specialty", "Specialty", "Security", "Deepen your understanding of protecting data and workloads on AWS.", aws),
  ] },
  { slug: "azure", name: "Azure", symbol: "A", category: "MICROSOFT CLOUD", accent: "#85c3ff", description: "Build your Microsoft cloud foundation. Grow into the infrastructure and data skills that come next.", tracks: [
    { ...track("az-900-fundamentals", "Azure Fundamentals", "Foundational", "Cloud", "Build your foundation in Microsoft Azure, from core cloud concepts to the services and governance tools used to manage a cloud environment.", ms + "azure-fundamentals/"), badge: "/certifications/azure-fundamentals.svg", examCode: "AZ-900", audience: "For learners beginning their cloud journey and professionals who want to understand Azure's capabilities.", skills: ["Cloud concepts", "Azure architecture & services", "Management & governance"] },
    track("azure-administrator-associate", "Azure Administrator Associate", "Associate", "Infrastructure", "Explore identity, storage, compute, virtual networks, and monitoring.", ms + "azure-administrator/"),
    track("azure-data-fundamentals", "Azure Data Fundamentals", "Foundational", "AI & data", "Understand relational and non-relational data and analytics on Azure.", ms + "azure-data-fundamentals/"),
  ] },
  { slug: "cisco", name: "Cisco", symbol: "|||", category: "NETWORKING & SECURITY", accent: "#80ded5", description: "Understand the connections behind everything. Explore networking from the essentials to advanced enterprise systems.", tracks: [
    track("cisco-ccna", "CCNA", "Associate", "Networking", "Build your understanding of network fundamentals, IP connectivity, and security.", cisco),
    track("cisco-ccnp-enterprise", "CCNP Enterprise", "Professional", "Networking", "Explore enterprise networking, infrastructure, and advanced implementation.", cisco),
    track("cisco-ccnp-security", "CCNP Security", "Professional", "Security", "Explore the technologies and practices that protect enterprise networks.", cisco),
  ] },
];
export function mergeCatalog(platforms: Platform[]) {
  const merged = catalog.map((platform) => ({ ...platform, tracks: [...platform.tracks] }));
  for (const platform of platforms) {
    const entry = merged.find((item) => item.slug === platform.slug);
    if (!entry) continue;
    for (const cert of platform.certifications) {
      if (!entry.tracks.some((item) => item.slug === cert.slug)) entry.tracks.push(track(cert.slug, cert.title, "General", "General", `Build your knowledge with ${cert.title} practice questions.`));
    }
  }
  return merged;
}
export function questionCount(platforms: Platform[], platformSlug: string, certSlug: string) {
  return platforms.find((platform) => platform.slug === platformSlug)?.certifications.find((cert) => cert.slug === certSlug)?._count?.questions ?? 0;
}
