'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { PRESET_LANGUAGES } from '@/lib/languages/presets';
import { OnboardingShell, StepHeading } from '@/components/onboarding/OnboardingShell';
import { WordPicker, type PickerResult } from '@/components/onboarding/WordPicker';
import {
  LanguageStep,
  GateStep,
  FirstWordsStep,
  LevelPickStep,
  ComprehensionStep,
  SeedingStep,
  useCountUp,
} from '@/components/onboarding/Steps';
import { DoorScene, ShelvesScene, LanternScene, LibraryMapScene } from '@/components/riso/scenes/Scenes';
import { NewTextModal } from '@/components/texts/NewTextModal';
import type { ClientOnboardingContent, OnboardingPathChoice } from '@/lib/onboarding/types';
import {
  estimatePlacement,
  adjustForComprehension,
  stepUpEstimate,
  PLACEMENT_LEVELS,
  type PlacementEstimate,
  type PlacementLevel,
  type ComprehensionAnswer,
} from '@/lib/onboarding/placement';
import type { OnboardingCompleteRequest, OnboardingCompleteResponse } from '@/app/api/onboarding/complete/route';
import type { LanguageItem } from '@/lib/types/api';

type Step = 'language' | 'gate' | 'firstWords' | 'picker' | 'levelPick' | 'check' | 'harder' | 'seeding' | 'reveal';

const DOT: Record<Step, number> = {
  language: 0,
  gate: 0,
  firstWords: 1,
  picker: 1,
  levelPick: 1,
  check: 1,
  harder: 1,
  seeding: 2,
  reveal: 3,
};

/** Picker "That's enough →" unlocks after this many picks or seconds. */
const MIN_PICKS = 8;
const MIN_SECONDS = 20;

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-desk" />}>
      <OnboardingWizard />
    </Suspense>
  );
}

function OnboardingWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const { languages, isLoading: languagesLoading, setSelectedLanguage } = useLanguage();

  const fromSettings = params.get('from') === 'settings';
  const languageIdParam = params.get('languageId');

  const [step, setStep] = useState<Step>(languageIdParam ? 'gate' : 'language');
  const [langCode, setLangCode] = useState<string | null>(null);
  const [language, setLanguage] = useState<LanguageItem | null>(null);
  const [content, setContent] = useState<ClientOnboardingContent | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Path state
  const [path, setPath] = useState<OnboardingPathChoice | null>(null);
  const [flipped, setFlipped] = useState<Set<string>>(() => new Set());
  const [picker, setPicker] = useState<PickerResult | null>(null);
  const [pickerStart] = useState(() => Date.now());
  const [pickerUnlocked, setPickerUnlocked] = useState(false);
  const [estimate, setEstimate] = useState<PlacementEstimate | null>(null);
  const [checkAttempt, setCheckAttempt] = useState(0);
  const [selfLevel, setSelfLevel] = useState<PlacementLevel | null | undefined>(undefined);

  // Result
  const [result, setResult] = useState<OnboardingCompleteResponse | null>(null);
  const [fluency, setFluency] = useState<number | null>(null);
  const [textModalOpen, setTextModalOpen] = useState(false);
  const seedPromise = useRef<Promise<OnboardingCompleteResponse> | null>(null);
  const lastSeedBody = useRef<Omit<OnboardingCompleteRequest, 'languageId'> | null>(null);

  // ── Resolve the language when entered from Settings (?languageId=…) ───────
  useEffect(() => {
    if (!languageIdParam || language || languagesLoading) return;
    const found = languages.find((l) => l.id === languageIdParam);
    if (found) {
      setLanguage(found);
      setLangCode(found.code);
    } else {
      setStep('language');
    }
  }, [languageIdParam, language, languages, languagesLoading]);

  // ── Load the client content slice once the language is known ─────────────
  useEffect(() => {
    if (!language) return;
    let cancelled = false;
    setContent(undefined);
    fetch(`/api/onboarding/content?lang=${encodeURIComponent(language.code)}`)
      .then((r) => (r.ok ? r.json() : { content: null }))
      .then((j: { content: ClientOnboardingContent | null }) => !cancelled && setContent(j.content))
      .catch(() => !cancelled && setContent(null));
    return () => {
      cancelled = true;
    };
  }, [language]);

  // ── Picker unlock timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'picker' || pickerUnlocked) return;
    const left = Math.max(0, MIN_SECONDS * 1000 - (Date.now() - pickerStart));
    const t = setTimeout(() => setPickerUnlocked(true), left);
    return () => clearTimeout(t);
  }, [step, pickerUnlocked, pickerStart]);
  const pickedCount = picker?.ticked.length ?? 0;
  const canFinishPicker = pickerUnlocked || pickedCount >= MIN_PICKS;

  // ── Actions ───────────────────────────────────────────────────────────────

  async function confirmLanguage() {
    if (!langCode) return;
    setBusy(true);
    setError(null);
    try {
      let lang = languages.find((l) => l.code === langCode) ?? null;
      if (!lang) {
        const preset = PRESET_LANGUAGES.find((l) => l.code === langCode)!;
        const res = await fetch('/api/languages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: preset.code,
            name: preset.name,
            isRTL: preset.rtl,
            googleTTSCode: preset.ttsCode,
            includeForeignScript: preset.includeForeignScript,
          }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? 'Could not set up that language.');
        }
        lang = ((await res.json()) as { language: LanguageItem }).language;
        await queryClient.invalidateQueries({ queryKey: ['languages'] });
      }
      setSelectedLanguage(lang.code);
      setLanguage(lang);
      setStep('gate');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const seed = useCallback(
    (body: Omit<OnboardingCompleteRequest, 'languageId'>): Promise<OnboardingCompleteResponse> => {
      if (!language) return Promise.reject(new Error('No language'));
      return fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, languageId: language.id }),
      }).then(async (res) => {
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error ?? 'Could not stock your library.');
        }
        return res.json() as Promise<OnboardingCompleteResponse>;
      });
    },
    [language]
  );

  function chooseBeginner() {
    setPath('beginner');
    if (content) {
      // Seed in the background while the learner flips their first cards.
      seedPromise.current = seed({ path: 'beginner', learnedCount: content.firstWords.length });
      setStep('firstWords');
    } else {
      void runSeeding({ path: 'beginner' });
    }
  }

  function chooseNotBeginner() {
    if (content) {
      setPath('placement');
      setStep('picker');
    } else {
      setPath('self');
      setStep('levelPick');
    }
  }

  function finishPicker() {
    if (!picker) return;
    const est = estimatePlacement(picker.bands, picker.decoys);
    setEstimate(est);
    if (est.level === null) {
      // Too few words known for a passage: start at Chapter 1 with what they ticked.
      void runSeeding({ path: 'placement', bandRates: est.bandRates, ticked: picker.ticked, shownUnticked: picker.shownUnticked });
    } else {
      setCheckAttempt(0);
      setStep('check');
    }
  }

  function answerCheck(answer: ComprehensionAnswer) {
    if (!estimate || !picker) return;
    if (answer === 'yes' && checkAttempt === 0 && estimate.level !== 'C2') {
      setStep('harder');
      return;
    }
    const r = adjustForComprehension(estimate, answer, checkAttempt);
    setEstimate(r.estimate);
    if (r.adjusted && !r.done && r.estimate.level) {
      setCheckAttempt((n) => n + 1);
      return; // show an easier page
    }
    void runSeeding({ path: 'placement', bandRates: r.estimate.bandRates, ticked: picker.ticked, shownUnticked: picker.shownUnticked });
  }

  function tryHarder() {
    if (!estimate) return;
    setEstimate(stepUpEstimate(estimate));
    setCheckAttempt(1);
    setStep('check');
  }

  function startHere() {
    if (!estimate || !picker) return;
    void runSeeding({ path: 'placement', bandRates: estimate.bandRates, ticked: picker.ticked, shownUnticked: picker.shownUnticked });
  }

  async function runSeeding(body: Omit<OnboardingCompleteRequest, 'languageId'>, reuse = false) {
    lastSeedBody.current = body;
    setStep('seeding');
    setError(null);
    try {
      const promise = reuse && seedPromise.current ? seedPromise.current : seed(body);
      seedPromise.current = promise;
      const res = await promise;
      setResult(res);
      // Show the real Fluency number, the same one the dashboard will show.
      const stats = await fetch(`/api/stats?languageCode=${encodeURIComponent(language!.code)}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      setFluency(typeof stats?.readingCoverage === 'number' ? stats.readingCoverage : res.fluency);
      setStep('reveal');
    } catch (e) {
      seedPromise.current = null;
      setError(e instanceof Error ? e.message : 'Could not stock your library.');
    }
  }

  async function finish(destination: string) {
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({ data: { onboardingComplete: true } });
      if (language) setSelectedLanguage(language.code);
      await queryClient.invalidateQueries();
      router.replace(destination);
    } finally {
      setBusy(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const languageName = language?.name ?? PRESET_LANGUAGES.find((l) => l.code === langCode)?.name ?? 'your language';
  const dot = DOT[step];

  if (step === 'language') {
    return (
      <OnboardingShell
        scene={<DoorScene />}
        step={dot}
        actions={
          <Button size="lg" className="w-full sm:w-auto" disabled={!langCode || busy} onClick={confirmLanguage} rightIcon={<ArrowRight size={18} strokeWidth={2} />}>
            {busy ? 'Opening the door…' : 'Open the door'}
          </Button>
        }
      >
        <LanguageStep value={langCode} onChange={setLangCode} />
        {error && <p className="mt-4 font-sans text-ui-sm text-danger" role="alert">{error}</p>}
      </OnboardingShell>
    );
  }

  if (!language || content === undefined) {
    return <OnboardingShell scene={<DoorScene />} step={dot}><p className="font-sans text-ui-base text-muted animate-pulse">Finding the key…</p></OnboardingShell>;
  }

  if (step === 'gate') {
    return (
      <OnboardingShell scene={<DoorScene />} step={dot}>
        <GateStep languageName={languageName} content={content} onBeginner={chooseBeginner} onNotBeginner={chooseNotBeginner} />
      </OnboardingShell>
    );
  }

  if (step === 'firstWords' && content) {
    const all = flipped.size >= content.firstWords.length;
    return (
      <OnboardingShell
        step={dot}
        wide
        actions={
          <Button
            size="lg"
            className="w-full sm:w-auto"
            variant={all ? 'primary' : 'secondary'}
            onClick={() => runSeeding({ path: 'beginner', learnedCount: content.firstWords.length }, true)}
            rightIcon={<BookOpen size={18} strokeWidth={2} />}
          >
            {all ? 'Read my first page' : `Read my first page (${flipped.size}/${content.firstWords.length} seen)`}
          </Button>
        }
      >
        <FirstWordsStep
          content={content}
          flipped={flipped}
          onFlip={(l) => setFlipped((prev) => new Set(prev).add(l))}
        />
      </OnboardingShell>
    );
  }

  if (step === 'picker' && content) {
    return (
      <OnboardingShell
        step={dot}
        wide
        actions={
          <>
            <Button variant="ghost" onClick={() => { setPath('self'); setStep('levelPick'); }}>
              I&apos;d rather choose a level
            </Button>
            <Button size="lg" className="w-full sm:w-auto" disabled={!canFinishPicker} onClick={finishPicker} rightIcon={<ArrowRight size={18} strokeWidth={2} />}>
              {canFinishPicker ? "That's enough" : `Keep tapping (${pickedCount}/${MIN_PICKS})`}
            </Button>
          </>
        }
      >
        <StepHeading
          title="Tap every word you know"
          lead="Swipe the rows: they get harder as you go down. A tapped word flips to its meaning, so you can check yourself. Not sure? Leave it."
        />
        <WordPicker content={content} onChange={setPicker} />
      </OnboardingShell>
    );
  }

  if (step === 'levelPick') {
    return (
      <OnboardingShell
        scene={<ShelvesScene lit={0.25} />}
        step={dot}
        actions={
          <Button
            size="lg"
            className="w-full sm:w-auto"
            disabled={selfLevel === undefined}
            onClick={() => runSeeding({ path: 'self', level: selfLevel ?? null })}
            rightIcon={<ArrowRight size={18} strokeWidth={2} />}
          >
            Continue
          </Button>
        }
      >
        <LevelPickStep value={selfLevel} onChange={setSelfLevel} />
      </OnboardingShell>
    );
  }

  if (step === 'check' && content && estimate?.level) {
    return (
      <OnboardingShell scene={<LanternScene />} step={dot}>
        <ComprehensionStep content={content} level={estimate.level} attempt={checkAttempt} onAnswer={answerCheck} />
      </OnboardingShell>
    );
  }

  if (step === 'harder') {
    return (
      <OnboardingShell
        scene={<LanternScene />}
        step={dot}
        actions={
          <>
            <Button variant="secondary" onClick={tryHarder}>Try a harder page</Button>
            <Button size="lg" className="w-full sm:w-auto" onClick={startHere} rightIcon={<ArrowRight size={18} strokeWidth={2} />}>
              Start here
            </Button>
          </>
        }
      >
        <StepHeading title="Nice. That page fits you." lead="Want to see if a harder one fits too, or start reading here?" />
      </OnboardingShell>
    );
  }

  if (step === 'seeding') {
    return (
      <OnboardingShell scene={<ShelvesScene lit={0.5} />} step={dot}>
        <SeedingStep
          libraryName={content?.libraryName ?? `Your ${languageName} library`}
          error={error}
          onRetry={() => lastSeedBody.current && runSeeding(lastSeedBody.current)}
        />
      </OnboardingShell>
    );
  }

  if (step === 'reveal' && result) {
    return (
      <>
        <Reveal
          result={result}
          fluency={fluency ?? result.fluency}
          languageName={languageName}
          beginner={path === 'beginner'}
          hasStory={!!result.startTextId}
          busy={busy}
          fromSettings={fromSettings}
          onRead={() => finish(`/reader/${result.startTextId}?guide=1`)}
          onBringText={() => setTextModalOpen(true)}
          onSkip={() => finish('/dashboard')}
        />
        <NewTextModal
          isOpen={textModalOpen}
          onClose={() => setTextModalOpen(false)}
          availableSeries={[]}
          onAdd={(r) => finish(`/reader/${r.texts[0].id}?guide=1`)}
        />
      </>
    );
  }

  return null;
}

// ─── Reveal: the "aha" ──────────────────────────────────────────────────────

function Reveal({
  result,
  fluency,
  languageName,
  beginner,
  hasStory,
  busy,
  fromSettings,
  onRead,
  onBringText,
  onSkip,
}: {
  result: OnboardingCompleteResponse;
  fluency: number;
  languageName: string;
  beginner: boolean;
  hasStory: boolean;
  busy: boolean;
  fromSettings: boolean;
  onRead: () => void;
  onBringText: () => void;
  onSkip: () => void;
}) {
  const shown = useCountUp(fluency);
  const room = useMemo(() => {
    if (!result.level) return 0;
    return Math.min(4, PLACEMENT_LEVELS.indexOf(result.level));
  }, [result.level]);
  const lit = result.level ? room + 1 : 0;

  return (
    <OnboardingShell
      scene={<LibraryMapScene litRooms={lit} currentRoom={room} />}
      step={3}
      actions={
        <>
          {fromSettings && (
            <Button variant="ghost" onClick={onSkip} disabled={busy}>
              Later
            </Button>
          )}
          {hasStory ? (
            <Button size="lg" className="w-full sm:w-auto" onClick={onRead} disabled={busy} rightIcon={<BookOpen size={18} strokeWidth={2} />}>
              {busy ? 'Opening…' : `Read “${result.startChapterTitle}”`}
            </Button>
          ) : (
            <Button size="lg" className="w-full sm:w-auto" onClick={onBringText} disabled={busy} rightIcon={<ArrowRight size={18} strokeWidth={2} />}>
              Bring your first text
            </Button>
          )}
        </>
      }
    >
      {beginner ? (
        <StepHeading
          title="Ten words in. Let's read your first page."
          lead="You'll recognise every word you just learned. Tap any other word to see what it means."
        />
      ) : (
        <div className="space-y-2 mb-6" aria-live="polite">
          <p className="font-sans text-ui-sm uppercase tracking-wide text-muted">Your Fluency</p>
          <p className="font-sans text-6xl md:text-7xl font-bold text-primary tabular-nums leading-none">
            {shown.toFixed(0)}
            <span className="text-3xl md:text-4xl text-riso-coral">%</span>
          </p>
          <p className="font-sans text-ui-lg text-ink max-w-prose">
            You can already read about <strong>{Math.round(fluency)}%</strong> of everyday {languageName}.
            {result.level && (
              <>
                {' '}Your room in the library: <strong>{result.level}</strong>.
              </>
            )}
          </p>
          <p className="font-sans text-ui-sm text-muted max-w-prose">
            {result.wordsMarked > 0 && <>We marked about {result.wordsMarked.toLocaleString()} words you likely know. </>}
            {hasStory
              ? 'Your story starts at your level. Every word you learn lights up more of the library.'
              : 'Bring any text you like. Every word you learn lights up more of the library.'}
          </p>
        </div>
      )}
    </OnboardingShell>
  );
}
