'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SettingsHeaderDecoration } from '@/components/ui/SettingsHeaderDecoration';
import { SettingsSearch } from '@/components/settings/SettingsSearch';

const tabs = [
  { id: 'display', label: 'Display', href: '/settings/display' },
  { id: 'languages', label: 'Languages', href: '/settings/languages' },
  { id: 'data', label: 'Data', href: '/settings/data' },
  { id: 'about', label: 'About', href: '/settings/about' },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-12">
      <div className="max-w-5xl mx-auto space-y-6">
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

        {/* Search */}
        <SettingsSearch />

        {/* Tab Navigation */}
        <nav className="sticky top-0 z-10 bg-desk/80 backdrop-blur-sm border-b border-border overflow-x-auto scrollbar-hide -mx-4 px-4 md:-mx-8 md:px-8">
          <div className="flex gap-1 min-w-max pb-px">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={cn(
                    'px-3 py-3 md:px-4 font-sans text-ui-sm md:text-ui-base font-medium transition-colors border-b-2 whitespace-nowrap',
                    isActive
                      ? 'text-primary border-primary'
                      : 'text-muted border-transparent hover:text-ink hover:border-border'
                  )}
                >
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
