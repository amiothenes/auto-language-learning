'use client';

import { cn } from '@/lib/utils';
import { VocabularyStatus } from './Word';

// Maps each status to its filled-dot HSL color string
const STATUS_DOT_COLOR: Record<VocabularyStatus, string> = {
  [VocabularyStatus.UNKNOWN]:    'hsl(205, 80%, 58%)',
  [VocabularyStatus.NEWLY_SEEN]: 'hsl(2, 75%, 60%)',
  [VocabularyStatus.FAMILIAR]:   'hsl(32, 90%, 56%)',
  [VocabularyStatus.KNOWN]:      'hsl(78, 60%, 48%)',
  [VocabularyStatus.WELL_KNOWN]: 'hsl(150, 40%, 42%)',
  [VocabularyStatus.IGNORE]:     'hsl(0, 0%, 50%)',
};

// How many dots are filled for each status (IGNORE is handled separately)
const STATUS_LEVEL: Record<VocabularyStatus, number> = {
  [VocabularyStatus.UNKNOWN]:    0,
  [VocabularyStatus.NEWLY_SEEN]: 1,
  [VocabularyStatus.FAMILIAR]:   2,
  [VocabularyStatus.KNOWN]:      3,
  [VocabularyStatus.WELL_KNOWN]: 4,
  [VocabularyStatus.IGNORE]:     0,
};

const TOTAL_DOTS = 4;

interface StatusDotsProps {
  status: VocabularyStatus;
  className?: string;
}

export function StatusDots({ status, className }: StatusDotsProps) {
  const level = STATUS_LEVEL[status];
  const filledColor = STATUS_DOT_COLOR[status];

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: TOTAL_DOTS }, (_, i) => {
        const dotIndex = i + 1;
        const isFilled = status !== VocabularyStatus.IGNORE && dotIndex <= level;

        if (status === VocabularyStatus.IGNORE) {
          return (
            <span
              key={i}
              className="w-2 h-2 rounded-full border border-dashed border-muted"
            />
          );
        }

        // WELL_KNOWN has no reader highlight — render all 4 as hollow outlined circles
        if (status === VocabularyStatus.WELL_KNOWN) {
          return (
            <span
              key={i}
              className="w-2 h-2 rounded-full shrink-0 border border-ink/70"
            />
          );
        }

        return (
          <span
            key={i}
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              !isFilled && 'bg-border'
            )}
            style={isFilled ? { background: filledColor } : undefined}
          />
        );
      })}
    </div>
  );
}
