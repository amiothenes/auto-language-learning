'use client';

import { useState, useCallback } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';
import { WordData, VocabularyStatus } from './Word';
import { StatusDots } from './StatusDots';
import { AdaptiveStepper } from './AdaptiveStepper';
import { MoreMenu } from './MoreMenu';
import { cn } from '@/lib/utils';
import { X, ExternalLink } from 'lucide-react';

// ============================================================================
// WordTooltip — updated to use AdaptiveStepper (Option A) instead of
// GradingSection. Adds a MoreMenu triggered by the ··· button inside the
// stepper, and a "More →" link to open the full WordDetailsPanel.
//
// Changes from previous version:
//   • GradingSection import removed, replaced with AdaptiveStepper + MoreMenu
//   • onMoreClick prop added — called when user wants full WordDetailsPanel
//   • moreMenuAnchorEl state handles MoreMenu positioning
// ============================================================================

interface WordTooltipProps {
  wordData: WordData;
  anchorRect: DOMRect;
  onClose: () => void;
  onStatusChange: (wordId: string, newStatus: VocabularyStatus) => void;
  /** Called when user taps "More →" — should open WordDetailsPanel */
  onMoreClick?: () => void;
  isExiting?: boolean;
}

const STATUS_CONFIG: Record<VocabularyStatus, { label: string }> = {
  [VocabularyStatus.UNKNOWN]:    { label: 'Unreviewed'  },
  [VocabularyStatus.NEWLY_SEEN]: { label: 'Newly Seen'  },
  [VocabularyStatus.FAMILIAR]:   { label: 'Familiar'    },
  [VocabularyStatus.KNOWN]:      { label: 'Known'       },
  [VocabularyStatus.WELL_KNOWN]: { label: 'Well Known'  },
  [VocabularyStatus.IGNORE]:     { label: 'Ignored'     },
};

const MORPH_PRIORITY = ['tense', 'case', 'number'] as const;

const MORPH_LABELS: Record<string, string> = {
  tense: 'Tense', case: 'Case', number: 'Number', mood: 'Mood',
  gender: 'Gender', voice: 'Voice', aspect: 'Aspect', person: 'Person',
};

function buildMorphSummary(data: Record<string, unknown>): string {
  const d = Object.fromEntries(Object.entries(data).map(([k, v]) => [k.toLowerCase(), v]));
  return MORPH_PRIORITY.filter((k) => d[k]).map((k) => String(d[k])).join(', ');
}

function buildMorphFull(data: Record<string, unknown>): string {
  const d = Object.fromEntries(Object.entries(data).map(([k, v]) => [k.toLowerCase(), v]));
  const order = ['tense', 'mood', 'person', 'number', 'gender', 'case', 'voice', 'aspect'];
  return order
    .filter((k) => d[k])
    .map((k) => `${MORPH_LABELS[k] ?? k}: ${d[k]}`)
    .join(' · ');
}

export function WordTooltip({
  wordData,
  anchorRect,
  onClose,
  onStatusChange,
  onMoreClick,
  isExiting = false,
}: WordTooltipProps) {
  const [showFullMorph, setShowFullMorph] = useState(false);
  // anchorEl of the ··· button — non-null means MoreMenu is open
  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState<HTMLButtonElement | null>(null);

  // Guard: don't close the Tooltip via Escape when MoreMenu is consuming that key
  const handleTooltipClose = useCallback(() => {
    if (moreMenuAnchorEl) return;
    onClose();
  }, [moreMenuAnchorEl, onClose]);

  const { label } = STATUS_CONFIG[wordData.status];
  const cleanSurface = wordData.surface.replace(/[.,!?;:«»„"]/g, '');

  const wiktionaryUrl     = `https://en.wiktionary.org/wiki/${encodeURIComponent(wordData.lemma)}`;
  const googleTranslateUrl = `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(cleanSurface)}`;

  const morphSummary   = wordData.inflectionData ? buildMorphSummary(wordData.inflectionData) : '';
  const morphFull      = wordData.inflectionData ? buildMorphFull(wordData.inflectionData) : wordData.inflection;
  const summaryDisplay = morphSummary || wordData.inflection;

  const hasExtraMorph = wordData.inflectionData
    ? Object.keys(wordData.inflectionData).length > MORPH_PRIORITY.length
    : false;

  return (
    <>
      <Tooltip
        anchorRect={anchorRect}
        isOpen={true}
        onClose={handleTooltipClose}
        isExiting={isExiting}
      >
        <div className="w-80 p-4" aria-label={`Word details for ${wordData.lemma}`}>

          {/* ① Header: StatusDots · label · close */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <StatusDots status={wordData.status} />
              <span className="font-sans text-ui-xs text-muted font-medium uppercase tracking-wide">
                {label}
              </span>
            </div>
            <button
              onMouseEnter={onClose}
              className="text-muted hover:text-ink transition-colors p-0.5 -mr-1"
              aria-label="Close"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>

          {/* ② Lemma + translation */}
          <div className="mb-3">
            <p className="font-serif text-content-lg text-ink font-bold leading-tight">
              {wordData.lemma}
            </p>
            {wordData.translation && wordData.translation !== '—' && (
              <p className="font-sans text-ui-sm text-muted italic mt-0.5">
                &ldquo;{wordData.translation}&rdquo;
              </p>
            )}
          </div>

          {/* ③ POS + inflection */}
          <div className="text-ui-xs text-muted mb-3 pb-3 border-b border-border space-y-1">
            <div className="flex items-start gap-3 font-sans flex-wrap">
              <span className="shrink-0">
                <span className="text-ink font-medium">POS:</span> {wordData.pos}
              </span>
              {summaryDisplay && summaryDisplay !== 'base form' && (
                <>
                  <span className="text-border shrink-0">|</span>
                  <span>
                    <span className="text-ink font-medium">Form:</span> {summaryDisplay}
                  </span>
                </>
              )}
            </div>

            {hasExtraMorph && (
              <>
                <div
                  className={cn(
                    'grid transition-[grid-template-rows] duration-200 ease-in-out',
                    showFullMorph ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="font-sans text-ui-xs text-ink/70 pt-1 pb-0.5">{morphFull}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFullMorph((v) => !v)}
                  className="font-sans text-primary hover:text-primary/80 transition-colors"
                >
                  {showFullMorph ? 'less ‹' : 'more ›'}
                </button>
              </>
            )}
          </div>

          {/* ④ Adaptive Stepper (replaces old GradingSection) */}
          <div className="mb-3">
            <AdaptiveStepper
              status={wordData.status}
              onStatusChange={(newStatus) => onStatusChange(wordData.wordId, newStatus)}
              onMoreClick={(el) => setMoreMenuAnchorEl(el)}
            />
          </div>

          {/* ⑤ Lookup links + "More →" details link */}
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a
                href={wiktionaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-ui-xs text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
              >
                Wiktionary <ExternalLink size={10} />
              </a>
              <span className="text-border">|</span>
              <a
                href={googleTranslateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-ui-xs text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
              >
                Translate <ExternalLink size={10} />
              </a>
            </div>

            {onMoreClick && (
              <button
                onClick={() => { onMoreClick(); onClose(); }}
                className="font-sans text-ui-xs text-primary hover:text-primary/80 transition-colors"
              >
                More →
              </button>
            )}
          </div>
        </div>
      </Tooltip>

      {/* MoreMenu portal — outside Tooltip so z-index stacks correctly */}
      {moreMenuAnchorEl && (
        <MoreMenu
          anchorEl={moreMenuAnchorEl}
          currentStatus={wordData.status}
          onStatusChange={(newStatus) => {
            onStatusChange(wordData.wordId, newStatus);
            setMoreMenuAnchorEl(null);
          }}
          onClose={() => setMoreMenuAnchorEl(null)}
        />
      )}
    </>
  );
}
