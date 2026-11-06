'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Glyph, hasGlyph } from '@/components/riso/glyphs/Glyphs';
import { PRESET_LANGUAGES } from '@/lib/languages/presets';
import type { ClientOnboardingContent } from '@/lib/onboarding/types';
import type { PlacementLevel, ComprehensionAnswer } from '@/lib/onboarding/placement';
import { StepHeading } from './OnboardingShell';

// ─── Speech (browser TTS: free, instant, no word ids needed yet) ─────────────

export function speak(text: string, langTag: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langTag;
    u.rate = 0.85;
    synth.speak(u);
  } catch {
    // No speech support: cards still work silently.
  }
}

export function ttsTagFor(code: string): string {
  return PRESET_LANGUAGES.find((l) => l.code === code)?.ttsCode ?? code;
}

// ─── Language ───────────────────────────────────────────────────────────────

export function LanguageStep({ value, onChange }: { value: string | null; onChange: (code: string) => void }) {
  return (
    <>
      <StepHeading title="Which library do you want to open?" lead="Pick the language you're learning. You can add more later." />
      <div className="grid grid-cols-2 gap-3">
        {PRESET_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => onChange(lang.code)}
            aria-pressed={value === lang.code}
            className={cn(
              'relative flex flex-col items-center gap-2 p-5 min-h-[96px] rounded-card border transition-all cursor-pointer',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              value === lang.code
                ? 'border-primary bg-primary/5 shadow-raised-hover'
                : 'border-border bg-paper hover:border-primary/40 hover:bg-desk shadow-raised'
            )}
          >
            <span className="text-3xl" aria-hidden="true">{lang.flag}</span>
            <span className="font-sans text-ui-base font-medium text-ink">{lang.name}</span>
            {value === lang.code && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-riso-coral" aria-hidden="true" />}
          </button>
        ))}
      </div>
    </>
  );
}

// ─── Gate ───────────────────────────────────────────────────────────────────

/**
 * "Absolute beginner?" The Yes button is in English (a true beginner can't
 * read the target language yet). The No button is in the target language, and
 * being able to read it is itself a gentle filter.
 */
export function GateStep({
  languageName,
  content,
  onBeginner,
  onNotBeginner,
}: {
  languageName: string;
  content: ClientOnboardingContent | null;
  onBeginner: () => void;
  onNotBeginner: () => void;
}) {
  return (
    <>
      <StepHeading
        title={`Is this your very first page of ${languageName}?`}
        lead="Either way, you'll be reading a real page of the story in a couple of minutes."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <ChoiceCard title="Yes, I'm brand new" body="Start with ten first words, then read your first page." onClick={onBeginner} />
        <ChoiceCard
          title={content?.gate.noButton ?? 'No, I know some'}
          titleLang={content?.language}
          body="Tap the words you know and we'll find your level in about a minute."
          onClick={onNotBeginner}
          accent
        />
      </div>
    </>
  );
}

function ChoiceCard({
  title,
  titleLang,
  body,
  onClick,
  accent = false,
}: {
  title: string;
  titleLang?: string;
  body: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-left p-5 min-h-[112px] rounded-card border bg-paper shadow-raised transition-all cursor-pointer',
        'hover:shadow-raised-hover hover:border-primary/40 active:translate-y-px',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        accent ? 'border-primary/30' : 'border-border'
      )}
    >
      <span lang={titleLang} className={cn('block font-sans text-ui-lg font-semibold', accent ? 'text-primary' : 'text-ink')}>
        {title}
      </span>
      <span className="block mt-1.5 font-sans text-ui-sm text-muted">{body}</span>
    </button>
  );
}

// ─── First words (beginner) ─────────────────────────────────────────────────

/**
 * Ten picture cards, Chapter 1's words. Tap to flip (word → meaning), and the
 * word is spoken. All ten flipped unlocks "Read my first page", but the learner
 * can move on any time.
 */
export function FirstWordsStep({
  content,
  flipped,
  onFlip,
}: {
  content: ClientOnboardingContent;
  flipped: Set<string>;
  onFlip: (lemma: string) => void;
}) {
  const tag = ttsTagFor(content.language);
  return (
    <>
      <StepHeading
        title="Your first ten words"
        lead={`Tap each card to hear it and see what it means. These are the words of Chapter 1: "${content.firstChapter.title}".`}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {content.firstWords.map((w) => {
          const on = flipped.has(w.lemma);
          const article = w.gender === 'm' ? 'el' : w.gender === 'f' ? 'la' : null;
          return (
            <button
              key={w.lemma}
              type="button"
              aria-pressed={on}
              aria-label={on ? `${w.lemma}: ${w.gloss}` : `${w.lemma}, tap to hear it and see its meaning`}
              onClick={() => {
                speak(article ? `${article} ${w.lemma}` : w.lemma, tag);
                onFlip(w.lemma);
              }}
              className={cn(
                'relative flex flex-col items-center justify-between gap-2 p-3 aspect-[4/5] rounded-card border bg-paper shadow-raised transition-all cursor-pointer',
                'hover:shadow-raised-hover active:translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                on ? 'border-primary/40' : 'border-border'
              )}
            >
              <span className="flex-1 flex items-center justify-center">
                {hasGlyph(w.conceptId) ? (
                  <Glyph conceptId={w.conceptId} size={72} />
                ) : (
                  <span className="font-serif text-4xl text-primary">{w.lemma.slice(0, 1)}</span>
                )}
              </span>
              <span className="text-center leading-tight">
                <span lang={content.language} className="block font-serif text-ui-lg text-ink">
                  {article && <span className="text-muted">{article} </span>}
                  {w.lemma}
                </span>
                <span
                  className={cn('block font-sans text-ui-sm transition-opacity duration-200', on ? 'text-primary opacity-100' : 'opacity-0')}
                  aria-hidden={!on}
                >
                  {w.gloss}
                </span>
              </span>
              <Volume2 size={14} strokeWidth={1.5} className="absolute top-2 right-2 text-muted" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </>
  );
}

// ─── Self level pick ────────────────────────────────────────────────────────

const LEVEL_CARDS: Array<{ level: PlacementLevel | null; title: string; body: string }> = [
  { level: null, title: 'Brand new', body: 'I know a handful of words at most.' },
  { level: 'A1', title: 'A1 · First steps', body: 'Greetings, numbers, simple sentences.' },
  { level: 'A2', title: 'A2 · Getting around', body: 'Everyday topics, short simple texts.' },
  { level: 'B1', title: 'B1 · Conversational', body: 'I follow most everyday texts.' },
  { level: 'B2', title: 'B2 · Confident', body: 'Articles and novels with some effort.' },
  { level: 'C1', title: 'C1 · Advanced', body: 'Most things, including nuance.' },
  { level: 'C2', title: 'C2 · Near-native', body: 'Almost anything at all.' },
];

export function LevelPickStep({
  value,
  onChange,
}: {
  value: PlacementLevel | null | undefined;
  onChange: (level: PlacementLevel | null) => void;
}) {
  return (
    <>
      <StepHeading title="Where would you place yourself?" lead="A rough guess is fine. You can retake placement any time in Settings." />
      <div className="grid gap-2.5 sm:grid-cols-2">
        {LEVEL_CARDS.map((c) => (
          <button
            key={c.title}
            type="button"
            aria-pressed={value === c.level}
            onClick={() => onChange(c.level)}
            className={cn(
              'text-left px-4 py-3 min-h-[64px] rounded-card border transition-all cursor-pointer',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              value === c.level ? 'border-primary bg-primary/5 shadow-raised-hover' : 'border-border bg-paper hover:border-primary/40 shadow-raised'
            )}
          >
            <span className="block font-sans text-ui-base font-semibold text-ink">{c.title}</span>
            <span className="block font-sans text-ui-sm text-muted">{c.body}</span>
          </button>
        ))}
      </div>
    </>
  );
}

// ─── Comprehension check ────────────────────────────────────────────────────

export function ComprehensionStep({
  content,
  level,
  attempt,
  onAnswer,
}: {
  content: ClientOnboardingContent;
  level: PlacementLevel;
  attempt: number;
  onAnswer: (a: ComprehensionAnswer) => void;
}) {
  const excerpt = content.excerpts[level];
  return (
    <>
      <StepHeading
        title={attempt === 0 ? 'One quick check' : "Let's try an easier page"}
        lead="Read this page from the story. No need to know every word: do you get the gist?"
      />
      <article className="rounded-card border border-border bg-paper p-5 md:p-6 shadow-raised mb-6">
        <p className="font-sans text-ui-xs uppercase tracking-wide text-muted mb-2">
          {excerpt.title} <span className="normal-case tracking-normal">· {excerpt.titleEn}</span>
        </p>
        <div lang={content.language} className="font-serif text-content-base md:text-content-lg text-ink leading-relaxed space-y-3">
          {excerpt.text.split(/\n\s*\n/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </article>
      <p lang={content.language} className="font-serif text-xl text-primary italic mb-3">
        {content.gate.understandQuestion}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ['yes', content.gate.yes, 'I follow it'],
            ['somewhat', content.gate.somewhat, 'Partly'],
            ['no', content.gate.no, "I'm lost"],
          ] as const
        ).map(([a, label, hint]) => (
          <button
            key={a}
            type="button"
            onClick={() => onAnswer(a)}
            className="min-h-[64px] px-2 py-2 rounded-card border border-border bg-paper shadow-raised hover:shadow-raised-hover hover:border-primary/40 active:translate-y-px transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <span lang={content.language} className="block font-sans text-ui-base font-semibold text-ink">{label}</span>
            <span className="block font-sans text-ui-xs text-muted">{hint}</span>
          </button>
        ))}
      </div>
    </>
  );
}

// ─── Seeding ────────────────────────────────────────────────────────────────

const SEEDING_LINES = ['Dusting the shelves…', 'Lighting the lamps you already know…', 'Marking your place in the story…'];

export function SeedingStep({ libraryName, error, onRetry }: { libraryName: string; error: string | null; onRetry: () => void }) {
  const [line, setLine] = useState(0);
  useEffect(() => {
    if (error) return;
    const t = setInterval(() => setLine((l) => Math.min(l + 1, SEEDING_LINES.length - 1)), 1800);
    return () => clearInterval(t);
  }, [error]);
  return (
    <div className="py-6 text-center" aria-live="polite">
      <h1 className="font-sans text-2xl md:text-3xl font-bold text-ink">Stocking your library</h1>
      <p className="font-serif text-xl text-primary italic mt-1">{libraryName}</p>
      {error ? (
        <div className="mt-6 space-y-3">
          <p className="font-sans text-ui-base text-danger" role="alert">{error}</p>
          <Button variant="secondary" leftIcon={<RotateCcw size={16} strokeWidth={2} />} onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : (
        <p className="font-sans text-ui-base text-muted mt-6 animate-pulse">{SEEDING_LINES[line]}</p>
      )}
    </div>
  );
}

// ─── Reveal ─────────────────────────────────────────────────────────────────

/** Count up from 0 to `to` (instant under reduced motion). */
export function useCountUp(to: number, ms = 1400) {
  const [v, setV] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      raf.current = requestAnimationFrame(() => setV(to));
      return () => cancelAnimationFrame(raf.current);
    }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [to, ms]);
  return v;
}
