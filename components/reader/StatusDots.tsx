'use client';

import { cn } from '@/lib/utils';
import { VocabularyStatus } from './Word';

// Maps each status to its filled-dot Tailwind color class
const STATUS_DOT_COLOR: Record<VocabularyStatus, string> = {
  [VocabularyStatus.UNKNOWN]:    'bg-gray-400',
  [VocabularyStatus.NEWLY_SEEN]: 'bg-red-500',
  [VocabularyStatus.FAMILIAR]:   'bg-orange-400',
  [VocabularyStatus.KNOWN]:      'bg-green-500',
  [VocabularyStatus.WELL_KNOWN]: 'bg-green-500',
  [VocabularyStatus.IGNORE]:     'bg-gray-400',
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

        return (
          <span
            key={i}
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              isFilled ? filledColor : 'bg-border'
            )}
          />
        );
      })}
    </div>
  );
}
