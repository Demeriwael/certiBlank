import type { Platform } from "./types";
export type Track = { slug: string; title: string; level: string; topic: string; description: string; officialUrl?: string; sample?: boolean };
export type CatalogPlatform = { slug: string; name: string; symbol: string; category: string; description: string; accent: string; tracks: Track[] };
const aws = "https://aws.amazon.com/certification/";
const ms = "https://learn.microsoft.com/en-us/credentials/certifications/";
const cisco = "https://www.cisco.com/site/us/en/learn/training-certifications/certifications/index.html";
function track(slug: string, title: string, level: string, topic: string, description: string, officialUrl?: string): Track { return { slug, title, level, topic, description, officialUrl }; }
// Provider catalog names checked September 2026. Availability comes from live
// database counts, not this editorial catalog. Official links cover exam details.
export const catalog: CatalogPlatform[] = [
  { slug: "aws", name: "AWS", symbol: "aws", category: "CLOUD COMPUTING", accent: "#efbd7c", description: "From your first cloud concept to architecture at scale. Find your place in the AWS ecosystem.", tracks: [
    track("cloud-practitioner", "Cloud Practitioner", "Foundational", "Cloud", "Build a foundation in cloud concepts, core services, security, and billing.", aws),
    track("aws-ai-practitioner", "AI Practitioner", "Foundational", "AI & data", "Explore AI, machine learning, and responsible generative AI on AWS.", aws),
    track("aws-solutions-architect-associate", "Solutions Architect – Associate", "Associate", "Architecture", "Design resilient, secure, and cost-conscious cloud architectures.", aws),
    track("aws-developer-associate", "Developer – Associate", "Associate", "Development", "Develop, deploy, and troubleshoot applications built on AWS.", aws),
    track("aws-solutions-architect-professional", "Solutions Architect – Professional", "Professional", "Architecture", "Work through complex architectures, migrations, and organizational requirements.", aws),
    track("aws-security-specialty", "Security – Specialty", "Specialty", "Security", "Deepen your understanding of protecting data and workloads on AWS.", aws),
  ] },
  { slug: "azure", name: "Azure", symbol: "A", category: "MICROSOFT CLOUD", accent: "#85c3ff", description: "Build your Microsoft cloud foundation. Grow into the infrastructure and data skills that come next.", tracks: [
    track("az-900-fundamentals", "Azure Fundamentals", "Foundational", "Cloud", "Start with cloud concepts, Azure services, management, and governance.", ms + "azure-fundamentals/"),
    track("azure-administrator-associate", "Azure Administrator Associate", "Associate", "Infrastructure", "Explore identity, storage, compute, virtual networks, and monitoring.", ms + "azure-administrator/"),
    track("azure-data-fundamentals", "Azure Data Fundamentals", "Foundational", "AI & data", "Understand relational and non-relational data and analytics on Azure.", ms + "azure-data-fundamentals/"),
  ] },
  { slug: "cisco", name: "Cisco", symbol: "|||", category: "NETWORKING & SECURITY", accent: "#80ded5", description: "Understand the connections behind everything. Explore networking from the essentials to advanced enterprise systems.", tracks: [
    track("cisco-ccna", "CCNA", "Associate", "Networking", "Build your understanding of network fundamentals, IP connectivity, and security.", cisco),
    track("cisco-ccnp-enterprise", "CCNP Enterprise", "Professional", "Networking", "Explore enterprise networking, infrastructure, and advanced implementation.", cisco),
    track("cisco-ccnp-security", "CCNP Security", "Professional", "Security", "Explore the technologies and practices that protect enterprise networks.", cisco),
  ] },
  { slug: "openai", name: "OpenAI", symbol: "✳", category: "AI LEARNING TRACKS", accent: "#d1f879", description: "Learn the foundations of building with AI through independent, hands-on practice.", tracks: [
    { ...track("certified-developer", "AI Developer Foundations", "Foundational", "Development", "Practice API safety, prompting, embeddings, and evaluating model output."), sample: true },
  ] },
];
export function mergeCatalog(platforms: Platform[]) {
  const merged = catalog.map((platform) => ({ ...platform, tracks: [...platform.tracks] }));
  for (const platform of platforms) {
    let entry = merged.find((item) => item.slug === platform.slug);
    if (!entry) {
      entry = { slug: platform.slug, name: platform.name, symbol: platform.name.slice(0, 2), category: "TECHNOLOGY", accent: "#d1f879", description: `Explore your next step with ${platform.name}.`, tracks: [] };
      merged.push(entry);
    }
    for (const cert of platform.certifications) {
      if (!entry.tracks.some((item) => item.slug === cert.slug)) entry.tracks.push(track(cert.slug, cert.title, "General", "General", `Build your knowledge with ${cert.title} practice questions.`));
    }
  }
  return merged;
}
export function questionCount(platforms: Platform[], platformSlug: string, certSlug: string) {
  return platforms.find((platform) => platform.slug === platformSlug)?.certifications.find((cert) => cert.slug === certSlug)?._count?.questions ?? 0;
}
