/**
 * Onboarding content registry: the story chapters, starter deck and placement
 * bands for each target language that has them.
 *
 * Content lives in content/<lang>/ and is compiled by
 * scripts/build-onboarding-content.ts into *.generated.json, imported
 * statically here so it is bundled (no filesystem reads at runtime).
 *
 * `getOnboardingContent(code)` returns null for languages without content.
 * The wizard then runs the fallback flow (self-picked level, then "bring your
 * first text"). Adding a language means adding its content folder and one
 * entry to REGISTRY.
 */
import type { PlacementLevel } from './placement';
import { PLACEMENT_LEVELS } from './placement';

import esStory from '@/content/es/story.generated.json';
import esDeck from '@/content/es/deck.generated.json';
import esBands from '@/content/es/placement-bands.json';
import esPools from '@/content/es/placement-pools.json';

export type StoryLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface StoryChapter {
  id: string;
  order: number;
  level: StoryLevel;
  title: string;
  titleEn: string;
  scene: string;
  body: string;
  wordCount: number;
}

export interface DeckCard {
  lemma: string;
  gloss: string;
  gender: 'm' | 'f' | null;
  display: string | null;
  conceptId: string;
  category: string;
  kind: 'core' | 'glue';
  order: number;
}

export interface BandWord {
  lemma: string;
  gloss: string;
}

export interface PlacementBand {
  level: PlacementLevel;
  words: BandWord[];
}

export interface OnboardingContent {
  language: string;
  /** Library name shown in the UI, in the target language. */
  libraryName: string;
  chapters: StoryChapter[];
  deck: DeckCard[];
  /** How many deck cards a beginner learns inside onboarding. */
  firstWordsCount: number;
  bands: PlacementBand[];
  decoys: string[];
  /** Lemma pools per band (A1-C1), pre-marked Known for bands below the placed level. */
  pools: Partial<Record<PlacementLevel, string[]>>;
  /** Gate-screen copy, in the target language. */
  gate: { noButton: string; understandQuestion: string; yes: string; somewhat: string; no: string };
}

const REGISTRY: Record<string, OnboardingContent> = {
  es: {
    language: 'es',
    libraryName: 'La Biblioteca del Olvido',
    chapters: esStory.chapters as StoryChapter[],
    deck: esDeck.cards as DeckCard[],
    firstWordsCount: 10,
    bands: esBands.bands as PlacementBand[],
    decoys: esBands.decoys,
    pools: esPools.pools as Partial<Record<PlacementLevel, string[]>>,
    gate: {
      noButton: '¡No, ya sé algo!',
      understandQuestion: '¿Lo entiendes?',
      yes: '¡Sí!',
      somewhat: 'Más o menos',
      no: 'No',
    },
  },
};

export function getOnboardingContent(languageCode: string): OnboardingContent | null {
  return REGISTRY[languageCode.toLowerCase()] ?? null;
}

export function hasOnboardingContent(languageCode: string): boolean {
  return languageCode.toLowerCase() in REGISTRY;
}

/** Story levels top out at C1, so a C2 placement reads the C1 chapters. */
export function storyLevelFor(level: PlacementLevel | null): StoryLevel {
  if (level === null) return 'A1';
  return level === 'C2' ? 'C1' : level;
}

/** First chapter at the learner's level, where the reading position starts. */
export function startChapterFor(content: OnboardingContent, level: PlacementLevel | null): StoryChapter {
  const target = storyLevelFor(level);
  return content.chapters.find((c) => c.level === target) ?? content.chapters[0];
}

/**
 * About 120 words from the first chapter at `level`, for the comprehension
 * check. Cut at a paragraph boundary so it never ends mid-sentence.
 */
export function excerptFor(content: OnboardingContent, level: PlacementLevel | null, targetWords = 120): string {
  const body = startChapterFor(content, level).body;
  const paras = body.split(/\n\s*\n/);
  const out: string[] = [];
  let n = 0;
  for (const p of paras) {
    out.push(p);
    n += p.split(/\s+/).length;
    if (n >= targetWords) break;
  }
  return out.join('\n\n');
}

/** Ordered list of every placement level, re-exported for UI code. */
export { PLACEMENT_LEVELS };
