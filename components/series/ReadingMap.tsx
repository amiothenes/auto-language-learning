'use client';

import { useState, useRef, useEffect } from 'react';
import { CheckCircle2, Circle, AlertTriangle, XCircle, ChevronDown, HelpCircle } from 'lucide-react';
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
  if (pct >= 50) return <AlertTriangle size={14} className="text-[hsl(32,28%,38%)] shrink-0" strokeWidth={1.5} />;
  return               <XCircle       size={14} className="text-[hsl(2,22%,40%)] shrink-0"  strokeWidth={1.5} />;
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
  const [isTierOpen, setIsTierOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const tierRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tierRef.current && !tierRef.current.contains(event.target as Node)) {
        setIsTierOpen(false);
      }
    }
    if (isTierOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isTierOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setShowInfo(false);
      }
    }
    if (showInfo) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showInfo]);

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

        {/* ? info popover */}
        <div ref={infoRef} className="relative">
          <button
            onClick={() => setShowInfo((v) => !v)}
            className="text-muted hover:text-ink transition-colors p-0.5 rounded"
            aria-label="Reading map guide"
          >
            <HelpCircle size={13} strokeWidth={1.5} />
          </button>
          {showInfo && (
            <div className="absolute top-6 right-0 z-20 w-56 rounded-card border border-border bg-paper p-3 shadow-modal">
              <p className="font-sans text-ui-xs text-muted leading-snug">
                Color = % complete — green is reading-ready, red needs more vocabulary
              </p>
              <button
                onClick={() => setShowInfo(false)}
                className="mt-2 font-sans text-ui-xs text-primary hover:underline"
              >
                Got it
              </button>
            </div>
          )}
        </div>

        {/* Tier filter */}
        <div ref={tierRef} className="relative">
          <button
            onClick={() => setIsTierOpen((o) => !o)}
            className="flex items-center gap-1 px-3 py-1 border border-border rounded-full font-sans text-ui-xs text-muted hover:bg-desk transition-colors cursor-pointer"
          >
            {TIER_OPTIONS.find((o) => o.value === tierFilter)?.label ?? 'All'}
            <ChevronDown size={11} className="shrink-0" strokeWidth={2} />
          </button>
          {isTierOpen && (
            <div className="absolute top-full right-0 mt-1 w-36 bg-paper border border-border rounded-card shadow-modal overflow-hidden z-10">
              {TIER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setTierFilter(opt.value);
                    setCollapsed(true);
                    setIsTierOpen(false);
                  }}
                  className={cn(
                    'w-full px-3 py-2 text-left font-sans text-ui-xs transition-colors cursor-pointer',
                    tierFilter === opt.value ? 'bg-primary text-white font-medium' : 'text-ink hover:bg-desk'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

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
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: `${Math.round(text.knownPercentage)}%`,
                  opacity: text.knownPercentage >= 80 ? 0.85 : text.knownPercentage >= 65 ? 0.65 : text.knownPercentage >= 50 ? 0.45 : 0.3,
                }}
              />
            </div>

            {/* Percentage — w-8 prevents "100%" clipping */}
            <span className="text-ui-xs font-semibold text-ink w-8 text-right font-sans shrink-0">
              {Math.round(text.knownPercentage)}%
            </span>

            {/* Tier icon */}
            <TierIcon pct={Math.round(text.knownPercentage)} />

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
