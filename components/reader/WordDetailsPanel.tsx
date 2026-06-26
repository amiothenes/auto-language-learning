'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink } from 'lucide-react';
import { VocabularyStatus } from '@/lib/types';
import type { WordData } from '@/lib/types';
import { Muted } from '@/components/ui/Typography';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusDots } from './StatusDots';
import { AdaptiveStepper } from './AdaptiveStepper';
import { MoreMenu } from './MoreMenu';
import { cn } from '@/lib/utils';

const MORPH_DISPLAY_KEYS = ['tense', 'mood', 'person', 'number', 'gender', 'case', 'voice', 'aspect'] as const;
const MORPH_LABELS: Record<string, string> = {
  tense: 'Tense', mood: 'Mood', person: 'Person', number: 'Number',
  gender: 'Gender', case: 'Case', voice: 'Voice', aspect: 'Aspect',
};

function MorphChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-desk border border-border rounded-sm px-2.5 py-1.5 flex items-center gap-1">
      <span className="font-sans text-[10px] text-muted">{label}:</span>
      <span className="font-sans text-[10.5px] text-ink font-semibold">{value}</span>
    </div>
  );
}

// ============================================================================
// WordDetailsPanel — centered modal overlay with full word info.
// Opened via "More →" in WordTooltip. Closes via X, Esc, or backdrop click.
// ============================================================================

interface WordDetailsPanelProps {
  wordData: WordData | null;
  onClose: () => void;
  onStatusChange?: (wordId: string, newStatus: VocabularyStatus) => void;
  onTranslationChange?: (wordId: string, newTranslation: string) => void;
}

export function WordDetailsPanel({
  wordData,
  onClose,
  onStatusChange,
  onTranslationChange,
}: WordDetailsPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [translation, setTranslation] = useState(wordData?.translation ?? '');
  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState<HTMLButtonElement | null>(null);

  // SSR guard for portal
  useEffect(() => { setMounted(true); }, []);

  // Sync translation state when a different word is opened
  useEffect(() => {
    setTranslation(wordData?.translation ?? '');
    setIsExiting(false);
  }, [wordData?.wordId]);

  // Body scroll lock — save and restore previous value for safe stacking
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  // Esc key dismiss
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleClose]);

  if (!mounted || !wordData) return null;

  const cleanSurface = wordData.surface.replace(/[.,!?;:«»„"]/g, '');
  const wiktionaryUrl = `https://en.wiktionary.org/wiki/${encodeURIComponent(wordData.lemma)}`;
  const googleTranslateUrl = `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(cleanSurface)}`;

  const morphData = wordData.inflectionData as Record<string, unknown> | null | undefined;
  const hasMorphology = morphData != null && MORPH_DISPLAY_KEYS.some((k) => Boolean(morphData[k]));

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-ink/40',
          isExiting ? 'animate-fade-out' : 'animate-modal-backdrop-enter',
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Word details for ${wordData.lemma}`}
          className={cn(
            'w-full max-w-md max-h-[85dvh] bg-paper rounded-card shadow-modal flex flex-col pointer-events-auto overflow-hidden',
            isExiting ? 'animate-fade-out' : 'animate-modal-enter',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
            <div className="flex-1 min-w-0 pr-3">
              <p className="font-serif text-[22px] font-bold text-ink leading-tight truncate">
                {wordData.lemma}
              </p>
              <p className="font-sans text-sm text-muted mt-0.5">
                {cleanSurface !== wordData.lemma ? `${cleanSurface} · ` : ''}{wordData.pos}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 pt-1">
              <StatusDots status={wordData.status} />
              <button
                onClick={handleClose}
                className="text-muted hover:text-ink transition-colors p-0.5 cursor-pointer"
                aria-label="Close word details"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 overscroll-contain">

            {/* Translation */}
            <div>
              <Muted className="text-ui-xs mb-1.5">Translation</Muted>
              <Input
                type="text"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                onBlur={() => { onTranslationChange?.(wordData.wordId, translation); }}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                placeholder="Add translation…"
              />
            </div>

            {/* Learning Status */}
            <div className="border-t border-border pt-4">
              <Muted className="text-ui-xs mb-2.5">Learning Status</Muted>
              <AdaptiveStepper
                status={wordData.status}
                onStatusChange={(newStatus) => { onStatusChange?.(wordData.wordId, newStatus); }}
                onMoreClick={(el) => setMoreMenuAnchorEl(el)}
              />
            </div>

            {/* Morphology chips */}
            {hasMorphology && morphData && (
              <div className="border-t border-border pt-4">
                <Muted className="text-ui-xs mb-2.5">Morphology</Muted>
                <div className="flex flex-wrap gap-1.5">
                  {wordData.pos && <MorphChip label="POS" value={wordData.pos} />}
                  {cleanSurface !== wordData.lemma && <MorphChip label="Form" value={cleanSurface} />}
                  {MORPH_DISPLAY_KEYS.filter((k) => morphData[k]).map((k) => (
                    <MorphChip key={k} label={MORPH_LABELS[k]} value={String(morphData[k])} />
                  ))}
                </div>
              </div>
            )}

            {/* All Meanings (lemma-level, from auto-translation) */}
            {wordData.meanings && wordData.meanings.length > 0 && (
              <div className="border-t border-border pt-4">
                <Muted className="text-ui-xs mb-2.5">All meanings of &ldquo;{wordData.lemma}&rdquo;</Muted>
                <div className="space-y-2">
                  {wordData.meanings.map((m, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="font-sans text-[9.5px] text-muted bg-desk border border-border rounded-sm px-1.5 py-0.5 shrink-0 uppercase tracking-wide mt-0.5">
                        {m.pos}
                      </span>
                      <span className="font-sans text-sm text-ink/80 leading-snug">
                        {m.definitions.slice(0, 3).join(', ')}
                      </span>
                    </div>
                  ))}
                </div>

                {wordData.exampleSentence && (
                  <div className="mt-3 pl-2 border-l-2 border-border">
                    <p className="font-sans text-xs text-ink/70 italic leading-relaxed">
                      {wordData.exampleSentence}
                    </p>
                    {wordData.exampleSentenceTranslation && (
                      <p className="font-sans text-xs text-muted leading-relaxed mt-0.5">
                        {wordData.exampleSentenceTranslation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Frequencies */}
            <div className="border-t border-border pt-4 space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <Muted className="text-ui-xs">Dictionary Frequency</Muted>
                  <span className="font-sans text-ui-sm text-ink font-medium">
                    {wordData.dictionaryFrequency}/100
                  </span>
                </div>
                <ProgressBar value={wordData.dictionaryFrequency} max={100} />
              </div>
              <div className="flex justify-between items-center">
                <Muted className="text-ui-xs">Your Encounters</Muted>
                <span className="font-sans text-ui-sm text-ink font-medium">
                  {wordData.userFrequency} times
                </span>
              </div>
            </div>

          </div>

          {/* ── Footer: lookup links ── */}
          <div className="shrink-0 px-5 py-3 border-t border-border flex items-center justify-center gap-6">
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

      {/* MoreMenu — inside same portal fragment so z-index stacks above modal */}
      {moreMenuAnchorEl && (
        <MoreMenu
          anchorEl={moreMenuAnchorEl}
          currentStatus={wordData.status}
          onStatusChange={(newStatus) => {
            onStatusChange?.(wordData.wordId, newStatus);
            setMoreMenuAnchorEl(null);
          }}
          onClose={() => setMoreMenuAnchorEl(null)}
        />
      )}
    </>,
    document.body
  );
}
