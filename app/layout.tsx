import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { LanguageProvider } from "@/lib/contexts/LanguageContext";
import { QueryClientProvider } from "@/lib/contexts/QueryClientProvider";
import { ReaderSettingsProvider } from "@/lib/contexts/ReaderSettingsContext";
import { KeyboardShortcutsProvider } from "@/components/KeyboardShortcutsProvider";

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
  return (
    <html lang="en">
      <body
        className="antialiased bg-desk"
      >
        <QueryClientProvider>
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
