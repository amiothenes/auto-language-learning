'use client';

import { cn } from '@/lib/utils';
import { VocabularyStatus } from '@/lib/types/vocabulary';

// ============================================================================
// StatusChipRow
// 6 compact chips — colors derived from the word highlight HSLA system so the
// chip tints visually match the highlighted words in the reader text.
// ============================================================================

interface StatusChipRowProps {
  currentStatus: VocabularyStatus;
  onStatusChange: (status: VocabularyStatus) => void;
  className?: string;
}

interface ChipDef {
  status: VocabularyStatus;
  label: string;
  base: string;
  active: string;
}

// Each chip's Tailwind classes use Tailwind v4 arbitrary HSLA values that mirror
// the word highlight hues from Word.tsx (getStatusColor). Active state uses
// higher opacity + thicker status-colored border.
const CHIPS: ChipDef[] = [
  {
    status: VocabularyStatus.UNKNOWN,
    label: '?',
    base:   'bg-[hsla(0,0%,60%,0.1)]  text-muted border   border-[hsla(0,0%,60%,0.25)]',
    active: 'bg-[hsla(0,0%,60%,0.22)] text-ink   border-2 border-[hsla(0,0%,50%,0.6)] font-semibold shadow-raised',
  },
  {
    status: VocabularyStatus.NEWLY_SEEN,
    label: 'NS',
    base:   'bg-[hsla(0,70%,55%,0.1)]  text-muted border   border-[hsla(0,70%,55%,0.3)]',
    active: 'bg-[hsla(0,70%,55%,0.22)] text-ink   border-2 border-[hsla(0,70%,45%,0.7)] font-semibold shadow-raised',
  },
  {
    status: VocabularyStatus.FAMILIAR,
    label: 'Fam',
    base:   'bg-[hsla(45,85%,55%,0.1)]  text-muted border   border-[hsla(45,85%,55%,0.3)]',
    active: 'bg-[hsla(45,85%,55%,0.22)] text-ink   border-2 border-[hsla(45,85%,45%,0.7)] font-semibold shadow-raised',
  },
  {
    status: VocabularyStatus.KNOWN,
    label: 'Kno',
    base:   'bg-[hsla(145,60%,40%,0.1)]  text-muted border   border-[hsla(145,60%,40%,0.3)]',
    active: 'bg-[hsla(145,60%,40%,0.22)] text-ink   border-2 border-[hsla(145,60%,35%,0.7)] font-semibold shadow-raised',
  },
  {
    status: VocabularyStatus.WELL_KNOWN,
    label: 'WKn',
    base:   'bg-[hsla(145,60%,40%,0.07)] text-muted border   border-[hsla(145,60%,40%,0.2)]',
    active: 'bg-[hsla(145,60%,40%,0.16)] text-ink   border-2 border-[hsla(145,60%,35%,0.6)] font-semibold shadow-raised',
  },
  {
    status: VocabularyStatus.IGNORE,
    label: 'Ign',
    base:   'bg-[hsla(0,0%,50%,0.08)] text-muted border border-dashed border-[hsla(0,0%,50%,0.4)]',
    active: 'bg-[hsla(0,0%,50%,0.18)] text-ink   border-2 border-dashed border-[hsla(0,0%,40%,0.65)] font-semibold shadow-raised',
  },
];

export function StatusChipRow({ currentStatus, onStatusChange, className }: StatusChipRowProps) {
  return (
    <div className={cn('flex gap-1', className)}>
      {CHIPS.map(({ status, label, base, active }) => {
        const isActive = currentStatus === status;
        return (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            className={cn(
              'flex-1 min-w-0 py-1 rounded text-center font-sans text-[10px] leading-none',
              'transition-all hover:brightness-95 active:scale-95',
              isActive ? active : base,
            )}
            title={status.replace(/_/g, ' ')}
            aria-pressed={isActive}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
