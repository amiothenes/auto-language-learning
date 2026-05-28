'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusChipRow } from './StatusChipRow';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import { cn } from '@/lib/utils';

// ============================================================================
// GradingSection — contextual action buttons + 6-chip status row
// Shared between WordTooltip (size="compact") and WordDetailsPanel (size="default").
//
// Button colors use the same HSLA hues as the word highlight system so the
// action buttons visually echo the reader highlighting the user already knows.
// ============================================================================

const PROGRESSION = [
  VocabularyStatus.UNKNOWN,
  VocabularyStatus.NEWLY_SEEN,
  VocabularyStatus.FAMILIAR,
  VocabularyStatus.KNOWN,
  VocabularyStatus.WELL_KNOWN,
] as const;

const STEP_LABELS: Record<VocabularyStatus, string> = {
  [VocabularyStatus.UNKNOWN]:    'Unknown',
  [VocabularyStatus.NEWLY_SEEN]: 'Newly Seen',
  [VocabularyStatus.FAMILIAR]:   'Familiar',
  [VocabularyStatus.KNOWN]:      'Known',
  [VocabularyStatus.WELL_KNOWN]: 'Well Known',
  [VocabularyStatus.IGNORE]:     'Ignore',
};

// Button color classes keyed by the TARGET status — each action button looks
// like the status it will set the word to, so the user can preview the outcome.
const STATUS_BTN: Record<VocabularyStatus, string> = {
  [VocabularyStatus.UNKNOWN]:
    'bg-[hsla(0,0%,60%,0.12)] text-ink border border-[hsla(0,0%,60%,0.35)] hover:bg-[hsla(0,0%,60%,0.22)]',
  [VocabularyStatus.NEWLY_SEEN]:
    'bg-[hsla(0,70%,55%,0.12)] text-ink border border-[hsla(0,70%,55%,0.35)] hover:bg-[hsla(0,70%,55%,0.22)]',
  [VocabularyStatus.FAMILIAR]:
    'bg-[hsla(45,85%,55%,0.12)] text-ink border border-[hsla(45,85%,55%,0.35)] hover:bg-[hsla(45,85%,55%,0.22)]',
  [VocabularyStatus.KNOWN]:
    'bg-[hsla(145,60%,40%,0.12)] text-ink border border-[hsla(145,60%,40%,0.35)] hover:bg-[hsla(145,60%,40%,0.22)]',
  [VocabularyStatus.WELL_KNOWN]:
    'bg-[hsla(145,60%,40%,0.1)] text-ink border border-[hsla(145,60%,40%,0.28)] hover:bg-[hsla(145,60%,40%,0.18)]',
  [VocabularyStatus.IGNORE]:
    'bg-[hsla(0,0%,50%,0.08)] text-muted border border-dashed border-[hsla(0,0%,50%,0.4)] hover:bg-[hsla(0,0%,50%,0.18)]',
};

interface GradingSectionProps {
  status: VocabularyStatus;
  onStatusChange: (newStatus: VocabularyStatus) => void;
  /** compact = tooltip (smaller buttons), default = panel (roomier buttons) */
  size?: 'compact' | 'default';
}

export function GradingSection({ status, onStatusChange, size = 'compact' }: GradingSectionProps) {
  return (
    <div className="space-y-2">
      <ContextualActions status={status} onStatusChange={onStatusChange} size={size} />
      <StatusChipRow currentStatus={status} onStatusChange={onStatusChange} />
    </div>
  );
}

// ─── Contextual action area — varies by current status ───────────────────────

interface ContextualActionsProps {
  status: VocabularyStatus;
  onStatusChange: (s: VocabularyStatus) => void;
  size: 'compact' | 'default';
}

function statusBtn(target: VocabularyStatus, extra: string): string {
  return cn(
    'flex-1 rounded font-sans text-ui-xs font-medium transition-all active:scale-95',
    STATUS_BTN[target],
    extra,
  );
}

function ContextualActions({ status, onStatusChange, size }: ContextualActionsProps) {
  const py = size === 'compact' ? 'py-1.5' : 'py-2';

  // IGNORE: single restore button
  if (status === VocabularyStatus.IGNORE) {
    return (
      <Button
        size="sm"
        variant="primary"
        onClick={() => onStatusChange(VocabularyStatus.UNKNOWN)}
        className="w-full"
      >
        Restore to Unknown
      </Button>
    );
  }

  // UNKNOWN: 3 fast-track shortcuts — starting point for most new words
  if (status === VocabularyStatus.UNKNOWN) {
    return (
      <div className="flex gap-1.5">
        <button
          onClick={() => onStatusChange(VocabularyStatus.NEWLY_SEEN)}
          className={statusBtn(VocabularyStatus.NEWLY_SEEN, py)}
        >
          Newly Seen
        </button>
        <button
          onClick={() => onStatusChange(VocabularyStatus.WELL_KNOWN)}
          className={statusBtn(VocabularyStatus.WELL_KNOWN, py)}
        >
          I Know This
        </button>
        <button
          onClick={() => onStatusChange(VocabularyStatus.IGNORE)}
          className={statusBtn(VocabularyStatus.IGNORE, py)}
        >
          Ignore
        </button>
      </div>
    );
  }

  // NEWLY_SEEN → WELL_KNOWN: step up / step down
  // Each button is colored by the TARGET status so the action is visually intuitive.
  const idx = PROGRESSION.indexOf(status);
  const stepDown = idx > 0 ? PROGRESSION[idx - 1] : null;
  const stepUp = idx < PROGRESSION.length - 1 ? PROGRESSION[idx + 1] : null;

  return (
    <div className="flex items-center gap-1.5">
      {stepDown && (
        <button
          onClick={() => onStatusChange(stepDown)}
          className={cn(statusBtn(stepDown, py), 'flex items-center justify-center gap-1')}
        >
          <ChevronDown size={11} strokeWidth={2.5} />
          {STEP_LABELS[stepDown]}
        </button>
      )}
      {stepUp && (
        <button
          onClick={() => onStatusChange(stepUp)}
          className={cn(statusBtn(stepUp, py), 'flex items-center justify-center gap-1')}
        >
          <ChevronUp size={11} strokeWidth={2.5} />
          {STEP_LABELS[stepUp]}
        </button>
      )}
    </div>
  );
}
