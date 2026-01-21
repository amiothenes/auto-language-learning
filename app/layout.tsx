import type { Metadata } from "next";
import { Inter, EB_Garamond } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

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
        <Sidebar />
        
        {/* Main Content Area */}
        <main className="md:ml-60 min-h-screen pb-16 md:pb-0">
          {children}
        </main>
      </body>
    </html>
  );
}
