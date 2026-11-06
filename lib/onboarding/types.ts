import type { PlacementLevel } from './placement';

/** Client-side slice of onboarding content, served by GET /api/onboarding/content. */
export interface ClientOnboardingContent {
  language: string;
  libraryName: string;
  gate: { noButton: string; understandQuestion: string; yes: string; somewhat: string; no: string };
  firstWords: Array<{ lemma: string; gloss: string; gender: 'm' | 'f' | null; conceptId: string }>;
  bands: Array<{ level: PlacementLevel; words: Array<{ lemma: string; gloss: string }> }>;
  decoys: string[];
  /** Comprehension-check passage per estimated level (C2 reuses the C1 chapter). */
  excerpts: Record<PlacementLevel, { title: string; titleEn: string; level: string; text: string }>;
  firstChapter: { title: string; titleEn: string };
}

export type OnboardingPathChoice = 'beginner' | 'placement' | 'self';
