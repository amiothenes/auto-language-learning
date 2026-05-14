'use client';

import { Tooltip } from '@/components/ui/Tooltip';
import { Button } from '@/components/ui/Button';
import { WordData, VocabularyStatus } from './Word';
import { StatusDots } from './StatusDots';
import { X, ExternalLink, ArrowRight } from 'lucide-react';

// ============================================================================
// WordTooltip Component
// Desktop word tooltip with quick info, actions, and lookup links
// ============================================================================

interface WordTooltipProps {
  wordData: WordData;
  anchorRect: DOMRect;
  onClose: () => void;
  onStatusChange: (wordId: string, newStatus: VocabularyStatus) => void;
  onViewDetails: () => void;
  isExiting?: boolean;
}

/** Status label + dot color mapping */
const STATUS_CONFIG: Record<VocabularyStatus, { label: string; dotColor: string }> = {
  [VocabularyStatus.NEWLY_SEEN]: { label: 'New Word', dotColor: 'bg-red-500' },
  [VocabularyStatus.FAMILIAR]: { label: 'Learning', dotColor: 'bg-orange-400' },
  [VocabularyStatus.KNOWN]: { label: 'Known Word', dotColor: 'bg-green-500' },
  [VocabularyStatus.WELL_KNOWN]: { label: 'Known Word', dotColor: 'bg-green-500' },
  [VocabularyStatus.IGNORE]: { label: 'Ignored', dotColor: 'bg-gray-400' },
};

export function WordTooltip({
  wordData,
  anchorRect,
  onClose,
  onStatusChange,
  onViewDetails,
  isExiting = false,
}: WordTooltipProps) {
  const { label } = STATUS_CONFIG[wordData.status];
  const cleanSurface = wordData.surface.replace(/[.,!?;:«»„"]/g, '');

  const wiktionaryUrl = `https://en.wiktionary.org/wiki/${encodeURIComponent(wordData.lemma)}`;
  const googleTranslateUrl = `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(cleanSurface)}`;

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

        {/* POS + inflection */}
        <div className="flex items-center gap-3 text-ui-xs text-muted mb-3 pb-3 border-b border-border">
          <span className="font-sans">
            <span className="text-ink font-medium">POS:</span> {wordData.pos}
          </span>
          <span className="text-border">|</span>
          <span className="font-sans">
            <span className="text-ink font-medium">Form:</span> {wordData.inflection}
          </span>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 mb-3">
          <QuickActions
            status={wordData.status}
            onStatusChange={(newStatus) => onStatusChange(wordData.wordId, newStatus)}
          />
        </div>

        {/* Lookup links + View Full Details */}
        <div className="pt-3 border-t border-border space-y-2">
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

          <button
            onClick={onViewDetails}
            className="w-full flex items-center justify-center gap-1.5 font-sans text-ui-sm text-primary hover:text-primary/80 transition-colors py-1.5"
          >
            View Full Details <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </Tooltip>
  );
}

// ============================================================================
// Quick Actions (step-based +1 / -1 along the learning progression)
// ============================================================================

/** Learning progression order (IGNORE is separate, not on this ladder) */
const PROGRESSION = [
  VocabularyStatus.NEWLY_SEEN,
  VocabularyStatus.FAMILIAR,
  VocabularyStatus.KNOWN,
  VocabularyStatus.WELL_KNOWN,
] as const;

const STEP_LABELS: Record<VocabularyStatus, string> = {
  [VocabularyStatus.NEWLY_SEEN]: 'Newly Seen',
  [VocabularyStatus.FAMILIAR]: 'Familiar',
  [VocabularyStatus.KNOWN]: 'Known',
  [VocabularyStatus.WELL_KNOWN]: 'Well Known',
  [VocabularyStatus.IGNORE]: 'Ignore',
};

interface QuickActionsProps {
  status: VocabularyStatus;
  onStatusChange: (newStatus: VocabularyStatus) => void;
}

function QuickActions({ status, onStatusChange }: QuickActionsProps) {
  // IGNORE words: offer to re-enter learning flow at Newly Seen
  if (status === VocabularyStatus.IGNORE) {
    return (
      <Button
        size="sm"
        variant="primary"
        onClick={() => onStatusChange(VocabularyStatus.NEWLY_SEEN)}
        className="flex-1"
      >
        Restore to Newly Seen
      </Button>
    );
  }

  const idx = PROGRESSION.indexOf(status);
  const canStepDown = idx > 0;
  const canStepUp = idx < PROGRESSION.length - 1;
  const stepDown = canStepDown ? PROGRESSION[idx - 1] : null;
  const stepUp = canStepUp ? PROGRESSION[idx + 1] : null;

  return (
    <>
      {stepDown && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onStatusChange(stepDown)}
          className="flex-1"
        >
          {STEP_LABELS[stepDown]}
        </Button>
      )}
      {stepUp && (
        <Button
          size="sm"
          variant="primary"
          onClick={() => onStatusChange(stepUp)}
          className="flex-1"
        >
          {STEP_LABELS[stepUp]}
        </Button>
      )}
      {status === VocabularyStatus.NEWLY_SEEN && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onStatusChange(VocabularyStatus.IGNORE)}
          className="flex-1"
        >
          Ignore
        </Button>
      )}
    </>
  );
}
