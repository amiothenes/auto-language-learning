'use client';

// ============================================================================
// Settings Layout
// Shared layout with tab navigation for all settings pages
// ============================================================================

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Type, Globe, Database, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsHeaderDecoration } from '@/components/ui/SettingsHeaderDecoration';

const tabs = [
  { id: 'display', label: 'Display', icon: Type, href: '/settings/display' },
  { id: 'languages', label: 'Languages', icon: Globe, href: '/settings/languages' },
  { id: 'data', label: 'Data', icon: Database, href: '/settings/data' },
  { id: 'about', label: 'About', icon: Info, href: '/settings/about' },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="relative">
          <div className="absolute top-0 right-0 opacity-100 pointer-events-none">
            <SettingsHeaderDecoration />
          </div>
          <h1 className="font-sans text-ui-2xl font-semibold text-ink mb-2">
            Settings
          </h1>
          <p className="font-sans text-ui-base text-muted">
            Manage your preferences and application settings
          </p>
        </header>

        {/* Tab Navigation */}
        <nav className="border-b border-border overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 min-w-max pb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;

              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-3 md:px-4 md:gap-2 font-sans text-ui-sm md:text-ui-base font-medium transition-colors border-b-2 whitespace-nowrap',
                    isActive
                      ? 'text-primary border-primary'
                      : 'text-muted border-transparent hover:text-ink hover:border-border'
                  )}
                >
                  <Icon className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2} />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Tab Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}
