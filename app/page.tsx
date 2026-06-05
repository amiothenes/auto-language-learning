'use client';

import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';
import { Heading, Muted } from '@/components/ui/Typography';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentTextsList } from '@/components/dashboard/RecentTextsList';
import { ActionButtons } from '@/components/dashboard/ActionButtons';
import { EmptyState } from '@/components/ui/EmptyState';

const isDemo = !process.env.NEXT_PUBLIC_ADMIN_API_KEY;

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
      <div className="max-w-7xl mx-auto space-y-8">
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
        <div className="flex flex-col lg:grid lg:grid-cols-[35%_1fr] gap-6">
          {/* LEFT COLUMN: Chart + Stats - Order 3 on mobile, 1 on desktop */}
          <div className="space-y-6 order-3 lg:order-1">
            <StatsCard />
          </div>

          {/* RIGHT COLUMN: Recent Texts - Order 1 on mobile, 2 on desktop */}
          <div className="space-y-6 order-1 lg:order-2">
            <RecentTextsList isDemo={isDemo} />
            <ActionButtons className="order-2 lg:order-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
