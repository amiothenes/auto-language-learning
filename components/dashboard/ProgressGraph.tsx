'use client';

import { Heading, Muted } from '@/components/ui/Typography';

interface ProgressGraphProps {
  currentPercentage: number;
}

export function ProgressGraph({ currentPercentage }: ProgressGraphProps) {
  const clamped = Math.min(100, Math.max(0, currentPercentage));

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-2">
        <Heading size="2xl" weight="bold" as="p">
          {clamped.toFixed(1)}%
        </Heading>
        <Muted size="xs" className="mb-1">
          vocabulary known
        </Muted>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>

      <Muted size="xs">
        Progress history will appear here as you read more texts.
      </Muted>
    </div>
  );
}
