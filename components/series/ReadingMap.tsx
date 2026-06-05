'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReadingMapText {
  id: string;
  title: string;
  knownPercentage: number;
  isCurrentlyReading: boolean;
}

interface ReadingMapProps {
  texts: ReadingMapText[];
  onTextClick: (textId: string) => void;
  defaultCollapsed?: boolean;
}

type TierFilter = 'all' | 'ready' | 'ok' | 'hard';

function TierIcon({ pct }: { pct: number }) {
  if (pct >= 80) return <CheckCircle2 size={14} className="text-primary shrink-0" strokeWidth={1.5} />;
  if (pct >= 65) return <Circle       size={14} className="text-muted shrink-0"   strokeWidth={1.5} />;
  if (pct >= 50) return <AlertTriangle size={14} className="text-amber-500 shrink-0" strokeWidth={1.5} />;
  return               <XCircle       size={14} className="text-red-400 shrink-0"  strokeWidth={1.5} />;
}

const TIER_OPTIONS: { value: TierFilter; label: string }[] = [
  { value: 'all',   label: 'All' },
  { value: 'ready', label: 'Ready ≥80%' },
  { value: 'ok',    label: 'OK 65–79%' },
  { value: 'hard',  label: 'Hard <65%' },
];

const COLLAPSED_COUNT = 3;

export function ReadingMap({ texts, onTextClick, defaultCollapsed = true }: ReadingMapProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');

  if (texts.length === 0) return null;

  const filtered = texts.filter((t) => {
    if (tierFilter === 'ready') return t.knownPercentage >= 80;
    if (tierFilter === 'ok')    return t.knownPercentage >= 65 && t.knownPercentage < 80;
    if (tierFilter === 'hard')  return t.knownPercentage < 65;
    return true;
  });

  const visible = collapsed ? filtered.slice(0, COLLAPSED_COUNT) : filtered;
  const hasMore = filtered.length > COLLAPSED_COUNT;

  return (
    <div className="bg-desk border border-border rounded-card p-3 mb-4">
      {/* Header row */}
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-semibold text-ui-sm font-sans flex-1">Reading Map</h3>

        {/* Tier filter */}
        <select
          value={tierFilter}
          onChange={(e) => {
            setTierFilter(e.target.value as TierFilter);
            setCollapsed(true);
          }}
          className="text-ui-xs font-sans text-muted bg-paper border border-border rounded px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          {TIER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Expand / collapse */}
        {hasMore && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-ui-xs font-sans text-primary font-medium hover:underline whitespace-nowrap cursor-pointer"
          >
            {collapsed ? `Show all ${filtered.length} ▾` : 'Collapse ▲'}
          </button>
        )}
      </div>

      {/* Rows */}
      <div className="space-y-0.5">
        {visible.map((text) => (
          <button
            key={text.id}
            onClick={() => onTextClick(text.id)}
            className={cn(
              'w-full flex items-center gap-2 py-1 px-1.5 rounded text-left cursor-pointer transition-colors hover:bg-border/40',
              text.isCurrentlyReading && 'bg-primary/5 border border-primary/15'
            )}
          >
            {/* Title — wider so truncation kicks in later */}
            <span className="text-ui-xs text-muted w-36 truncate shrink-0 font-sans">
              {text.title}
            </span>

            {/* Progress bar */}
            <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary opacity-75 rounded-full transition-all"
                style={{ width: `${Math.round(text.knownPercentage)}%` }}
              />
            </div>

            {/* Percentage — w-8 prevents "100%" clipping */}
            <span className="text-ui-xs font-semibold text-ink w-8 text-right font-sans shrink-0">
              {Math.round(text.knownPercentage)}%
            </span>

            {/* Tier icon */}
            <TierIcon pct={text.knownPercentage} />

            {/* Currently reading label */}
            {text.isCurrentlyReading && (
              <span className="text-ui-xs text-muted font-sans shrink-0">← now</span>
            )}
          </button>
        ))}

        {filtered.length === 0 && (
          <p className="text-ui-xs text-muted font-sans py-1 px-1">No texts match this filter.</p>
        )}
      </div>
    </div>
  );
}
