'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings, ArrowRight } from 'lucide-react';
import { Heading, Muted } from '@/components/ui/Typography';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useStats } from '@/lib/hooks/useStats';
import { useHints } from '@/lib/hooks/useHints';
import { useSeriesList } from '@/lib/hooks/useSeriesList';
import { RecentTextsList } from '@/components/dashboard/RecentTextsList';
import { FluencyHero } from '@/components/today/FluencyHero';
import { NextStepCard } from '@/components/today/NextStepCard';
import { NewTextModal } from '@/components/texts/NewTextModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { pickNextStep } from '@/lib/onboarding/nextStep';
import type { TodayResponse } from '@/app/api/today/route';
import type { ImportTextResponse } from '@/lib/types/api';

// ─── Today ──────────────────────────────────────────────────────────────────
// The home screen: the Fluency number (the north star), ONE next step, and
// what you were reading. Charts, streak history and sharing live on /progress.
//   phone:   Fluency → next step → continue reading (one column)
//   tablet:  Fluency (number + map side by side), then next step | reading
//   desktop: wide Fluency hero with the map, then next step | reading

export default function TodayPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentLanguage, selectedLanguage, isLoading } = useLanguage();
  const { data: stats } = useStats();
  const { ready: hintsReady, hasSeen, markSeen } = useHints();
  const { data: seriesList } = useSeriesList();
  const [importOpen, setImportOpen] = useState(false);

  const today = useQuery({
    queryKey: ['today', selectedLanguage],
    queryFn: async () => {
      const res = await fetch(`/api/today?languageCode=${encodeURIComponent(selectedLanguage)}`);
      if (!res.ok) throw new Error('Failed to load today');
      return (await res.json()) as TodayResponse;
    },
    enabled: !!selectedLanguage,
    staleTime: 30_000,
  });

  if (isLoading) return <div className="min-h-screen" />;

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

  const step =
    today.data && hintsReady
      ? pickNextStep({
          guidedDone: hasSeen('guided-read'),
          dueCount: today.data.dueCount,
          continueText: today.data.continueText,
          story: today.data.story,
          libraryNext: today.data.libraryNext,
          prefersOwnTexts: today.data.prefersOwnTexts,
          hasReadOwnTexts: today.data.hasReadOwnTexts,
        })
      : null;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        <header className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <Heading size="2xl" as="h1">
              Today
            </Heading>
            <Muted>
              {currentLanguage.name}
              {today.data?.story ? ` · ${today.data.story.name}` : ''}
            </Muted>
          </div>
          {/* Progress and the Field Guide are desktop sidebar items; on phones
              these links are how you reach them. */}
          <div className="shrink-0 flex items-center gap-4">
            <Link href="/guide" className="inline-flex items-center gap-1 font-sans text-ui-sm text-muted hover:text-ink hover:underline">
              Guide
            </Link>
            <Link href="/progress" className="inline-flex items-center gap-1 font-sans text-ui-sm text-primary hover:underline">
              Your progress <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </div>
        </header>

        {stats ? (
          <FluencyHero
            fluency={stats.readingCoverage}
            band={stats.cefrBand}
            languageName={currentLanguage.name}
            streak={stats.streak}
          />
        ) : (
          <Skeleton className="h-56 w-full rounded-card" />
        )}

        <div className="grid gap-6 md:grid-cols-2 md:items-start">
          {step ? (
            <NextStepCard
              step={step}
              onImport={() => setImportOpen(true)}
              onSecondary={(action) => action === 'skip-guided' && markSeen('guided-read')}
            />
          ) : (
            <Skeleton className="h-48 w-full rounded-card" />
          )}
          <RecentTextsList />
        </div>
      </div>

      <NewTextModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        availableSeries={seriesList ?? []}
        onAdd={(result: ImportTextResponse) => {
          queryClient.invalidateQueries({ queryKey: ['texts'] });
          queryClient.invalidateQueries({ queryKey: ['series-list'] });
          queryClient.invalidateQueries({ queryKey: ['today'] });
          router.push(`/reader/${result.texts[0].id}`);
        }}
      />
    </div>
  );
}
