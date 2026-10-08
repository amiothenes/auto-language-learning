'use client';

import { Heading, Muted } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { ProgressGraph } from '@/components/dashboard/ProgressGraph';
import { VocabDistribution } from '@/components/vocabulary/VocabDistribution';
import { ReadingCoverageSummary } from '@/components/vocabulary/ReadingCoverageSummary';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { useStats } from '@/lib/hooks/useStats';
import { useStatsHistory } from '@/lib/hooks/useStatsHistory';

interface StatsCardProps {
  isLoading?: boolean;
}

function StatsCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4">
      {/* Coverage + chart card skeleton — mirrors the three stacked blocks of
          the real card (meter, distribution, chart) so nothing jumps on load */}
      <Card
        variant="default"
        padding="md"
        as="section"
        className="flex min-h-0 flex-1 flex-col gap-4"
      >
        <div className="space-y-1.5">
          <SkeletonText width="w-32" className="h-2.5" />
          <SkeletonText width="w-28" className="h-6" />
          <Skeleton className="h-2.5 w-full rounded-full" />
          <SkeletonText width="w-40" className="h-3" />
        </div>

        <div className="border-t border-border" />

        <div className="space-y-2">
          <Skeleton className="h-2.5 w-full rounded-full" />
          <div className="grid grid-cols-5 gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <SkeletonText width="w-8" className="h-3.5" />
                <SkeletonText width="w-12" className="h-2.5" />
                <SkeletonText width="w-8" className="h-2.5" />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border" />

        <Skeleton className="w-full min-h-32 flex-1 rounded" />
      </Card>

      {/* Stats Skeleton — 3-up KPI row at every breakpoint, matching the real card */}
      <Card variant="default" padding="sm" className="p-0! overflow-hidden shrink-0">
        <div className="grid grid-cols-3 divide-x divide-border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="py-4 px-2 flex flex-col items-center gap-1.5">
              <Skeleton className="h-7 w-7 rounded" />
              <SkeletonText width="w-12" className="h-4" />
              <SkeletonText width="w-14" className="h-2.5" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function StatsCard({ isLoading: isLoadingProp = false }: StatsCardProps) {
  const { data: stats, isLoading: isLoadingStats } = useStats();
  const { data: historyData } = useStatsHistory();
  const isLoading = isLoadingProp || isLoadingStats;

  if (isLoading) {
    return <StatsCardSkeleton />;
  }

  const readingCoverage = stats?.readingCoverage ?? 0;
  const cefrBand = stats?.cefrBand ?? 'A1-A2';
  const totalWords = stats?.vocabulary.total ?? 0;
  const knownWords = (stats?.vocabulary.known ?? 0) + (stats?.vocabulary.wellKnown ?? 0);
  const streak = stats?.streak ?? 0;
  const history = historyData?.history ?? [];

  // Note: this is the distribution strip's own total (the five ladder statuses),
  // not stats.vocabulary.total, which counts reviewed words only.
  const distributionTotal = stats
    ? stats.vocabulary.unknown +
      stats.vocabulary.newlySeen +
      stats.vocabulary.familiar +
      stats.vocabulary.known +
      stats.vocabulary.wellKnown
    : 0;
  const hasVocab = distributionTotal > 0;

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Reading Coverage + Chart — combined card. flex-1 lets it absorb all of
          the column's spare height so the KPI card below lands on the same
          baseline as the right column, at any viewport, without magic numbers. */}
      <Card
        variant="default"
        padding="md"
        as="section"
        className="flex min-h-0 flex-1 flex-col gap-4"
      >
        {/* Headline metric + banded CEFR meter. Identical component to the one
            on the Vocabulary page, so the two never drift apart visually. */}
        <ReadingCoverageSummary value={readingCoverage} cefrBand={cefrBand} />

        <div className="border-t border-border" />

        {/* Vocab status distribution strip. VocabDistribution renders null on a
            zero total, so a brand-new account would otherwise end up with the
            two section dividers stacked against each other. */}
        {hasVocab && stats && (
          <VocabDistribution
            compact
            unknown={stats.vocabulary.unknown}
            newlySeen={stats.vocabulary.newlySeen}
            familiar={stats.vocabulary.familiar}
            known={stats.vocabulary.known}
            wellKnown={stats.vocabulary.wellKnown}
            total={distributionTotal}
            readingCoverage={stats.readingCoverage}
            cefrBand={stats.cefrBand}
          />
        )}

        {hasVocab && <div className="border-t border-border" />}

        {/* Chart / progress bar. Labelled because it plots known-word COUNT over
            time, not the coverage percentage above it — without an eyebrow the
            two read as the same number drawn twice.
            min-h-0 is the flexbox detail that makes the fill work: a flex child
            defaults to min-height:auto, which refuses to shrink below its
            content and would push the KPI card back out of alignment. */}
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <h3 className="font-sans text-ui-xs font-semibold uppercase leading-none tracking-[0.08em] text-muted">
            Known Words Over Time
          </h3>
          <ProgressGraph currentPercentage={readingCoverage} history={history} />
        </div>
      </Card>

      {/* Stats — one 3-up KPI row at every breakpoint. This used to branch into
          three stacked icon rows on xl+, which cost ~220px of the left column and
          was what pushed the cards below the fold on a laptop. Same three numbers,
          roughly a third of the height, and no breakpoint-specific markup to
          keep in sync. */}
      <Card variant="default" padding="sm" className="p-0! overflow-hidden shrink-0">
        <div className="grid grid-cols-3 divide-x divide-border">
          {[
            { label: 'Total Words', value: totalWords.toLocaleString('en-US'), icon: <BookOpen size={16} className="text-primary" strokeWidth={1.75} /> },
            { label: 'Known Words', value: knownWords.toLocaleString('en-US'), icon: <CheckCircle2 size={16} className="text-primary" strokeWidth={1.75} /> },
            { label: 'Day Streak',  value: String(streak),                     icon: <img src="/illustrations/stones.svg" width={20} height={20} alt="" /> },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1.5 px-2 py-4 text-center">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/10">
                {stat.icon}
              </div>
              <Heading size="xl" weight="bold" as="h3" className="leading-none">
                {stat.value}
              </Heading>
              <Muted size="xs" className="leading-none">{stat.label}</Muted>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
