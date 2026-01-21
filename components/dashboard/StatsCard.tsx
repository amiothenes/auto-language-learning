'use client';

import { Heading, Body, Muted } from '@/components/ui/Typography';
import { ProgressGraph } from '@/components/dashboard/ProgressGraph';

export function StatsCard() {
  return (
    <div className="space-y-6">
      {/* Progress Chart */}
      <section className="bg-paper rounded-card border border-border shadow-raised p-6 space-y-4">
        <div>
          <Heading size="lg" as="h2" className="mb-1">
            Progress
          </Heading>
          <Muted size="xs">
            Your vocabulary growth over time
          </Muted>
        </div>
        <ProgressGraph />
      </section>

      {/* Stats Cards - Refined & Elegant */}
      <div className="bg-paper rounded-card border border-border shadow-raised divide-y divide-border">
        {/* Fluency % */}
        <div className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-lg">🎯</span>
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
            <span className="text-lg">📖</span>
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
            <span className="text-lg">✓</span>
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
            <span className="text-lg">📚</span>
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
      </div>
    </div>
  );
}
