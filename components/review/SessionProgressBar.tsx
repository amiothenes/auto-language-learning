import { cn } from '@/lib/utils';
import type { SrsCard } from '@/lib/types/api';

interface SessionProgressBarProps {
  /** Original session order, never shrinks — drives the segment sequence/colors. */
  cards: SrsCard[];
  /** How many of `cards` (from the front) have been completed. */
  completedCount: number;
}

// Due-review segments use the primary brand color; new-card segments reuse
// the blue already assigned to VocabularyStatus.UNKNOWN in the palette
// (app/globals.css) rather than introducing a new color token.
export function SessionProgressBar({ cards, completedCount }: SessionProgressBarProps) {
  if (cards.length === 0) return null;

  return (
    <div className="flex gap-0.5 h-1.5 w-full rounded-full overflow-hidden bg-border" role="progressbar" aria-valuenow={completedCount} aria-valuemin={0} aria-valuemax={cards.length}>
      {cards.map((card, i) => (
        <div
          key={card.wordId}
          className={cn('flex-1 h-full transition-colors', i >= completedCount && 'opacity-25')}
          style={{ background: card.isNew ? 'hsl(var(--color-status-unknown))' : 'var(--color-primary)' }}
        />
      ))}
    </div>
  );
}
