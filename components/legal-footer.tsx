import Link from "next/link";

export function LegalFooter() {
  return <footer className="legal-footer">
    <span>CertiBlank · Independent certification practice</span>
    <nav aria-label="Legal and contact">
      <Link href="/privacy">Privacy Policy</Link>
      <Link href="/terms">Terms of Service</Link>
      <a href="mailto:waeldemeri@gmail.com">Contact</a>
    </nav>
  </footer>;
}
