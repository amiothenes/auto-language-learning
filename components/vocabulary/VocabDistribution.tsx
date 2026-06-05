'use client';

import { ProgressBar } from '@/components/ui/ProgressBar';

interface VocabDistributionProps {
  unknown: number;
  newlySeen: number;
  familiar: number;
  known: number;
  wellKnown: number;
  total: number;
  compact?: boolean;
}

const SEGMENTS = [
  { key: 'unknown',   barColor: 'hsl(205,80%,58%)', textColor: 'hsl(205,80%,28%)', label: 'Unknown' },
  { key: 'newlySeen', barColor: 'hsl(2,75%,60%)',   textColor: 'hsl(2,75%,30%)',   label: 'Newly Seen' },
  { key: 'familiar',  barColor: 'hsl(32,90%,56%)',  textColor: 'hsl(32,90%,28%)',  label: 'Familiar' },
  { key: 'known',     barColor: 'hsl(78,60%,48%)',  textColor: 'hsl(78,60%,20%)',  label: 'Known' },
  { key: 'wellKnown', barColor: 'hsl(145,60%,40%)', textColor: 'hsl(145,60%,22%)', label: 'Well Known' },
] as const;

type SegmentKey = typeof SEGMENTS[number]['key'];

export function VocabDistribution({ unknown, newlySeen, familiar, known, wellKnown, total, compact = false }: VocabDistributionProps) {
  if (total === 0) return null;

  const counts: Record<SegmentKey, number> = { unknown, newlySeen, familiar, known, wellKnown };
  const pct = (n: number) => `${((n / total) * 100).toFixed(1)}%`;
  const fluencyPct = ((known + wellKnown) / total) * 100;

  return (
    <div className="space-y-3">
      {/* Distribution strip */}
      <div>
        <div className="h-2.5 flex rounded-full overflow-hidden mb-3">
          {SEGMENTS.map(seg =>
            counts[seg.key] > 0 ? (
              <div key={seg.key} style={{ width: pct(counts[seg.key]), background: seg.barColor }} />
            ) : null
          )}
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-5 gap-1">
          {SEGMENTS.map(seg => (
            <div key={seg.key} className="text-center">
              <div className="font-bold text-ui-lg font-sans" style={{ color: seg.textColor }}>
                {counts[seg.key].toLocaleString()}
              </div>
              <div className="text-ui-xs text-muted font-sans leading-tight">{seg.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Fluency card */}
      {!compact && (
        <div className="bg-desk border border-border rounded-md p-2">
          <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
            <span className="font-bold text-2xl text-primary font-sans">{fluencyPct.toFixed(1)}%</span>
            <span className="text-muted text-ui-sm font-sans">reading fluency</span>
            <span className="text-muted text-ui-xs ml-auto font-sans hidden sm:block">
              95% = comfortable · 98% = fluent
            </span>
          </div>
          <div className="relative">
            <ProgressBar value={fluencyPct} className="opacity-70" />
            <div className="absolute inset-y-0 w-px bg-muted opacity-50" style={{ left: '95%' }} />
            <div className="absolute inset-y-0 w-px bg-muted opacity-50" style={{ left: '98%' }} />
          </div>
        </div>
      )}
    </div>
  );
}
