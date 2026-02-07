import type { Metadata } from "next";
import { Inter, EB_Garamond } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { LanguageProvider } from "@/lib/contexts/LanguageContext";
import { ReaderSettingsProvider } from "@/lib/contexts/ReaderSettingsContext";
import { SkipLink } from "@/components/ui/SkipLink";
import { KeyboardShortcutsProvider } from "@/components/KeyboardShortcutsProvider";
import { ViewTransitionWrapper } from "@/components/ViewTransitionWrapper";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Auto Language Learning",
  description: "A sophisticated language-learning desktop application for tracking vocabulary growth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${ebGaramond.variable} antialiased bg-desk`}
      >
        <LanguageProvider>
          <ReaderSettingsProvider>
            <KeyboardShortcutsProvider>
              <SkipLink targetId="main-content" />
              <Sidebar />

              {/* Main Content Area - adjusted for collapsed sidebar (64px) */}
              <ViewTransitionWrapper>
                <ErrorBoundary>
                  <main id="main-content" tabIndex={-1} className="md:ml-16 min-h-screen pb-16 md:pb-0">
                    {children}
                  </main>
                </ErrorBoundary>
              </ViewTransitionWrapper>
            </KeyboardShortcutsProvider>
          </ReaderSettingsProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
