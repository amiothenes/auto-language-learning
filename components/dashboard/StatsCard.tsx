'use client';

import Link from 'next/link';
import { Heading, Body, Muted } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { ProgressGraph } from '@/components/dashboard/ProgressGraph';
import { VocabDistribution } from '@/components/vocabulary/VocabDistribution';
import { BookOpen, CheckCircle2, Flame, Info } from 'lucide-react';
import { Skeleton, SkeletonText, SkeletonCircle } from '@/components/ui/Skeleton';
import { useStats } from '@/lib/hooks/useStats';
import { useStatsHistory } from '@/lib/hooks/useStatsHistory';

interface StatsCardProps {
  isLoading?: boolean;
}

function StatsCardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Chart Card Skeleton */}
      <Card variant="default" padding="md" as="section" className="space-y-4">
        <div className="space-y-1">
          <SkeletonText width="w-36" className="h-4" />
          <SkeletonText width="w-24" className="h-7" />
          <SkeletonText width="w-32" className="h-3" />
        </div>
        <Skeleton className="w-full h-50 rounded" />
      </Card>

      {/* Stats Skeleton — 3 rows */}
      <Card variant="default" padding="sm" className="divide-y divide-border">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <SkeletonCircle size={40} />
            <div className="flex-1 min-w-0 space-y-2">
              <SkeletonText width="w-20" className="h-3" />
              <div className="flex items-baseline gap-2">
                <SkeletonText width="w-16" className="h-5" />
                <SkeletonText width="w-10" className="h-3" />
              </div>
            </div>
          </div>
        ))}
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

  return (
    <div className="space-y-6">
      {/* Reading Coverage + Chart — combined card */}
      <Card variant="default" padding="md" as="section" className="space-y-4">
        {/* Metric header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Heading size="lg" as="h2">Reading Coverage</Heading>
              <Link
                href="/coverage-info"
                title="How is this calculated?"
                className="text-muted hover:text-primary transition-colors mt-0.5"
              >
                <Info size={14} strokeWidth={1.5} />
              </Link>
            </div>
            <div className="flex items-baseline gap-2">
              <Heading size="2xl" weight="bold" as="h2">
                {readingCoverage.toFixed(1)}%
              </Heading>
              <Body size="sm" className="text-muted font-medium">
                {cefrBand}
              </Body>
            </div>
            <Muted size="xs">
              95% = comfortable reading · 98% = fluent
            </Muted>
          </div>
        </div>

        {/* Vocab status distribution strip */}
        {stats && (
          <VocabDistribution
            compact
            unknown={stats.vocabulary.unknown}
            newlySeen={stats.vocabulary.newlySeen}
            familiar={stats.vocabulary.familiar}
            known={stats.vocabulary.known}
            wellKnown={stats.vocabulary.wellKnown}
            total={
              stats.vocabulary.unknown +
              stats.vocabulary.newlySeen +
              stats.vocabulary.familiar +
              stats.vocabulary.known +
              stats.vocabulary.wellKnown
            }
          />
        )}

        {/* Chart / progress bar */}
        <ProgressGraph currentPercentage={readingCoverage} history={history} />
      </Card>

      {/* Stats — 3 rows (Reading Coverage moved to chart card above) */}
      <Card variant="default" padding="sm" className="divide-y divide-border">
        {/* Total Words */}
        <div className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <BookOpen size={20} className="text-primary" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <Muted size="xs" className="mb-0.5">
              Total Words
            </Muted>
            <Heading size="xl" weight="bold" as="h3">
              {totalWords.toLocaleString()}
            </Heading>
          </div>
        </div>

        {/* Known Words */}
        <div className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} className="text-primary" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <Muted size="xs" className="mb-0.5">
              Known Words
            </Muted>
            <div className="flex items-baseline gap-2">
              <Heading size="xl" weight="bold" as="h3">
                {knownWords.toLocaleString()}
              </Heading>
              {totalWords > 0 && (
                <Body size="xs" className="text-primary">
                  of {totalWords.toLocaleString()} reviewed
                </Body>
              )}
            </div>
          </div>
        </div>

        {/* Day Streak */}
        <div className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Flame size={20} className="text-primary" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <Muted size="xs" className="mb-0.5">
              Day Streak
            </Muted>
            <div className="flex items-baseline gap-1.5">
              <Heading size="xl" weight="bold" as="h3">
                {streak}
              </Heading>
              <Body size="xs" className="text-muted">
                {streak === 1 ? 'day' : 'days'}
              </Body>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
