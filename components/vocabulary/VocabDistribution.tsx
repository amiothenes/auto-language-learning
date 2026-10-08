'use client';

import { ReadingCoverageSummary } from '@/components/vocabulary/ReadingCoverageSummary';
import type { CefrBand } from '@/lib/types/api';

interface VocabDistributionProps {
  unknown: number;
  newlySeen: number;
  familiar: number;
  known: number;
  wellKnown: number;
  total: number;
  /** Zipf-weighted estimated reading coverage of the full language vocabulary (0-98) — from useStats(), not derived from the counts above */
  readingCoverage: number;
  cefrBand: CefrBand;
  compact?: boolean;
}

// Status colours come from the @theme tokens in app/globals.css rather than
// literal HSL triples, so the strip can never drift away from the Reader's
// word highlighting. `fill` is the saturated tint used behind ink; `ink` is its
// darkened companion, the only one of the pair that passes AA as a text colour.
const SEGMENTS = [
  { key: 'unknown',   fill: 'hsl(var(--color-status-unknown))',   ink: 'hsl(var(--color-status-unknown-ink))',   label: 'Unknown'     },
  { key: 'newlySeen', fill: 'hsl(var(--color-status-new))',       ink: 'hsl(var(--color-status-new-ink))',       label: 'Newly Seen'  },
  { key: 'familiar',  fill: 'hsl(var(--color-status-familiar))',  ink: 'hsl(var(--color-status-familiar-ink))',  label: 'Familiar'    },
  { key: 'known',     fill: 'hsl(var(--color-status-known))',     ink: 'hsl(var(--color-status-known-ink))',     label: 'Known'       },
  { key: 'wellKnown', fill: 'hsl(var(--color-status-wellknown))', ink: 'hsl(var(--color-status-wellknown-ink))', label: 'Well Known'  },
] as const;

type SegmentKey = typeof SEGMENTS[number]['key'];

export function VocabDistribution({
  unknown,
  newlySeen,
  familiar,
  known,
  wellKnown,
  total,
  readingCoverage,
  cefrBand,
  compact = false,
}: VocabDistributionProps) {
  if (total === 0) return null;

  const counts: Record<SegmentKey, number> = { unknown, newlySeen, familiar, known, wellKnown };
  const share = (n: number) => (n / total) * 100;

  return (
    <div className="space-y-3">
      <div>
        {/* Distribution strip. Each visible slice gets a 2px floor so a status
            holding a handful of words out of thousands still registers instead
            of collapsing to a sub-pixel sliver, and a hairline paper divider so
            adjacent slices stay distinguishable where their hues are close. */}
        <div className="mb-2 flex h-2.5 w-full overflow-hidden rounded-full bg-desk">
          {SEGMENTS.map((seg) =>
            counts[seg.key] > 0 ? (
              <div
                key={seg.key}
                title={`${seg.label}: ${counts[seg.key].toLocaleString('en-US')} (${share(counts[seg.key]).toFixed(1)}%)`}
                className="h-full border-l border-paper transition-[width] duration-500 ease-out first:border-l-0"
                style={{
                  width: `${share(counts[seg.key]).toFixed(2)}%`,
                  minWidth: '2px',
                  background: seg.fill,
                }}
              />
            ) : null
          )}
        </div>

        {/* Figures. Counts carry the status colour; the share underneath gives
            the strip above a readable scale without needing a hover.
            `truncate` + nowrap on the label is what keeps this block three tight
            lines tall: at text-ui-xs "Newly Seen" and "Well Known" wrap onto a
            second line in a narrow column, and a single wrapped label stretches
            all five cells. The full label stays available via the title. */}
        <div className="grid grid-cols-5 gap-x-1">
          {SEGMENTS.map((seg) => (
            <div key={seg.key} className="min-w-0 text-center" title={seg.label}>
              <div
                className="font-sans text-ui-md font-bold leading-none tabular-nums"
                style={{ color: seg.ink }}
              >
                {counts[seg.key].toLocaleString('en-US')}
              </div>
              <div className="mt-1.5 truncate font-sans text-[10px] leading-none text-muted">
                {seg.label}
              </div>
              <div className="mt-0.5 font-sans text-[10px] leading-none tabular-nums text-muted/70">
                {share(counts[seg.key]).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reading coverage — whole-language estimate from useStats(), not the counts above */}
      {!compact && (
        <div className="rounded-card border border-border bg-paper px-3 py-2.5 shadow-raised">
          <ReadingCoverageSummary value={readingCoverage} cefrBand={cefrBand} />
        </div>
      )}
    </div>
  );
}
