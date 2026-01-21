'use client';

import { useState } from 'react';
import { Heading, Muted } from '@/components/ui/Typography';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentTextsList } from '@/components/dashboard/RecentTextsList';
import { ActionButtons } from '@/components/dashboard/ActionButtons';

export default function Dashboard() {
  const { currentLanguage } = useLanguage();
  // Set to true during data fetching, false when data is loaded
  const [isLoading] = useState(false);

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
        <div className="flex flex-col lg:grid lg:grid-cols-[35%_65%] gap-6">
          {/* LEFT COLUMN: Chart + Stats - Order 3 on mobile, 1 on desktop */}
          <div className="space-y-6 order-3 lg:order-1">
            <StatsCard isLoading={isLoading} />
          </div>

          {/* RIGHT COLUMN: Recent Texts - Order 1 on mobile, 2 on desktop */}
          <div className="space-y-6 order-1 lg:order-2">
            <RecentTextsList isLoading={isLoading} />
            <ActionButtons className="order-2 lg:order-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
