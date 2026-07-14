import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { LanguageProvider } from "@/lib/contexts/LanguageContext";
import { QueryClientProvider } from "@/lib/contexts/QueryClientProvider";
import { ReaderSettingsProvider } from "@/lib/contexts/ReaderSettingsContext";
import { KeyboardShortcutsProvider } from "@/components/KeyboardShortcutsProvider";
import { AuthQuerySync } from "@/components/AuthQuerySync";

export const metadata: Metadata = {
  title: "Verbista",
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
    <html lang="en">
      <body
        className="antialiased bg-desk"
      >
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
