'use client';

import { Heading, Body, Muted } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { ProgressGraph } from '@/components/dashboard/ProgressGraph';
import { Target, BookOpen, CheckCircle2, BookMarked } from 'lucide-react';
import { Skeleton, SkeletonText, SkeletonCircle } from '@/components/ui/Skeleton';

interface StatsCardProps {
  isLoading?: boolean;
}

function StatsCardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Progress Chart Skeleton */}
      <Card variant="default" padding="md" as="section" className="space-y-4">
        <div>
          <SkeletonText width="w-24" className="mb-1 h-4" />
          <SkeletonText width="w-40" className="h-3" />
        </div>
        <Skeleton className="w-full h-[200px] rounded" />
      </Card>

      {/* Stats Skeleton */}
      <Card variant="default" padding="sm" className="divide-y divide-border">
        {[1, 2, 3, 4].map((i) => (
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

export function StatsCard({ isLoading = false }: StatsCardProps) {
  if (isLoading) {
    return <StatsCardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Progress Chart */}
      <Card variant="default" padding="md" as="section" className="space-y-4">
        <div>
          <Heading size="lg" as="h2" className="mb-1">
            Progress
          </Heading>
          <Muted size="xs">
            Your vocabulary growth over time
          </Muted>
        </div>
        <ProgressGraph />
      </Card>

      {/* Stats Cards - Refined & Elegant */}
      <Card variant="default" padding="sm" className="divide-y divide-border">
        {/* Fluency % */}
        <div className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Target size={20} className="text-primary" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <Muted size="xs" className="mb-0.5">
              Fluency %
            </Muted>
            <div className="flex items-baseline gap-2">
              <Heading size="xl" weight="bold" as="h3">
                66.7%
              </Heading>
            </div>
          </div>
        </div>

        {/* Total Words */}
        <div className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <BookOpen size={20} className="text-primary" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <Muted size="xs" className="mb-0.5">
              Total Words
            </Muted>
            <div className="flex items-baseline gap-2">
              <Heading size="xl" weight="bold" as="h3">
                1,234
              </Heading>
              <Body size="xs" className="text-primary">
                +47
              </Body>
            </div>
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
                823
              </Heading>
              <Body size="xs" className="text-primary">
                66.7%
              </Body>
            </div>
          </div>
        </div>

        {/* Texts Read */}
        <div className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <BookMarked size={20} className="text-primary" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <Muted size="xs" className="mb-0.5">
              Texts Read
            </Muted>
            <div className="flex items-baseline gap-2">
              <Heading size="xl" weight="bold" as="h3">
                24
              </Heading>
              <Body size="xs" className="text-primary">
                +3
              </Body>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
