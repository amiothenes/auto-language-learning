'use client';

import Link from 'next/link';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReadingCoverageBar, nextCefrMilestone } from '@/components/vocabulary/ReadingCoverageBar';
import type { CefrBand } from '@/lib/types/api';

interface ReadingCoverageSummaryProps {
  /** Zipf-weighted reading coverage estimate (0-98) from useStats() */
  value: number;
  cefrBand: CefrBand;
  /** Renders the "Reading Coverage" eyebrow. Off where the surrounding card already says it. */
  showTitle?: boolean;
  className?: string;
}

/**
 * The reading-coverage readout: headline percentage, current CEFR band, distance
 * to the next band, and the banded meter. Shared verbatim by the Dashboard and
 * the Vocabulary page so the same metric never renders two different ways.
 */
export function ReadingCoverageSummary({
  value,
  cefrBand,
  showTitle = true,
  className,
}: ReadingCoverageSummaryProps) {
  const milestone = nextCefrMilestone(value);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Two tight rows rather than four stacked ones: the eyebrow pairs with the
          milestone, the headline pairs with the scale caption. Everything that
          used to own a line of its own now shares one. */}
      {showTitle && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <h3 className="font-sans text-ui-xs font-semibold uppercase leading-none tracking-[0.08em] text-muted">
              Reading Coverage
            </h3>
            <Link
              href="/coverage-info"
              title="How is this calculated? 95% = comfortable reading, 98% = fluent"
              aria-label="How reading coverage is calculated"
              className="text-muted transition-colors hover:text-primary"
            >
              <Info size={13} strokeWidth={1.5} />
            </Link>
          </div>

          <p className="font-sans text-ui-xs leading-none text-muted">
            {milestone ? (
              <>
                <span className="font-semibold tabular-nums text-ink">
                  {milestone.gap.toFixed(1)}%
                </span>{' '}
                to {milestone.band}
              </>
            ) : (
              'Top band reached'
            )}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
        <div className="flex items-baseline gap-2">
          {/* tabular-nums keeps the headline from reflowing by a pixel or two
              every time the value ticks over to a different set of digits. */}
          <span className="font-sans text-ui-2xl font-bold leading-none tabular-nums text-ink">
            {value.toFixed(1)}
            <span className="text-ui-lg font-semibold text-muted">%</span>
          </span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 font-sans text-ui-xs font-semibold leading-none text-primary">
            {cefrBand}
          </span>
        </div>

        <p className="font-sans text-ui-xs leading-none text-muted">
          95% = comfortable · 98% = fluent
        </p>
      </div>

      <ReadingCoverageBar value={value} />
    </div>
  );
}
