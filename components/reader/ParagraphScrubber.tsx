'use client';

import { cn } from '@/lib/utils';

// ============================================================================
// ParagraphScrubber — compact ¶ map card, fixed top-right of the reader.
//
// Layout: fixed right-4, below the desktop top bar (top-15.5).
// Width is a fixed 172px. The main content area shifts left dynamically
// (via padding set in page.tsx) to ensure no overlap.
// Hidden on mobile/tablet via CSS (hidden xl:block).
// ============================================================================

interface ParagraphScrubberProps {
  paragraphs: Array<{ id: string; progress: number }>;
  currentIndex: number;
  onNavigate: (index: number) => void;
  /** Hide when the WordDetailsPanel is open so they don't overlap */
  hidden?: boolean;
}

const progressColor = (p: number): string =>
  p > 80 ? 'hsl(150,38%,46%)' :
  p > 60 ? 'hsl(78,45%,53%)'  :
  p > 40 ? 'hsl(32,68%,60%)'  :
  p > 20 ? 'hsl(4,58%,64%)'   :
           'hsl(205,58%,60%)';

export function ParagraphScrubber({
  paragraphs,
  currentIndex,
  onNavigate,
  hidden = false,
}: ParagraphScrubberProps) {
  if (hidden) return null;

  return (
    <div
      className="fixed right-4 top-15.5 z-20 hidden xl:block"
      aria-label="Paragraph navigation"
    >
      <div
        className="bg-paper border border-border rounded-lg shadow-modal overflow-y-auto"
        style={{ width: 172, maxHeight: 'calc(100vh - 80px)' }}
      >
        {/* Header */}
        <p className="font-sans text-[9px] uppercase tracking-[0.07em] text-muted px-3 pt-2.5 pb-1.5">
          ¶ Map
        </p>

        {/* Paragraph rows */}
        <div className="px-1.5 pb-2 space-y-0.5">
          {paragraphs.map((para, i) => {
            const isActive = i === currentIndex;
            return (
              <button
                key={para.id}
                onClick={() => onNavigate(i)}
                aria-label={`Paragraph ${i + 1}, ${para.progress}% complete`}
                className={cn(
                  'w-full flex items-center gap-2 px-1.5 py-1 rounded text-left transition-colors hover:bg-desk',
                  isActive && 'bg-primary-05 ring-1 ring-primary/25',
                )}
              >
                <span
                  className={cn(
                    'font-sans text-[10.5px] w-5.5 shrink-0',
                    isActive ? 'text-primary font-semibold' : 'text-muted',
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
    </div>
  );
}
