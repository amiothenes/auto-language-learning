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
  title: "Verbista",
  description: "Read texts, track vocabulary, and grow your language one word at a time.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDemo = !process.env.NEXT_PUBLIC_ADMIN_API_KEY;

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
                      {isDemo && (
                        <div className="border-b border-border bg-paper px-4 py-2 text-center">
                          <p className="font-sans text-ui-sm text-muted">
                            Demo mode - this is a read-only preview. Clone the repo to use the full app.
                          </p>
                        </div>
                      )}
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
