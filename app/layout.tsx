import type { Metadata } from "next";
import { Inter, EB_Garamond } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { LanguageProvider } from "@/lib/contexts/LanguageContext";
import { QueryClientProvider } from "@/lib/contexts/QueryClientProvider";
import { ReaderSettingsProvider } from "@/lib/contexts/ReaderSettingsContext";
import { KeyboardShortcutsProvider } from "@/components/KeyboardShortcutsProvider";
import { AuthQuerySync } from "@/components/AuthQuerySync";
import { RisoDefs } from "@/components/riso/RisoDefs";

// next/font self-hosts both families and exposes them as CSS variables, which
// globals.css folds into --font-inter / --font-eb-garamond (with fallbacks).
const inter = Inter({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-inter-loaded", display: "swap" });
const ebGaramond = EB_Garamond({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-eb-garamond-loaded", display: "swap" });

export const metadata: Metadata = {
  title: {
    template: "%s | Verbista",
    default: "Verbista",
  },
  description: "Grammar-in-context reading for Russian, Spanish, English, and French. Tap any word for its case, tense, and aspect.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Verbista — Read, understand, grow",
    description: "Grammar-in-context reading for Russian, Spanish, English, and French. Tap any word for its case, tense, and aspect.",
    url: "https://verbista.vercel.app",
    siteName: "Verbista",
    images: [{ url: "/og", width: 1200, height: 630, alt: "Verbista — Grammar in context" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Verbista — Read, understand, grow",
    description: "Grammar-in-context reading for Russian, Spanish, English, and French.",
    images: ["/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${ebGaramond.variable}`}>
      <body
        className="antialiased bg-desk"
      >
        <RisoDefs />
        <QueryClientProvider>
          <AuthQuerySync />
          <LanguageProvider>
            <ReaderSettingsProvider>
              <KeyboardShortcutsProvider>
                <AppShell>{children}</AppShell>
              </KeyboardShortcutsProvider>
            </ReaderSettingsProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
