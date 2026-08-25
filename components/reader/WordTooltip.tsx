'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';
import { WordData, VocabularyStatus } from './Word';
import { StatusDots } from './StatusDots';
import { AdaptiveStepper } from './AdaptiveStepper';
import { MoreMenu } from './MoreMenu';
import { cn } from '@/lib/utils';
import { X, ExternalLink, Volume2, VolumeX, LoaderCircle } from 'lucide-react';
import { useWordAudioButton } from '@/lib/hooks/useWordAudioButton';

interface WordTooltipProps {
  wordData: WordData;
  anchorRect: DOMRect;
  onClose: () => void;
  onStatusChange: (wordId: string, newStatus: VocabularyStatus) => void;
  onMoreClick?: () => void;
  onTranslationChange?: (wordId: string, translation: string) => void;
  isFirstTest?: boolean;
  onGraded?: (lemma: string) => void;
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
  onTranslationChange,
  isFirstTest = false,
  onGraded,
  isExiting = false,
}: WordTooltipProps) {
  const [showFullMorph, setShowFullMorph] = useState(false);
  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState<HTMLButtonElement | null>(null);
  // SRS state: hidden until graded on first encounter
  const [translationRevealed, setTranslationRevealed] = useState(false);
  // True immediately after first-test grade — hides stepper, enlarges translation
  const [justGraded, setJustGraded] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState(false);
  // The WELL_KNOWN auto-close below is the only deferred close in here, and an
  // uncancelled one is dangerous: it fires against whatever tooltip is open
  // when it lands. In Tutor Mode that was the NEXT word's interrupt, which got
  // closed out from under the user and left playback waiting on a dismissal
  // that could never arrive.
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    },
    []
  );
  const [translationValue, setTranslationValue] = useState(wordData.translation ?? '');
  const { state: audioState, play: playAudio } = useWordAudioButton(wordData.wordId);

  const showTranslation = !isFirstTest || translationRevealed;
  const showTestPrompt = isFirstTest && !translationRevealed;

  const handleTooltipClose = useCallback(() => {
    if (moreMenuAnchorEl) return;
    onClose();
  }, [moreMenuAnchorEl, onClose]);

  // After first-test grade: reveals translation, hides stepper, auto-closes on WELL_KNOWN.
  // Re-tap (isFirstTest=false) closes immediately via the else branch.
  // Same-status grades (NEWLY_SEEN floor "Didn't") skip the API call — no-op status-wise.
  const handleGrade = (newStatus: VocabularyStatus) => {
    if (newStatus !== wordData.status) {
      onStatusChange(wordData.wordId, newStatus);
    }
    onGraded?.(wordData.lemma);
    if (isFirstTest && newStatus !== VocabularyStatus.IGNORE) {
      setTranslationRevealed(true);
      setJustGraded(true);
      if (newStatus === VocabularyStatus.WELL_KNOWN) {
        autoCloseTimerRef.current = setTimeout(onClose, 1000);
      }
    } else {
      onClose();
    }
  };

  const { label } = STATUS_CONFIG[wordData.status];
  const cleanSurface = wordData.surface.replace(/[.,!?;:«»„"]/g, '');

  const wiktionaryUrl      = `https://en.wiktionary.org/wiki/${encodeURIComponent(wordData.lemma)}`;
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
        <div className="w-96 p-4" aria-label={`Word details for ${wordData.lemma}`}>

          {/* ① Header: StatusDots · label · close */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <StatusDots status={wordData.status} />
              <span className="font-sans text-ui-xs text-muted font-medium uppercase tracking-wide">
                {label}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-muted hover:text-ink transition-colors p-0.5 -mr-1"
              aria-label="Close"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>

          {/* ② Lemma + translation */}
          <div className="mb-3">
            <div className="flex items-center gap-1.5">
              <p className="font-serif text-content-lg text-ink font-bold leading-tight">
                {wordData.lemma}
              </p>
              <button
                type="button"
                onClick={playAudio}
                disabled={audioState === 'loading'}
                className="text-muted hover:text-primary transition-colors p-0.5 shrink-0 disabled:opacity-50"
                aria-label={`Hear pronunciation of ${wordData.lemma}`}
              >
                {audioState === 'loading' ? (
                  <LoaderCircle size={15} strokeWidth={1.5} className="animate-spin" />
                ) : audioState === 'error' ? (
                  <VolumeX size={15} strokeWidth={1.5} />
                ) : (
                  <Volume2 size={15} strokeWidth={1.5} />
                )}
              </button>
            </div>

            {showTranslation && (
              <div className="mt-1">
                {justGraded ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-serif text-xl text-ink/65 font-normal italic leading-snug">
                      {translationValue || (
                        <span className="not-italic text-muted/40 text-base">No translation</span>
                      )}
                    </p>
                    {wordData.meanings && wordData.meanings.length > 1 && (
                      <span className="font-sans text-[9.5px] text-muted/60 bg-desk border border-border rounded-sm px-1.5 py-0.5 shrink-0">
                        {wordData.meanings.length} meanings
                      </span>
                    )}
                  </div>
                ) : !editingTranslation ? (
                  <button className="w-full text-left group" onClick={() => setEditingTranslation(true)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-serif text-base text-ink/65 font-normal italic leading-snug">
                        {translationValue || (
                          <span className="not-italic text-muted/50 font-sans text-sm">Add translation…</span>
                        )}
                      </p>
                      {wordData.meanings && wordData.meanings.length > 1 && (
                        <span className="font-sans text-[9.5px] text-muted/60 bg-desk border border-border rounded-sm px-1.5 py-0.5 shrink-0">
                          {wordData.meanings.length} meanings
                        </span>
                      )}
                    </div>
                    <span className="font-sans text-[10px] text-muted/50 group-hover:text-primary transition-colors">
                      click to edit
                    </span>
                  </button>
                ) : (
                  <input
                    type="text"
                    autoFocus
                    value={translationValue}
                    onChange={(e) => setTranslationValue(e.target.value)}
                    onBlur={() => {
                      onTranslationChange?.(wordData.wordId, translationValue);
                      setEditingTranslation(false);
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                    className="w-full h-8 px-2 font-sans text-sm text-ink
                               bg-desk border border-primary rounded-sm
                               focus:outline-none focus:ring-2 focus:ring-primary
                               transition-all"
                  />
                )}
              </div>
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

          {/* ④ "Know this word?" prompt — test mode only */}
          {showTestPrompt && (
            <p className="font-sans text-[11px] text-muted text-center mb-2 tracking-wide">
              Know this word?
            </p>
          )}

          {/* ⑤ Adaptive Stepper — hidden immediately after first-test grade */}
          {!justGraded && (
            <div className="mb-3">
              <AdaptiveStepper
                status={wordData.status}
                onStatusChange={handleGrade}
                onMoreClick={(el) => setMoreMenuAnchorEl(el)}
              />
            </div>
          )}

          {/* ⑥ Lookup links + "More →" details link */}
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
                onClick={onMoreClick}
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
            onClose(); // MoreMenu is a deliberate precision action — always close after
          }}
          onClose={() => setMoreMenuAnchorEl(null)}
        />
      )}
    </>
  );
}
