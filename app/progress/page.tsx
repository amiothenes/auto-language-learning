'use client';

import { Heading, Muted } from '@/components/ui/Typography';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ShareProgressButton } from '@/components/dashboard/ShareProgressButton';
import { ForecastChart } from '@/components/review/ForecastChart';
import { ActivityChart } from '@/components/review/ActivityChart';
import { useSrsForecast } from '@/lib/hooks/useSrsForecast';
import { useSrsActivity } from '@/lib/hooks/useSrsActivity';
import { Skeleton } from '@/components/ui/Skeleton';
import { FieldNote } from '@/components/teach/FieldNote';

// ─── Progress ───────────────────────────────────────────────────────────────
// The detail behind Today's Fluency number: vocabulary breakdown and Fluency
// history (StatsCard), plus the review forecast and activity. Moved off the
// home screen so Today stays a single clear next step.

export default function ProgressPage() {
  const { currentLanguage, isLoading } = useLanguage();
  const { data: forecast } = useSrsForecast(currentLanguage?.id);
  const { data: activity } = useSrsActivity(currentLanguage?.id);

  if (isLoading || !currentLanguage) return <div className="min-h-screen" />;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Heading size="2xl" as="h1">
              Your progress
            </Heading>
            <Muted>{currentLanguage.name}: how your Fluency is growing, and what Review has coming up</Muted>
          </div>
          <div className="pt-1 shrink-0">
            <ShareProgressButton languageCode={currentLanguage.code} />
          </div>
        </header>

        <FieldNote hint="note-progress" title="How Fluency is measured" illustration="mountain" guideAnchor="fluency">
          Fluency is the share of everyday text you can read, weighted by how common each word you know is. Common words count most, so your first thousand words lift it fastest.
        </FieldNote>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] xl:items-stretch">
          <StatsCard />
          <div className="space-y-6">
            <section className="bg-paper border border-border rounded-card shadow-raised p-5 md:p-6">
              <h2 className="font-sans text-ui-base font-semibold text-ink mb-1">Coming up in Review</h2>
              <p className="font-sans text-ui-sm text-muted mb-4">Words scheduled to come back, day by day.</p>
              {forecast ? <ForecastChart buckets={forecast} /> : <Skeleton className="h-40 w-full" />}
            </section>
            <section className="bg-paper border border-border rounded-card shadow-raised p-5 md:p-6">
              <h2 className="font-sans text-ui-base font-semibold text-ink mb-1">Recent review activity</h2>
              <p className="font-sans text-ui-sm text-muted mb-4">Reviews and new cards over the last weeks.</p>
              {activity ? <ActivityChart buckets={activity} /> : <Skeleton className="h-40 w-full" />}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
