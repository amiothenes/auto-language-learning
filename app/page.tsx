'use client';

import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';
import { Heading, Muted } from '@/components/ui/Typography';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentTextsList } from '@/components/dashboard/RecentTextsList';
import { ActionButtons } from '@/components/dashboard/ActionButtons';
import { EmptyState } from '@/components/ui/EmptyState';

export default function Dashboard() {
  const router = useRouter();
  const { currentLanguage } = useLanguage();

  if (!currentLanguage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <EmptyState
          illustration="compass"
          title="Choose your first language"
          description="Head to Settings to add a language and start tracking your vocabulary."
          primaryAction={{
            label: 'Open Settings',
            onClick: () => router.push('/settings/languages'),
            icon: <Settings size={18} strokeWidth={2} />,
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Page Header */}
        <header className="space-y-2">
          <Heading size="2xl" as="h1">
            {currentLanguage?.name || 'Dashboard'}
          </Heading>
          <Muted>
            Track your language learning progress and recent activity
          </Muted>
        </header>

        {/* Two Column Layout: Left (Chart + Stats) | Right (Recent Texts) */}
        <div className="flex flex-col xl:grid xl:grid-cols-[35%_1fr] gap-6">
          {/* LEFT COLUMN: Chart + Stats — first on mobile, left on desktop */}
          <div className="space-y-6">
            <StatsCard />
          </div>

          {/* RIGHT COLUMN: Recent Texts — second on mobile, right on desktop */}
          <div className="space-y-6">
            <RecentTextsList />
            <div className="hidden xl:block">
              <ActionButtons />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
