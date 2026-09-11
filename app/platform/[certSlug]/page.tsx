import ExamSetup from "./exam-setup";

export default async function PlatformPage({ params }: { params: Promise<{ certSlug: string }> }) {
  const { certSlug } = await params;
  return <ExamSetup key={certSlug} certSlug={certSlug} />;
}
