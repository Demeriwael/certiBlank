import type { Metadata } from "next";
import { AuthNotice } from "@/components/auth-notice";
import { AccountNavigationState } from "@/components/account-navigation-state";
import { displayBootstrap } from "@/lib/display-preferences";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./theme.css";
import "./light-theme.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Certi — Your next certification starts here",
  description: "Customized exam prep questions, flashcards, and practice tests for top IT certifications.",
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
      <body className="min-h-full flex flex-col"><AccountNavigationState />{children}<AuthNotice /></body>
    </html>
  );
}

