'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';
import { VocabularyStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

// ============================================================================
// AdaptiveStepper — Grading control (Option A · definitive spec)
//
// Three surface states driven by current word status:
//   UNKNOWN    → two direct jumps: "Just learned · NS" (primary) + "I know it well · WKn"
//   Mid-tier   → ±1 nudge: "↓ Didn't" + 4-dot status ladder + "Knew it ↑" (primary)
//   IGNORE     → single "Restore to Unknown" primary
//   WELL_KNOWN → ±1 nudge (only down available)
//
// The ··· button always triggers onMoreClick → opens MoreMenu for full control.
// Replaces GradingSection inside WordTooltip.
// ============================================================================

interface AdaptiveStepperProps {
  status: VocabularyStatus;
  onStatusChange: (newStatus: VocabularyStatus) => void;
  onMoreClick: (anchorEl: HTMLButtonElement) => void;
}

const PROGRESSION = [
  VocabularyStatus.UNKNOWN,
  VocabularyStatus.NEWLY_SEEN,
  VocabularyStatus.FAMILIAR,
  VocabularyStatus.KNOWN,
  VocabularyStatus.WELL_KNOWN,
] as const;

const STATUS_LEVEL: Record<VocabularyStatus, number> = {
  [VocabularyStatus.UNKNOWN]:    0,
  [VocabularyStatus.NEWLY_SEEN]: 1,
  [VocabularyStatus.FAMILIAR]:   2,
  [VocabularyStatus.KNOWN]:      3,
  [VocabularyStatus.WELL_KNOWN]: 4,
  [VocabularyStatus.IGNORE]:     0,
};

const STATUS_DOT_COLOR: Record<VocabularyStatus, string> = {
  [VocabularyStatus.UNKNOWN]:    'bg-gray-300',
  [VocabularyStatus.NEWLY_SEEN]: 'bg-[hsl(2,72%,58%)]',
  [VocabularyStatus.FAMILIAR]:   'bg-[hsl(32,88%,54%)]',
  [VocabularyStatus.KNOWN]:      'bg-[hsl(78,58%,46%)]',
  [VocabularyStatus.WELL_KNOWN]: 'bg-[hsl(145,45%,40%)]',
  [VocabularyStatus.IGNORE]:     'bg-gray-300',
};

const STATUS_LABEL: Record<VocabularyStatus, string> = {
  [VocabularyStatus.UNKNOWN]:    'Unknown',
  [VocabularyStatus.NEWLY_SEEN]: 'Newly Seen',
  [VocabularyStatus.FAMILIAR]:   'Familiar',
  [VocabularyStatus.KNOWN]:      'Known',
  [VocabularyStatus.WELL_KNOWN]: 'Well-Known',
  [VocabularyStatus.IGNORE]:     'Ignored',
};

// Shared base for all action buttons
const BTN_BASE =
  'flex items-center justify-center gap-1.5 h-[34px] px-3 rounded font-sans text-ui-xs font-medium transition-all active:scale-95 whitespace-nowrap select-none';

const BTN_PRIMARY = cn(BTN_BASE, 'bg-primary text-white border border-primary shadow-raised hover:opacity-90');
const BTN_SECONDARY = cn(BTN_BASE, 'border border-border-strong bg-paper hover:bg-desk text-ink');
const BTN_MORE = cn(BTN_BASE, 'w-[34px] px-0 border border-border-strong bg-paper hover:bg-desk text-muted hover:text-ink');

export function AdaptiveStepper({ status, onStatusChange, onMoreClick }: AdaptiveStepperProps) {
  const level      = STATUS_LEVEL[status];
  const dotColor   = STATUS_DOT_COLOR[status];
  const label      = STATUS_LABEL[status];

  const idx     = PROGRESSION.indexOf(status as typeof PROGRESSION[number]);
  const stepDown = idx > 0  ? PROGRESSION[idx - 1] : undefined;
  const stepUp   = idx >= 0 && idx < PROGRESSION.length - 1 ? PROGRESSION[idx + 1] : undefined;

  const MoreBtn = () => (
    <button
      aria-label="More grading options"
      className={BTN_MORE}
      onClick={(e) => onMoreClick(e.currentTarget)}
    >
      <span className="text-sm tracking-widest leading-none">···</span>
    </button>
  );

  // ── IGNORE ────────────────────────────────────────────────────────────────
  if (status === VocabularyStatus.IGNORE) {
    return (
      <div className="flex gap-1.5">
        <button
          className={cn(BTN_PRIMARY, 'flex-1')}
          onClick={() => onStatusChange(VocabularyStatus.UNKNOWN)}
        >
          Restore to Unknown
        </button>
        <MoreBtn />
      </div>
    );
  }

  // ── UNKNOWN — two direct jumps ────────────────────────────────────────────
  if (status === VocabularyStatus.UNKNOWN) {
    return (
      <div className="flex gap-1.5 flex-wrap">
        <button
          className={cn(BTN_PRIMARY, 'flex-1')}
          onClick={() => onStatusChange(VocabularyStatus.NEWLY_SEEN)}
        >
          <span className="w-2 h-2 rounded-full bg-[hsl(2,72%,58%)] shrink-0" />
          Just learned
          <span className="text-white/60 font-normal">· Newly Seen</span>
        </button>
        <button
          className={cn(BTN_SECONDARY, 'flex-1')}
          onClick={() => onStatusChange(VocabularyStatus.WELL_KNOWN)}
        >
          <span className="w-2 h-2 rounded-full bg-[hsl(145,45%,40%)] shrink-0" />
          I know it well
          <span className="text-muted font-normal">· Well-Known</span>
        </button>
        <MoreBtn />
      </div>
    );
  }

  // ── MID-TIER — ±1 nudge with status ladder ────────────────────────────────
  return (
    <div className="flex items-center gap-1.5">
      {stepDown && (
        <button className={cn(BTN_SECONDARY, 'flex-1')} onClick={() => onStatusChange(stepDown)}>
          <ChevronDown size={13} strokeWidth={2.5} />
          Didn't
        </button>
      )}

      {/* 4-dot status ladder */}
      <div className="flex items-center gap-1.5 px-1 shrink-0">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={cn('block w-2 h-2 rounded-full transition-colors', i <= level ? dotColor : 'bg-border')}
            />
          ))}
        </div>
        <span className="font-sans text-[10px] font-semibold text-ink whitespace-nowrap">{label}</span>
      </div>

      {stepUp && (
        <button className={cn(BTN_PRIMARY, 'flex-1')} onClick={() => onStatusChange(stepUp)}>
          Knew it
          <ChevronUp size={13} strokeWidth={2.5} />
        </button>
      )}

      <MoreBtn />
    </div>
  );
}
