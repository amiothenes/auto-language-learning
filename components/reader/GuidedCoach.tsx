'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, ArrowRight, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useHints } from '@/lib/hooks/useHints';
import { useIsGuest } from '@/lib/hooks/useIsGuest';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import { LibraryMapScene } from '@/components/riso/scenes/Scenes';
import type { WordInstanceItem } from '@/lib/types/api';

/**
 * The guided first read: "the boy's notebook". One small card asks for one
 * real action at a time, and only advances when the reader actually does it:
 *   tap a word → grade it → see the colours → play narration → Tutor Mode → finish.
 * It adds no reader logic. It only observes signals the reader already has
 * (word module open, status-change count, playback state, the Tutor Mode
 * setting).
 *
 * Runs on the learner's start chapter (any level), when opened with
 * ?guide=1 and the account hasn't completed it ('guided-read' hint).
 *
 * Placement never covers the word being taught:
 *  - phone/tablet portrait: a bottom sheet above the mini-player, or a slim
 *    top card while the word sheet is open (the sheet owns the bottom);
 *  - large screens: a floating card at the bottom left of the reading column.
 */

type CoachStep = 'tap' | 'grade' | 'colors' | 'play' | 'tutor' | 'finish' | 'done';
const ORDER: CoachStep[] = ['tap', 'grade', 'colors', 'play', 'tutor', 'finish'];

export interface GuidedCoachProps {
  enabled: boolean;
  languageCode: string | undefined;
  wordInstances: WordInstanceItem[] | undefined;
  isWordModuleOpen: boolean;
  /** Increments on every status change the reader makes. */
  statusChangeCount: number;
  playbackState: string;
  tutorModeEnabled: boolean;
  narrationAvailable: boolean;
  isLargeScreen: boolean;
}

export function GuidedCoach(props: GuidedCoachProps) {
  const { ready, hasSeen, markSeen } = useHints();
  if (!props.enabled || !ready || hasSeen('guided-read')) return null;
  return <Coach {...props} onComplete={() => markSeen('guided-read')} />;
}

function Coach({
  languageCode,
  wordInstances,
  isWordModuleOpen,
  statusChangeCount,
  playbackState,
  tutorModeEnabled,
  narrationAvailable,
  isLargeScreen,
  onComplete,
}: GuidedCoachProps & { onComplete: () => void }) {
  const router = useRouter();
  const isGuest = useIsGuest();
  const [step, setStep] = useState<CoachStep>('tap');
  const [dismissed, setDismissed] = useState(false);
  const [fluency, setFluency] = useState<number | null>(null);
  // Status changes made before the coach appeared don't count as "graded a word".
  const [baselineStatusCount] = useState(statusChangeCount);

  // The word to teach with: the first word the learner doesn't know yet, or
  // just the first word if they know them all (an advanced start chapter).
  const target = useMemo(() => {
    if (!wordInstances?.length) return null;
    return (
      wordInstances.find((w) => w.status === VocabularyStatus.UNKNOWN) ??
      wordInstances.find((w) => w.status === VocabularyStatus.NEWLY_SEEN) ??
      wordInstances.find((w) => w.status !== VocabularyStatus.IGNORE) ??
      null
    );
  }, [wordInstances]);

  const advance = (from: CoachStep) =>
    setStep((s) => {
      if (s !== from) return s;
      const i = ORDER.indexOf(s);
      return ORDER[i + 1] ?? 'done';
    });

  // ── Advance on real actions ───────────────────────────────────────────────
  // Derived during render (React's "adjust state when props change" pattern)
  // rather than in effects: a step is complete the moment the reader's own
  // signal says so. Loops so several satisfied steps can resolve at once,
  // for example Tutor Mode already being on.
  let resolved = step;
  for (;;) {
    const before = resolved;
    if (resolved === 'tap' && isWordModuleOpen) resolved = 'grade';
    else if (resolved === 'grade' && statusChangeCount > baselineStatusCount) resolved = 'colors';
    else if ((resolved === 'play' || resolved === 'tutor') && !narrationAvailable) resolved = 'finish';
    else if (resolved === 'play' && playbackState === 'playing') resolved = 'tutor';
    else if (resolved === 'tutor' && tutorModeEnabled) resolved = 'finish';
    if (resolved === before) break;
  }
  if (resolved !== step) setStep(resolved);

  // ── Glow on the target word ───────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'tap' || !target) return;
    const el = document.querySelector<HTMLElement>(`[data-word-instance-id="${CSS.escape(target.instanceId)}"]`);
    if (!el) return;
    el.classList.add('coach-glow');
    el.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    return () => el.classList.remove('coach-glow');
  }, [step, target]);

  // ── Done: show the new Fluency ────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'done' || !languageCode) return;
    fetch(`/api/stats?languageCode=${encodeURIComponent(languageCode)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => typeof s?.readingCoverage === 'number' && setFluency(s.readingCoverage))
      .catch(() => {});
  }, [step, languageCode]);

  if (dismissed) return null;

  const skip = () => {
    onComplete();
    setDismissed(true);
  };

  const cards: Record<Exclude<CoachStep, 'done'>, { title: string; body: string; action?: { label: string; onClick: () => void } }> = {
    tap: {
      title: 'Tap the glowing word',
      body: target
        ? 'Every word you don’t know yet is a small locked door. Tap it to see what it means and how it’s used here.'
        : 'Tap any word to see what it means and how it’s used here.',
    },
    grade: {
      title: 'How well do you know it?',
      body: 'Pick a level, from New to Known. Words you know count toward your Fluency, the share of everyday text you can read.',
    },
    colors: {
      title: 'Colours are your map',
      body: 'Blue: new to you. Red: just met. Orange: getting familiar. Green: known. A word keeps its colour on every page, in every text. More green, more Fluency.',
      action: { label: 'Got it', onClick: () => advance('colors') },
    },
    play: {
      title: 'Press play to hear the page',
      body: isLargeScreen
        ? 'Use ▶ in the player on the right. Each word lights up as it’s spoken.'
        : 'Use ▶ in the player at the bottom. Each word lights up as it’s spoken.',
      action: { label: 'Skip audio', onClick: () => setStep('finish') },
    },
    tutor: {
      title: 'Now try Tutor Mode',
      body: 'Switch on “Tutor” next to the play button. Narration will pause on words you don’t know yet and ask you about them, like a patient librarian.',
      action: { label: 'Not now', onClick: () => advance('tutor') },
    },
    finish: {
      title: 'Read to the end of the page',
      body: 'Tap any word you’re unsure of. Every word you learn lights another lamp in the library.',
      action: { label: 'I finished the page', onClick: () => advance('finish') },
    },
  };

  // ── Completion card ───────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-ink/30 backdrop-blur-sm p-0 md:p-6" role="dialog" aria-modal="true" aria-labelledby="coach-done-title">
        <div className="w-full md:max-w-md bg-paper border border-border rounded-t-2xl md:rounded-card shadow-modal overflow-hidden animate-slide-up pb-[env(safe-area-inset-bottom)]">
          <div className="bg-desk border-b border-border">
            <LibraryMapScene litRooms={1} currentRoom={0} className="max-h-48" />
          </div>
          <div className="p-5 md:p-6 space-y-3">
            <h2 id="coach-done-title" className="font-sans text-2xl font-bold text-ink">You read your first page.</h2>
            <p className="font-sans text-ui-base text-muted">
              {fluency !== null ? (
                <>Your Fluency is now <strong className="text-primary">{Math.round(fluency)}%</strong>. </>
              ) : null}
              Come back tomorrow and Review will bring back the words you met today, just before you’d forget them.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
              <Button variant="secondary" onClick={() => { onComplete(); router.push('/dashboard'); }}>
                Go to Today
              </Button>
              {isGuest ? (
                <Link
                  href="/signup"
                  onClick={onComplete}
                  className="inline-flex items-center justify-center gap-2 font-sans font-medium rounded bg-primary text-white px-5 py-2.5 text-ui-base shadow-raised hover:brightness-90 transition-all"
                >
                  <KeyRound size={16} strokeWidth={2} /> Save your library
                </Link>
              ) : (
                <Button onClick={() => { onComplete(); setDismissed(true); }} rightIcon={<ArrowRight size={16} strokeWidth={2} />}>
                  Keep reading
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const card = cards[step];
  const stepNo = ORDER.indexOf(step) + 1;
  // While the word sheet owns the bottom of a small screen, move to the top.
  const atTop = !isLargeScreen && isWordModuleOpen;

  return (
    <aside
      aria-live="polite"
      aria-label="Guided first read"
      className={cn(
        'fixed z-[55] bg-paper border border-border shadow-modal transition-all duration-300',
        // Phone/tablet: full-width card above the bottom player (or at the top).
        'left-3 right-3 rounded-card',
        atTop ? 'top-3' : 'bottom-[calc(5rem+env(safe-area-inset-bottom))]',
        // ≥1024px: floating card, bottom left of the reading column; past the
        // 280px text-info sidebar on xl.
        'lg:top-auto lg:bottom-6 lg:right-auto lg:left-6 lg:w-80 xl:left-[304px]'
      )}
    >
      {/* the notebook's ruled margin */}
      <div className="absolute inset-y-0 left-0 w-1 rounded-l-card bg-riso-coral/70" aria-hidden="true" />
      <div className="p-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <p className="font-sans text-ui-xs uppercase tracking-wide text-muted">
            The boy’s notebook · {stepNo}/{ORDER.length}
          </p>
          <button onClick={skip} className="-m-1 p-1 text-muted hover:text-ink rounded cursor-pointer" aria-label="Skip the guided read">
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
        <h2 className="mt-1 font-sans text-ui-lg font-semibold text-ink">{card.title}</h2>
        {!atTop && <p className="mt-1 font-sans text-ui-sm text-muted leading-relaxed">{card.body}</p>}
        {card.action && (
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant={step === 'colors' || step === 'finish' ? 'primary' : 'ghost'} onClick={card.action.onClick}>
              {card.action.label}
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
