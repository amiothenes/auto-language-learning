import { NextRequest, NextResponse, after } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { languages } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { checkQuota, quotaResponse } from '@/lib/quotas';
import { processTranslationsForText, TRANSLATION_TIME_BUDGET_MS } from '@/lib/translation/translationService';
import { TextProcessingError } from '@/lib/nlp/textProcessor';
import type { ApiErrorResponse } from '@/lib/types/api';
import { getOnboardingContent, startChapterFor } from '@/lib/onboarding/content';
import {
  PLACEMENT_LEVELS,
  fromRates,
  planKnownWords,
  ratesForSelfLevel,
  type PlacementLevel,
} from '@/lib/onboarding/placement';
import { seedKnownWords, seedStarterDeck, seedStory, importChapter } from '@/lib/onboarding/seed';

// Seeding up to ~12k placement words plus the start chapter's NLP pass runs
// in the request; the remaining chapters import in after(), which counts
// toward this too.
export const maxDuration = 300;

// ============================================================================
// POST /api/onboarding/complete: stock the learner's library for a language
// ============================================================================

type OnboardingPath = 'beginner' | 'placement' | 'self';

export interface OnboardingCompleteRequest {
  languageId: string;
  path: OnboardingPath;
  /**
   * Final band rates after the comprehension check, 6 numbers in 0..1 (A1..C2).
   * Required for 'placement'. The server re-derives level, vocabulary and the
   * known-word list from them; it never trusts a client-sent word list.
   */
  bandRates?: number[];
  /** Picker words the learner ticked (placement path). */
  ticked?: string[];
  /** Picker words shown but not ticked; never pre-marked (placement path). */
  shownUnticked?: string[];
  /** Self-picked level ('self' path); null = below A1. */
  level?: PlacementLevel | null;
  /** Beginner path: how many first-deck words were learned on the picture cards. */
  learnedCount?: number;
}

export interface OnboardingCompleteResponse {
  level: PlacementLevel | null;
  /** Estimated Fluency, same formula as /api/stats readingCoverage. */
  fluency: number;
  vocabSize: number;
  wordsMarked: number;
  deckSize: number;
  /** Null when the language has no onboarding content (fallback flow). */
  seriesId: string | null;
  startTextId: string | null;
  startChapterTitle: string | null;
}

const MAX_LIST = 400; // the picker shows at most 6 × 24 real words

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  let body: OnboardingCompleteRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiErrorResponse>({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  // ── Validate ──────────────────────────────────────────────────────────────
  const { languageId, path } = body;
  if (!languageId || typeof languageId !== 'string') {
    return NextResponse.json<ApiErrorResponse>({ error: 'languageId is required' }, { status: 400 });
  }
  if (path !== 'beginner' && path !== 'placement' && path !== 'self') {
    return NextResponse.json<ApiErrorResponse>({ error: `Invalid path: ${String(path)}` }, { status: 400 });
  }
  const strList = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 40).slice(0, MAX_LIST) : [];
  const ticked = strList(body.ticked);
  const shownUnticked = strList(body.shownUnticked);

  let bandRates: number[];
  if (path === 'placement') {
    const r = body.bandRates;
    if (!Array.isArray(r) || r.length !== PLACEMENT_LEVELS.length || r.some((x) => typeof x !== 'number' || !(x >= 0 && x <= 1))) {
      return NextResponse.json<ApiErrorResponse>({ error: 'bandRates must be 6 numbers between 0 and 1' }, { status: 400 });
    }
    bandRates = r;
  } else if (path === 'self') {
    const lvl = body.level ?? null;
    if (lvl !== null && !PLACEMENT_LEVELS.includes(lvl)) {
      return NextResponse.json<ApiErrorResponse>({ error: `Invalid level: ${String(lvl)}` }, { status: 400 });
    }
    bandRates = ratesForSelfLevel(lvl);
  } else {
    bandRates = ratesForSelfLevel(null);
  }

  const rateLimit = await checkRateLimit('onboarding', user.id);
  if (!rateLimit.allowed) return rateLimitResponse('onboarding', rateLimit);

  try {
    const language = await db.query.languages.findFirst({
      where: and(eq(languages.id, languageId), eq(languages.userId, user.id)),
    });
    if (!language) {
      return NextResponse.json<ApiErrorResponse>({ error: 'Language not found' }, { status: 404 });
    }

    const wordsQuota = await checkQuota('words', user.id);
    if (!wordsQuota.allowed) return quotaResponse('words', wordsQuota);

    const content = getOnboardingContent(language.code);
    const estimate = fromRates(bandRates);
    const langRef = { id: language.id, code: language.code };

    // ── 1. Known words (interpolated from the band rates) ───────────────────
    // Stay inside the word quota: never let seeding push a user past it.
    const room = Math.max(0, wordsQuota.limit - wordsQuota.current - (content?.deck.length ?? 0));
    const plan =
      content && path !== 'beginner'
        ? planKnownWords(estimate, content.pools, ticked, shownUnticked, Math.min(12_000, room))
        : [];
    const wordsMarked = plan.length > 0 ? await seedKnownWords(user.id, langRef, plan) : 0;

    // ── 2. Starter deck ──────────────────────────────────────────────────────
    const learnedCount =
      path === 'beginner' && content
        ? Math.max(0, Math.min(content.firstWordsCount, Math.floor(body.learnedCount ?? content.firstWordsCount)))
        : 0;
    const deckSize = content ? await seedStarterDeck(user.id, langRef, content, learnedCount) : 0;

    // ── 3. Story: start chapter now, the rest in the background ─────────────
    let seriesId: string | null = null;
    let startTextId: string | null = null;
    let startChapterTitle: string | null = null;
    if (content) {
      const startChapter = startChapterFor(content, estimate.level);
      const story = await seedStory(user.id, langRef, content, startChapter);
      seriesId = story.seriesId;
      startTextId = story.startTextId;
      startChapterTitle = startChapter.title;

      const startId = story.startTextId;
      const pending = story.pending;
      after(async () => {
        // Translate only the chapter the learner opens now. Other chapters are
        // translated on first open by the word-instances route, which keeps
        // the Azure cost of a signup to one chapter.
        try {
          await processTranslationsForText(startId, Date.now() + TRANSLATION_TIME_BUDGET_MS);
        } catch (err) {
          console.error('[Onboarding] Start-chapter translation failed:', err);
        }
        for (const chapter of pending) {
          try {
            await importChapter(user.id, langRef, story.seriesId, chapter);
          } catch (err) {
            // Non-fatal: a missing later chapter can be re-imported by a retake.
            console.error(`[Onboarding] Background import of ${chapter.id} failed:`, err);
          }
        }
      });
    }

    // ── 4. Record the result on the language ────────────────────────────────
    // A retake never lowers the stored level below an earlier, higher result.
    const prevIdx = language.level ? PLACEMENT_LEVELS.indexOf(language.level) : -1;
    const nextIdx = estimate.level ? PLACEMENT_LEVELS.indexOf(estimate.level) : -1;
    await db
      .update(languages)
      .set({
        level: nextIdx >= prevIdx ? estimate.level : language.level,
        onboardingPath: path,
        onboardedAt: language.onboardedAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(languages.id, language.id));

    return NextResponse.json<OnboardingCompleteResponse>({
      level: estimate.level,
      fluency: estimate.fluency,
      vocabSize: estimate.vocabSize,
      wordsMarked,
      deckSize,
      seriesId,
      startTextId,
      startChapterTitle,
    });
  } catch (error) {
    if (error instanceof TextProcessingError) {
      console.error(`[Onboarding] Start chapter failed at stage "${error.stage}":`, error.message);
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Could not prepare your first chapter. Please try again.', details: error.message, stage: error.stage },
        { status: 502 }
      );
    }
    console.error('[Onboarding] Unexpected error:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Internal server error during onboarding', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
