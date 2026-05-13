import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { LanguageProvider } from "@/lib/contexts/LanguageContext";
import { QueryClientProvider } from "@/lib/contexts/QueryClientProvider";
import { ReaderSettingsProvider } from "@/lib/contexts/ReaderSettingsContext";
import { SkipLink } from "@/components/ui/SkipLink";
import { KeyboardShortcutsProvider } from "@/components/KeyboardShortcutsProvider";
import { ViewTransitionWrapper } from "@/components/ViewTransitionWrapper";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

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
        className="antialiased bg-desk"
      >
        <LanguageProvider>
          <QueryClientProvider>
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
          </QueryClientProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
