'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ExternalLink, Ban, Volume2, VolumeX, LoaderCircle } from 'lucide-react';
import { VocabularyStatus } from '@/lib/types';
import type { WordData } from '@/lib/types';
import { StatusDots } from './StatusDots';
import { AdaptiveStepper } from './AdaptiveStepper';
import { cn } from '@/lib/utils';
import { useWordAudioButton } from '@/lib/hooks/useWordAudioButton';

const PEEK_HEIGHT = 264;

const MORPH_DISPLAY_KEYS = ['tense', 'mood', 'person', 'number', 'gender', 'case', 'voice', 'aspect'] as const;

const MORPH_LABELS: Record<string, string> = {
  tense: 'Tense', mood: 'Mood', person: 'Person', number: 'Number',
  gender: 'Gender', case: 'Case', voice: 'Voice', aspect: 'Aspect',
};

const STATUS_LABEL: Record<VocabularyStatus, string> = {
  [VocabularyStatus.UNKNOWN]:    'Unreviewed',
  [VocabularyStatus.NEWLY_SEEN]: 'Newly Seen',
  [VocabularyStatus.FAMILIAR]:   'Familiar',
  [VocabularyStatus.KNOWN]:      'Known',
  [VocabularyStatus.WELL_KNOWN]: 'Well Known',
  [VocabularyStatus.IGNORE]:     'Ignored',
};

const STATUS_CHIPS = [
  { status: VocabularyStatus.NEWLY_SEEN, label: 'NS',  color: 'hsl(2,75%,60%)'   },
  { status: VocabularyStatus.FAMILIAR,   label: 'Fam', color: 'hsl(32,90%,56%)'  },
  { status: VocabularyStatus.KNOWN,      label: 'Kno', color: 'hsl(78,60%,48%)'  },
  { status: VocabularyStatus.WELL_KNOWN, label: 'WKn', color: 'hsl(150,40%,42%)' },
  { status: VocabularyStatus.IGNORE,     label: 'Ign', color: 'hsl(0,0%,50%)'    },
] as const;

// ── Sub-components ────────────────────────────────────────────────────────────

function MorphChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-desk border border-border rounded-sm px-2.5 py-1.5 flex items-center gap-1">
      <span className="font-sans text-[10px] text-muted">{label}:</span>
      <span className="font-sans text-[10.5px] text-ink font-semibold">{value}</span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-desk border border-border rounded-card px-2.5 py-3 flex flex-col gap-1">
      <span className="font-sans text-[9.5px] text-muted leading-none">{label}</span>
      <span className="font-sans text-[13px] text-ink font-semibold leading-tight">{value}</span>
    </div>
  );
}

function LookupLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-1.5 h-11
                 bg-primary-05 border border-primary/20 rounded-card
                 font-sans text-ui-sm text-primary
                 hover:brightness-90 transition-all active:scale-[0.98]"
    >
      {label}
      <ExternalLink size={12} strokeWidth={1.5} />
    </a>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface MobileWordSheetProps {
  wordData: WordData | null;
  onClose: () => void;
  onStatusChange: (wordId: string, newStatus: VocabularyStatus) => void;
  onTranslationChange?: (wordId: string, newTranslation: string) => void;
  /** True on first encounter with this lemma this session — hides translation until user grades */
  isFirstTest: boolean;
  /** Called after the user grades a word, so the caller can mark the lemma as tested */
  onGraded?: (lemma: string) => void;
}

export function MobileWordSheet({
  wordData,
  onClose,
  onStatusChange,
  onTranslationChange,
  isFirstTest,
  onGraded,
}: MobileWordSheetProps) {
  const [expanded, setExpanded] = useState(false);
  const [translation, setTranslation] = useState('');
  const [dismissing, setDismissing] = useState(false);
  // True after the user grades in test mode — triggers translation fade-in before auto-dismiss
  const [translationRevealed, setTranslationRevealed] = useState(false);
  // True immediately after first-test grade — hides stepper, enlarges translation
  const [justGraded, setJustGraded] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState(false);
  const { state: audioState, play: playAudio } = useWordAudioButton(wordData?.wordId ?? '');

  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset snap state and sync translation whenever a new word is selected
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setExpanded(false);
    setDismissing(false);
    setTranslation(wordData?.translation ?? '');
    setTranslationRevealed(false);
    setJustGraded(false);
    setEditingTranslation(false);
  }, [wordData?.wordId]);

  if (!wordData) return null;

  const dismiss = () => {
    setDismissing(true);
    dismissTimerRef.current = setTimeout(onClose, 280);
  };

  // Handles grading from both AdaptiveStepper and the precise chip row.
  // Test mode: reveals translation, hides stepper, auto-dismisses on WELL_KNOWN after 1s.
  // Instant mode (re-tap) or IGNORE: dismisses immediately.
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
        setTimeout(dismiss, 1000);
      }
    } else {
      dismiss();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const delta = touchCurrentY.current - touchStartY.current;
    if (delta < -60) setExpanded(true);
    if (delta > 60) {
      if (expanded) setExpanded(false);
      else dismiss();
    }
  };

  const cleanSurface = wordData.surface.replace(/[.,!?;:«»„"]/g, '');
  const wiktionaryUrl = `https://en.wiktionary.org/wiki/${encodeURIComponent(wordData.lemma)}`;
  const googleTranslateUrl = `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(cleanSurface)}`;

  const showTranslation = !isFirstTest || translationRevealed;
  const isIgnored = wordData.status === VocabularyStatus.IGNORE;
  const showTestPrompt = isFirstTest && !isIgnored && !translationRevealed;

  const sheetStyle: React.CSSProperties = {
    height: expanded ? 'calc(90dvh)' : `${PEEK_HEIGHT}px`,
    transform: dismissing ? 'translateY(calc(100% + 16px))' : 'translateY(0)',
    transition: dismissing
      ? 'transform 0.28s ease-in'
      : 'height 0.3s cubic-bezier(0,0,.2,1)',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[2px] xl:hidden"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-label="Word details"
        aria-modal="true"
        className="fixed bottom-0 inset-x-0 z-50 bg-paper rounded-t-[14px] border-t border-border shadow-modal flex flex-col overflow-hidden xl:hidden"
        style={sheetStyle}
      >
        {/* Drag handle — tap to expand, drag to expand/collapse/dismiss */}
        <div
          className="shrink-0 flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => !expanded && setExpanded(true)}
        >
          <div className="w-8 h-1 rounded-full bg-border" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 overscroll-contain">

          {/* ① Status header: dots · label · ✕ — also a swipe/tap target to expand */}
          <div
            className="flex items-center justify-between mb-3 touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => !expanded && setExpanded(true)}
          >
            <div className="flex items-center gap-2.5">
              <StatusDots status={wordData.status} />
              <span className="font-sans text-ui-xs text-muted uppercase tracking-[0.07em] font-semibold">
                {STATUS_LABEL[wordData.status]}
              </span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); dismiss(); }}
              className="p-1 text-muted hover:text-ink transition-colors"
              aria-label="Close word details"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* ② Lemma */}
          <div className="flex items-center gap-2 mb-1">
            <p className="font-serif text-[26px] text-ink font-bold leading-tight">
              {wordData.lemma}
            </p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); playAudio(); }}
              disabled={audioState === 'loading'}
              className="text-muted hover:text-primary transition-colors p-1 shrink-0 disabled:opacity-50"
              aria-label={`Hear pronunciation of ${wordData.lemma}`}
            >
              {audioState === 'loading' ? (
                <LoaderCircle size={18} strokeWidth={1.5} className="animate-spin" />
              ) : audioState === 'error' ? (
                <VolumeX size={18} strokeWidth={1.5} />
              ) : (
                <Volume2 size={18} strokeWidth={1.5} />
              )}
            </button>
          </div>

          {/* ③ Translation — hidden in test mode; enlarged post-grade; editable in instant mode */}
          {showTranslation && (
            <div className="mb-3">
              {justGraded ? (
                <div>
                  <p className="font-serif text-2xl text-ink/65 font-normal italic leading-snug">
                    {translation || (
                      <span className="not-italic text-muted/40 text-xl">No translation</span>
                    )}
                  </p>
                  {wordData.meanings && wordData.meanings.length > 1 && (
                    <span className="font-sans text-[9.5px] text-muted/60 bg-desk border border-border rounded-sm px-1.5 py-0.5 mt-1.5 inline-block">
                      {wordData.meanings.length} meanings
                    </span>
                  )}
                </div>
              ) : !editingTranslation ? (
                <button
                  disabled={isFirstTest}
                  onClick={() => { if (!isFirstTest) setEditingTranslation(true); }}
                  className={cn('w-full text-left group', isFirstTest && 'cursor-default')}
                >
                  <p className="font-serif text-base text-ink/65 font-normal italic leading-snug">
                    {translation || (
                      <span className="not-italic font-sans font-normal text-muted/50">Add translation…</span>
                    )}
                  </p>
                  {!isFirstTest && (
                    <span className="font-sans text-[10px] text-muted/60 group-hover:text-primary transition-colors">
                      tap to edit
                    </span>
                  )}
                </button>
              ) : (
                <input
                  type="text"
                  autoFocus
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  onBlur={() => {
                    onTranslationChange?.(wordData.wordId, translation);
                    setEditingTranslation(false);
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                  className="w-full h-10 px-3 font-sans text-base text-ink
                             bg-desk border border-primary rounded-sm
                             focus:outline-none focus:ring-2 focus:ring-primary
                             transition-all"
                />
              )}
            </div>
          )}

          {/* ④ "Know this word?" prompt — test mode only */}
          {showTestPrompt && (
            <p className="font-sans text-[11px] text-muted text-center mb-2 tracking-wide">
              Know this word?
            </p>
          )}

          {/* ⑤ Grading buttons — hidden immediately after first-test grade */}
          {!justGraded && (
            <div className="mb-1.5">
              <AdaptiveStepper
                status={wordData.status}
                onStatusChange={handleGrade}
                hideMore
              />
            </div>
          )}

          {/* ⑥ Ignore ghost link — test mode, non-IGNORE words only */}
          {showTestPrompt && (
            <div className="flex justify-center mt-3 mb-2">
              <button
                onClick={() => handleGrade(VocabularyStatus.IGNORE)}
                className="flex items-center gap-1.5 font-sans text-ui-xs text-muted hover:text-ink transition-colors py-1 px-2"
              >
                <Ban size={11} strokeWidth={1.5} />
                Ignore word
              </button>
            </div>
          )}

          {/* ── Expanded content ── */}
          {expanded && (
            <>
              <div className="h-px bg-border mt-3 mb-5" />

              {/* ⑦ Precise status chips (colored dots + label) */}
              <section className="mb-5">
                <p className="font-sans text-ui-xs text-muted uppercase tracking-[0.06em] mb-2.5">
                  Set exact status
                </p>
                <div className="flex gap-1.5">
                  {STATUS_CHIPS.map(({ status, label, color }) => {
                    const isActive = wordData.status === status;
                    return (
                      <button
                        key={status}
                        onClick={() => { if (status !== wordData.status) onStatusChange(wordData.wordId, status); dismiss(); }}
                        style={{
                          borderColor: isActive ? color : 'var(--border)',
                          background: isActive ? `${color}22` : 'transparent',
                          color: isActive ? 'var(--ink)' : 'var(--muted)',
                        }}
                        className={cn(
                          'flex-1 h-8 rounded-sm font-sans text-[10px] font-medium transition-all active:scale-95 flex items-center justify-center gap-1',
                          isActive ? 'border-2 font-semibold' : 'border',
                        )}
                      >
                        {status === VocabularyStatus.WELL_KNOWN ? (
                          <span className="w-2 h-2 rounded-full shrink-0 border border-ink/70" />
                        ) : (
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: color }}
                          />
                        )}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* ⑧ All Meanings (lemma-level, from auto-translation) */}
              {wordData.meanings && wordData.meanings.length > 0 && (
                <section className="mb-5">
                  <p className="font-sans text-ui-xs text-muted uppercase tracking-[0.06em] mb-2.5">
                    All meanings
                  </p>
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
                </section>
              )}

              {/* ⑩ Morphology */}
              <section className="mb-5">
                <p className="font-sans text-ui-xs text-muted uppercase tracking-[0.06em] mb-2.5">
                  Morphology
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {wordData.pos && <MorphChip label="POS" value={wordData.pos} />}
                  <MorphChip label="Form" value={cleanSurface} />
                  {wordData.inflectionData &&
                    MORPH_DISPLAY_KEYS.filter((k) => wordData.inflectionData![k]).map((k) => (
                      <MorphChip key={k} label={MORPH_LABELS[k]} value={String(wordData.inflectionData![k])} />
                    ))}
                </div>
              </section>

              {/* ⑪ Frequency & history */}
              <section className="mb-5">
                <p className="font-sans text-ui-xs text-muted uppercase tracking-[0.06em] mb-2.5">
                  Frequency & History
                </p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <StatCard label="Dict. Freq" value={`${wordData.dictionaryFrequency}/100`} />
                  <StatCard label="Encounters" value={`${wordData.userFrequency}×`} />
                  <StatCard label="First seen" value={wordData.firstSeen ?? '—'} />
                </div>
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="font-sans text-ui-xs text-muted">Dictionary Frequency</span>
                    <span className="font-sans text-ui-xs text-ink font-medium">
                      {wordData.dictionaryFrequency}/100
                    </span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${wordData.dictionaryFrequency}%` }}
                    />
                  </div>
                </div>
              </section>

              {/* ⑫ Lookup links */}
              <section>
                <div className="grid grid-cols-2 gap-2">
                  <LookupLink href={wiktionaryUrl} label="Wiktionary" />
                  <LookupLink href={googleTranslateUrl} label="Google Translate" />
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
}
