'use client';

import { useState, useRef, useCallback } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { WordData, VocabularyStatus } from '@/lib/types';
import { AdaptiveStepper } from './AdaptiveStepper';
import { MoreMenu } from './MoreMenu';
import { StatusDots } from './StatusDots';
import { cn } from '@/lib/utils';

// ============================================================================
// MobileWordSheet — bottom-sheet word details for mobile/tablet (<1280px).
//
// Two snap states driven by transform translateY on a 90dvh-tall sheet:
//   Peek     → translateY(calc(90dvh - PEEK_H + dragOffset))   = top 232px visible
//   Expanded → translateY(max(0, dragOffset))                   = full 90dvh visible
//
// Drag-to-expand/dismiss is handled on the drag handle only (touch events).
// AdaptiveStepper + MoreMenu are wired for status grading.
// ============================================================================

const PEEK_H = 232;
const DRAG_THRESHOLD = 72;

const MORPH_PRIORITY = ['tense', 'case', 'number'] as const;
const MORPH_LABELS: Record<string, string> = {
  tense: 'Tense', case: 'Case', number: 'Number', mood: 'Mood',
  gender: 'Gender', voice: 'Voice', aspect: 'Aspect', person: 'Person',
};

const STATUS_LABEL: Record<VocabularyStatus, string> = {
  [VocabularyStatus.UNKNOWN]:    'Unreviewed',
  [VocabularyStatus.NEWLY_SEEN]: 'Newly Seen',
  [VocabularyStatus.FAMILIAR]:   'Familiar',
  [VocabularyStatus.KNOWN]:      'Known',
  [VocabularyStatus.WELL_KNOWN]: 'Well Known',
  [VocabularyStatus.IGNORE]:     'Ignored',
};

function buildMorphSummary(data: Record<string, unknown>): string {
  const d = Object.fromEntries(Object.entries(data).map(([k, v]) => [k.toLowerCase(), v]));
  return MORPH_PRIORITY.filter((k) => d[k]).map((k) => String(d[k])).join(', ');
}

function buildMorphFull(data: Record<string, unknown>): string {
  const d = Object.fromEntries(Object.entries(data).map(([k, v]) => [k.toLowerCase(), v]));
  const order = ['tense', 'mood', 'person', 'number', 'gender', 'case', 'voice', 'aspect'];
  return order.filter((k) => d[k]).map((k) => `${MORPH_LABELS[k] ?? k}: ${d[k]}`).join(' · ');
}

interface MobileWordSheetProps {
  wordData: WordData;
  onClose: () => void;
  onStatusChange: (wordId: string, newStatus: VocabularyStatus) => void;
}

export function MobileWordSheet({ wordData, onClose, onStatusChange }: MobileWordSheetProps) {
  const [expanded, setExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [dismissing, setDismissing] = useState(false);
  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [showFullMorph, setShowFullMorph] = useState(false);

  const startYRef = useRef(0);

  const dismiss = useCallback(() => {
    setDismissing(true);
    setTimeout(onClose, 280);
  }, [onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setDragOffset(e.touches[0].clientY - startYRef.current);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (expanded) {
      if (dragOffset > DRAG_THRESHOLD) setExpanded(false);
    } else {
      if (dragOffset < -DRAG_THRESHOLD) setExpanded(true);
      else if (dragOffset > DRAG_THRESHOLD) dismiss();
    }
    setDragOffset(0);
  };

  // Sheet stays at 90dvh; translateY exposes only PEEK_H px in peek state.
  let transform: string;
  if (dismissing) {
    transform = 'translateY(90dvh)';
  } else if (expanded) {
    transform = `translateY(${Math.max(0, dragOffset)}px)`;
  } else {
    transform = `translateY(calc(90dvh - ${PEEK_H}px + ${dragOffset}px))`;
  }

  const transition = dismissing
    ? 'transform 0.28s ease-in'
    : isDragging
    ? 'none'
    : 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)';

  const cleanSurface = wordData.surface.replace(/[.,!?;:«»„"]/g, '');
  const wiktionaryUrl = `https://en.wiktionary.org/wiki/${encodeURIComponent(wordData.lemma)}`;
  const googleTranslateUrl = `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(cleanSurface)}`;
  const morphSummary = wordData.inflectionData ? buildMorphSummary(wordData.inflectionData) : '';
  const morphFull = wordData.inflectionData ? buildMorphFull(wordData.inflectionData) : wordData.inflection;
  const summaryDisplay = morphSummary || wordData.inflection;
  const hasExtraMorph = wordData.inflectionData
    ? Object.keys(wordData.inflectionData).length > MORPH_PRIORITY.length
    : false;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-45 bg-ink/20"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 inset-x-0 z-48 bg-paper rounded-t-2xl shadow-modal flex flex-col xl:hidden"
        style={{ height: '90dvh', transform, transition }}
        role="dialog"
        aria-modal="true"
        aria-label={`Word details: ${wordData.lemma}`}
      >
        {/* Drag handle — also tappable to toggle expanded */}
        <div
          className="shrink-0 pt-3 pb-2 px-4 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => !expanded && setExpanded(true)}
        >
          <div className="w-10 h-1 rounded-full bg-border mx-auto" />
        </div>

        {/* Status row + close */}
        <div className="shrink-0 flex items-center justify-between px-4 pb-2">
          <div className="flex items-center gap-2">
            <StatusDots status={wordData.status} />
            <span className="font-sans text-ui-xs text-muted font-medium uppercase tracking-wide">
              {STATUS_LABEL[wordData.status]}
            </span>
          </div>
          <button
            onClick={dismiss}
            className="text-muted hover:text-ink transition-colors p-1 -mr-1"
            aria-label="Close word details"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Lemma + translation + stepper — always visible in peek */}
        <div className="shrink-0 px-4 pb-4 border-b border-border">
          <p className="font-serif text-content-lg text-ink font-bold leading-tight mb-1">
            {wordData.lemma}
          </p>
          {wordData.translation && wordData.translation !== '—' ? (
            <p className="font-sans text-ui-sm text-muted italic mb-3">
              &ldquo;{wordData.translation}&rdquo;
            </p>
          ) : (
            <div className="mb-3" />
          )}
          <AdaptiveStepper
            status={wordData.status}
            onStatusChange={(newStatus) => onStatusChange(wordData.wordId, newStatus)}
            onMoreClick={(el) => setMoreMenuAnchorEl(el)}
          />
        </div>

        {/* Peek-only expand hint — collapses away when expanded */}
        <div
          className={cn(
            'shrink-0 overflow-hidden transition-all duration-300',
            expanded ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100',
          )}
        >
          <button
            onClick={() => setExpanded(true)}
            className="w-full py-2.5 font-sans text-ui-xs text-muted hover:text-ink transition-colors flex items-center justify-center gap-1"
            aria-label="Show full word details"
          >
            More details ↑
          </button>
        </div>

        {/* Expanded content — scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 py-4 space-y-4">
            {/* Surface + POS */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-sans text-ui-xs text-muted mb-1">Surface Form</p>
                <p className="font-serif text-content-sm text-ink">{cleanSurface}</p>
              </div>
              <div>
                <p className="font-sans text-ui-xs text-muted mb-1">Part of Speech</p>
                <p className="font-sans text-ui-sm text-ink">{wordData.pos}</p>
              </div>
            </div>

            {/* Morphology */}
            {summaryDisplay && summaryDisplay !== 'base form' && (
              <div>
                <p className="font-sans text-ui-xs text-muted mb-1">Form</p>
                <p className="font-sans text-ui-sm text-ink">{summaryDisplay}</p>
                {hasExtraMorph && (
                  <>
                    <div
                      className={cn(
                        'grid transition-[grid-template-rows] duration-200',
                        showFullMorph ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                      )}
                    >
                      <div className="overflow-hidden">
                        <p className="font-sans text-ui-xs text-ink/70 pt-1">{morphFull}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowFullMorph((v) => !v)}
                      className="font-sans text-ui-xs text-primary hover:text-primary/80 transition-colors mt-1"
                    >
                      {showFullMorph ? 'less ‹' : 'more ›'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-desk rounded-card p-3">
                <p className="font-sans text-ui-xs text-muted mb-1">Dict. Frequency</p>
                <p className="font-sans text-ui-sm font-semibold text-ink">
                  {wordData.dictionaryFrequency}/100
                </p>
              </div>
              <div className="bg-desk rounded-card p-3">
                <p className="font-sans text-ui-xs text-muted mb-1">Encounters</p>
                <p className="font-sans text-ui-sm font-semibold text-ink">
                  {wordData.userFrequency}×
                </p>
              </div>
            </div>

            {/* Lookup links */}
            <div className="flex items-center gap-4 pt-2 border-t border-border pb-4">
              <a
                href={wiktionaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-ui-sm text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1.5"
              >
                Wiktionary <ExternalLink size={12} />
              </a>
              <a
                href={googleTranslateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-ui-sm text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1.5"
              >
                Translate <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* MoreMenu — renders above the sheet */}
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
