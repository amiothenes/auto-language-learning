'use client';

import { cn } from '@/lib/utils';
import type { CefrBand } from '@/lib/types/api';

interface ReadingCoverageBarProps {
  /** Zipf-weighted reading coverage estimate (0-98) from useStats() */
  value: number;
  /** Hide the CEFR band labels under the track, leaving just the meter */
  showBands?: boolean;
  className?: string;
}

// The CEFR scale as contiguous ZONES rather than bare tick marks. `from` mirrors
// the cefrBand thresholds in app/api/stats/route.ts and the table in
// app/coverage-info/page.tsx - keep all three in sync if they ever change.
//
// `tint` is a static class string on purpose: Tailwind only ships classes it can
// find as literal text, so a computed `bg-primary/${n}` would compile to nothing.
// The tints deepen left to right so the empty part of the track reads as a ramp -
// a visual cue that each remaining band costs more vocabulary than the last.
const CEFR_BANDS = [
  { band: 'A1-A2', from: 0,  tint: 'bg-primary/6'  },
  { band: 'A2-B1', from: 77, tint: 'bg-primary/10' },
  { band: 'B1-B2', from: 84, tint: 'bg-primary/14' },
  { band: 'C1',    from: 92, tint: 'bg-primary/18' },
  { band: 'C2',    from: 96, tint: 'bg-primary/24' },
] as const;

// Zone widths derived once from the boundaries, so the widths can never drift
// out of sync with the thresholds they are drawn from.
const ZONES = CEFR_BANDS.map((b, i) => ({
  ...b,
  width: (CEFR_BANDS[i + 1]?.from ?? 100) - b.from,
}));

// Every boundary except 0 gets a label. `row` staggers them onto two lines:
// 92 and 96 sit only 4 points apart, so on a single row their labels collide no
// matter how small the type gets. Alternating rows gives each label the full
// width of its own line, which is why this needs no nudging, no leader lines and
// no rotated text - every label sits exactly on its true position.
const MARKERS = CEFR_BANDS.slice(1).map((b, i) => ({
  at: b.from,
  band: b.band,
  row: (i % 2) as 0 | 1,
}));

/** The band a given coverage value currently sits in. */
export function cefrBandFor(value: number): CefrBand {
  let current: CefrBand = CEFR_BANDS[0].band;
  for (const b of CEFR_BANDS) if (value >= b.from) current = b.band;
  return current;
}

/**
 * The next band boundary above `value`, or null once C2 is reached.
 * Used for the "2.4% to B1-B2" nudge above the bar.
 */
export function nextCefrMilestone(value: number): { band: string; gap: number } | null {
  const next = MARKERS.find((m) => value < m.at);
  return next ? { band: next.band, gap: next.at - value } : null;
}

export function ReadingCoverageBar({ value, showBands = true, className }: ReadingCoverageBarProps) {
  const pct = Math.min(Math.max(value, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      {/* Meter. The track is not a plain gutter: it is the CEFR scale itself,
          split into zones whose widths are the real distances between bands.
          That removes the need for tick overlays entirely - the boundaries are
          where one tint stops and the next begins. */}
      <div
        role="progressbar"
        aria-valuenow={Number(pct.toFixed(1))}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${pct.toFixed(1)}% reading coverage, ${cefrBandFor(pct)}`}
        className="relative h-2.5 w-full"
      >
        <div className="absolute inset-0 flex overflow-hidden rounded-full bg-desk">
          {ZONES.map((z) => (
            <div
              key={z.band}
              title={`${z.band} starts at ${z.from}%`}
              className={cn('h-full border-paper first:border-l-0 border-l', z.tint)}
              style={{ width: `${z.width}%` }}
            />
          ))}
        </div>

        {/* Filled portion. A gradient rather than a flat fill so the bar has some
            depth at the large sizes the dashboard uses. */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-primary/80 to-primary transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />

        {/* "You are here" notch. The paper ring is load-bearing: without it a
            primary-coloured marker would vanish into the primary-coloured fill
            it sits at the end of. */}
        <span
          className="absolute top-1/2 h-4 w-0.75 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-paper"
          style={{ left: `${pct}%` }}
        />
      </div>

      {showBands && (
        <div className="relative mt-1 h-7">
          {/* Connector hairlines - row 1 reaches past row 0's labels, which is
              safe because no two markers on adjacent rows share an x. */}
          {MARKERS.map((m) => (
            <div
              key={`tick-${m.at}`}
              aria-hidden
              className={cn(
                'absolute top-0 w-px',
                pct >= m.at ? 'bg-primary/35' : 'bg-border'
              )}
              style={{ left: `${m.at}%`, height: m.row === 0 ? 3 : 15 }}
            />
          ))}

          {MARKERS.map((m) => (
            <span
              key={m.band}
              className={cn(
                'absolute -translate-x-1/2 whitespace-nowrap font-sans text-[10px] leading-none tracking-tight tabular-nums',
                pct >= m.at ? 'font-semibold text-primary' : 'text-muted'
              )}
              style={{ left: `${m.at}%`, top: m.row === 0 ? 4 : 16 }}
            >
              {m.band}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
