import type { Metadata } from "next";
import { AuthNotice } from "@/components/auth-notice";
import { LegalFooter } from "@/components/legal-footer";
import { AccountNavigationState } from "@/components/account-navigation-state";
import { displayBootstrap } from "@/lib/display-preferences";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./theme.css";
import "./light-theme.css";
import "./loading-ui.css";
import "./navigation.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://certiblank.com"),
  title: "CertiBlank — Free AWS & Azure Certification Practice",
  description: "Prepare for AWS and Azure certifications with free timed mock exams, focused domain practice, detailed explanations, and saved progress. Start without an account.",
  applicationName: "CertiBlank",
  authors: [{ name: "Wael Demeri" }],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "CertiBlank",
    locale: "en_US",
    title: "CertiBlank — Free AWS & Azure Certification Practice",
    description: "Prepare for AWS and Azure certifications with free timed mock exams, focused domain practice, detailed explanations, and saved progress. Start without an account.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CertiBlank — Free AWS & Azure Certification Practice",
    description: "Prepare for AWS and Azure certifications with free timed mock exams, focused domain practice, detailed explanations, and saved progress. Start without an account.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      data-account="guest"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head><script dangerouslySetInnerHTML={{ __html: displayBootstrap }} /></head>
      <body className="min-h-full flex flex-col"><AccountNavigationState />{children}<LegalFooter /><AuthNotice /></body>
    </html>
  );
}

