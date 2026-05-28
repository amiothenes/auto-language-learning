'use client';

import { useState } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';
import { WordData, VocabularyStatus } from './Word';
import { StatusDots } from './StatusDots';
import { GradingSection } from './GradingSection';
import { cn } from '@/lib/utils';
import { X, ExternalLink } from 'lucide-react';

// ============================================================================
// WordTooltip Component
// Desktop word tooltip with quick info, grading actions, and lookup links
// ============================================================================

interface WordTooltipProps {
  wordData: WordData;
  anchorRect: DOMRect;
  onClose: () => void;
  onStatusChange: (wordId: string, newStatus: VocabularyStatus) => void;
  isExiting?: boolean;
}

/** Status label + dot color mapping */
const STATUS_CONFIG: Record<VocabularyStatus, { label: string; dotColor: string }> = {
  [VocabularyStatus.UNKNOWN]:    { label: 'Unreviewed', dotColor: 'bg-gray-400' },
  [VocabularyStatus.NEWLY_SEEN]: { label: 'New Word',   dotColor: 'bg-red-500' },
  [VocabularyStatus.FAMILIAR]:   { label: 'Learning',   dotColor: 'bg-orange-400' },
  [VocabularyStatus.KNOWN]:      { label: 'Known Word', dotColor: 'bg-green-500' },
  [VocabularyStatus.WELL_KNOWN]: { label: 'Known Word', dotColor: 'bg-green-500' },
  [VocabularyStatus.IGNORE]:     { label: 'Ignored',    dotColor: 'bg-gray-400' },
};

/** Morph fields shown in the collapsed summary — most universally useful */
const MORPH_PRIORITY = ['tense', 'case', 'number'] as const;

/** Human-readable labels for morph field keys */
const MORPH_LABELS: Record<string, string> = {
  tense: 'Tense', case: 'Case', number: 'Number', mood: 'Mood',
  gender: 'Gender', voice: 'Voice', aspect: 'Aspect', person: 'Person',
};

function buildMorphSummary(data: Record<string, unknown>): string {
  const d = Object.fromEntries(Object.entries(data).map(([k, v]) => [k.toLowerCase(), v]));
  const parts = MORPH_PRIORITY.filter((k) => d[k]).map((k) => String(d[k]));
  return parts.length > 0 ? parts.join(', ') : '';
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
  isExiting = false,
}: WordTooltipProps) {
  const [showFullMorph, setShowFullMorph] = useState(false);

  const { label } = STATUS_CONFIG[wordData.status];
  const cleanSurface = wordData.surface.replace(/[.,!?;:«»„"]/g, '');

  const wiktionaryUrl = `https://en.wiktionary.org/wiki/${encodeURIComponent(wordData.lemma)}`;
  const googleTranslateUrl = `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(cleanSurface)}`;

  const morphSummary = wordData.inflectionData ? buildMorphSummary(wordData.inflectionData) : '';
  const morphFull = wordData.inflectionData ? buildMorphFull(wordData.inflectionData) : wordData.inflection;
  const summaryDisplay = morphSummary || wordData.inflection;

  // Show the toggle only when there are fields beyond the 3 priority ones
  const hasExtraMorph = wordData.inflectionData
    ? Object.keys(wordData.inflectionData).length > MORPH_PRIORITY.length
    : false;

  return (
    <Tooltip
      anchorRect={anchorRect}
      isOpen={true}
      onClose={onClose}
      isExiting={isExiting}
    >
      <div
        className="w-80 p-4"
        aria-label={`Word details for ${wordData.lemma}`}
      >
        {/* Header: status progression dots + label + close */}
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

        {/* Lemma + translation */}
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

        {/* POS + inflection — summary always visible, full morph animates in */}
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

          {/* Fix 8: animated expand for full morph — no layout jump */}
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

        {/* Grading: contextual action buttons + 6-chip status row */}
        <div className="mb-3">
          <GradingSection
            status={wordData.status}
            onStatusChange={(newStatus) => onStatusChange(wordData.wordId, newStatus)}
            size="compact"
          />
        </div>

        {/* Lookup links */}
        <div className="pt-3 border-t border-border">
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
              Google Translate <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>
    </Tooltip>
  );
}
