'use client';

import { cn } from '@/lib/utils';

// ============================================================================
// ParagraphScrubber — compact ¶ map card, third column of the reader's grid.
//
// Layout: a real xl:grid-cols column (see page.tsx), sticky below the desktop
// top bar (top-15.5), so it reserves its own space instead of floating over
// the prose. Width is a fixed 172px, matched by the grid column's own width.
// Hidden on mobile/tablet via CSS (hidden xl:block), and in Immersion Mode
// (via the `hidden` prop, set by the caller).
// ============================================================================

interface ParagraphScrubberProps {
  paragraphs: Array<{ id: string; progress: number }>;
  currentIndex: number;
  onNavigate: (index: number) => void;
  /** Paragraph the narration is currently in, or -1. Marked distinctly from
   * `currentIndex` (which follows the SCROLL position) so the two can disagree
   * — reading ahead of the audio is normal and shouldn't look like an error. */
  playingIndex?: number;
  /** Hide when the WordDetailsPanel is open so they don't overlap */
  hidden?: boolean;
}

const progressColor = (p: number): string =>
  p > 80 ? 'hsl(150,38%,46%)' :
  p > 60 ? 'hsl(78,45%,53%)'  :
  p > 40 ? 'hsl(32,68%,60%)'  :
  p > 20 ? 'hsl(4,58%,64%)'   :
           'hsl(205,58%,60%)';

// Renders just the ¶ Map card — positioning (grid column, sticky offset,
// hide conditions) is owned by the caller's shared gutter-column wrapper in
// page.tsx, since MiniPlayerDesktop shares that same column.
export function ParagraphScrubber({
  paragraphs,
  currentIndex,
  onNavigate,
  playingIndex = -1,
  hidden = false,
}: ParagraphScrubberProps) {
  if (hidden) return null;

  return (
    <div
      // Fills the gutter column (was a hardcoded 172px that no longer matched
      // the player card beside it), and drops shadow-modal — a 16px modal
      // shadow reads as a floating overlay on a card that's actually part of
      // the page furniture. shadow-raised matches the player.
      className="w-full bg-paper border border-border rounded-lg shadow-raised overflow-y-auto min-h-0"
      aria-label="Paragraph navigation"
    >
      {/* Header */}
      <p className="font-sans text-[9px] uppercase tracking-[0.07em] text-muted px-3 pt-2.5 pb-1.5">
        ¶ Map
      </p>

      {/* Paragraph rows */}
      <div className="px-1.5 pb-2 space-y-0.5">
        {paragraphs.map((para, i) => {
          const isActive = i === currentIndex;
          const isPlaying = i === playingIndex;
          return (
            <button
              key={para.id}
              onClick={() => onNavigate(i)}
              aria-label={`Paragraph ${i + 1}, ${para.progress}% complete${isPlaying ? ', now playing' : ''}`}
              aria-current={isPlaying ? 'true' : undefined}
              className={cn(
                'w-full flex items-center gap-2 px-1.5 py-1 rounded text-left transition-colors hover:bg-desk relative',
                isActive && 'bg-primary/5 ring-1 ring-primary/25',
                isPlaying && 'bg-primary/10',
              )}
            >
              {/* Narration position marker — a left rule rather than another
                  fill, so it reads clearly even on the scrolled-to row. */}
              {isPlaying && (
                <span
                  className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary"
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  'font-sans text-[10.5px] w-5.5 shrink-0',
                  isPlaying || isActive ? 'text-primary font-semibold' : 'text-muted',
                )}
              >
                ¶{i + 1}
              </span>

              <div className="flex-1 h-1.5 bg-desk rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${para.progress}%`,
                    background: progressColor(para.progress),
                  }}
                />
              </div>

              <span
                className={cn(
                  'font-sans text-[10px] w-6.5 text-right shrink-0',
                  isActive ? 'text-ink font-medium' : 'text-muted',
                )}
              >
                {para.progress}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
