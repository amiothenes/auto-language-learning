import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, isNotNull, lt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { languages, series, texts } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { countDueToday } from '@/lib/srs/queue';
import { getOnboardingContent, startChapterFor } from '@/lib/onboarding/content';
import { pickLibraryNext } from '@/lib/onboarding/nextStep';
import type { ApiErrorResponse } from '@/lib/types/api';

// ============================================================================
// GET /api/today?languageCode=es: everything the Today page needs to choose
// ONE next step (see lib/onboarding/nextStep.ts), in a single request.
// ============================================================================

/** A text that counts as "finished" once this much of it is known. */
const FINISHED_AT = 90;

export interface TodayResponse {
  languageId: string;
  level: string | null;
  /** Due reviews + new cards available today (same number as the nav badge). */
  dueCount: number;
  /** Most recently opened text that isn't finished yet. */
  continueText: { id: string; title: string; knownPercentage: number } | null;
  story: {
    seriesId: string;
    name: string;
    /** The chapter onboarding started the learner on (for the guided read). */
    startTextId: string | null;
    /** First unopened chapter after the furthest opened one. */
    nextChapter: { id: string; title: string } | null;
    chaptersRead: number;
    chaptersTotal: number;
  } | null;
  /**
   * The next unopened text from the learner's OWN library (not the starter
   * story): the next one in the series they read most recently, otherwise
   * their most readable unopened text (highest % known).
   */
  libraryNext: { id: string; title: string; knownPercentage: number } | null;
  /** True when the learner opened their own texts more recently than the story. */
  prefersOwnTexts: boolean;
  /** Whether the learner has opened any text outside the starter story. */
  hasReadOwnTexts: boolean;
}

export async function GET(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  const code = request.nextUrl.searchParams.get('languageCode');
  if (!code) return NextResponse.json<ApiErrorResponse>({ error: 'languageCode is required' }, { status: 400 });

  try {
    const language = await db.query.languages.findFirst({
      where: and(eq(languages.code, code), eq(languages.userId, user.id)),
    });
    if (!language) return NextResponse.json<ApiErrorResponse>({ error: 'Language not found' }, { status: 404 });

    const [dueCount, recent, storySeries] = await Promise.all([
      countDueToday(user.id, language.id),
      db
        .select({ id: texts.id, title: texts.title, knownPercentage: texts.knownPercentage })
        .from(texts)
        .where(
          and(
            eq(texts.userId, user.id),
            eq(texts.languageId, language.id),
            isNotNull(texts.lastViewedAt),
            lt(texts.knownPercentage, FINISHED_AT)
          )
        )
        .orderBy(desc(texts.lastViewedAt))
        .limit(1),
      db.query.series.findFirst({
        where: and(eq(series.userId, user.id), eq(series.languageId, language.id), eq(series.kind, 'starter_story')),
      }),
    ]);

    // ── The learner's own library (everything outside the starter story) ────
    const own = await db
      .select({
        id: texts.id,
        title: texts.title,
        seriesId: texts.seriesId,
        order: texts.order,
        viewCount: texts.viewCount,
        lastViewedAt: texts.lastViewedAt,
        knownPercentage: texts.knownPercentage,
        createdAt: texts.createdAt,
      })
      .from(texts)
      .where(and(eq(texts.userId, user.id), eq(texts.languageId, language.id)))
      .orderBy(texts.order);
    const ownTexts = storySeries ? own.filter((t) => t.seriesId !== storySeries.id) : own;
    const storyTexts = storySeries ? own.filter((t) => t.seriesId === storySeries.id) : [];

    const latest = (list: typeof own) =>
      list.reduce<Date | null>((max, t) => (t.lastViewedAt && (!max || t.lastViewedAt > max) ? t.lastViewedAt : max), null);
    const lastOwnView = latest(ownTexts);
    const lastStoryView = latest(storyTexts);

    // Next in series by creation date (serial order as tiebreak), else the
    // easiest unopened text. See pickLibraryNext.
    const libraryNext: TodayResponse['libraryNext'] = pickLibraryNext(ownTexts);

    let story: TodayResponse['story'] = null;
    if (storySeries) {
      const chapters = await db
        .select({ id: texts.id, title: texts.title, order: texts.order, viewCount: texts.viewCount })
        .from(texts)
        .where(eq(texts.seriesId, storySeries.id))
        .orderBy(texts.order);

      const furthestRead = chapters.reduce((max, c) => (c.viewCount > 0 ? Math.max(max, c.order) : max), -1);
      const next = chapters.find((c) => c.viewCount === 0 && c.order > furthestRead) ?? null;

      const content = getOnboardingContent(language.code);
      const startTitle = content ? startChapterFor(content, language.level).title : null;
      const start = startTitle ? chapters.find((c) => c.title === startTitle || c.title.startsWith(`${startTitle} (Part`)) : undefined;

      story = {
        seriesId: storySeries.id,
        name: storySeries.name,
        startTextId: start?.id ?? null,
        nextChapter: next ? { id: next.id, title: next.title } : null,
        chaptersRead: chapters.filter((c) => c.viewCount > 0).length,
        chaptersTotal: chapters.length,
      };
    }

    return NextResponse.json<TodayResponse>({
      languageId: language.id,
      level: language.level,
      dueCount,
      continueText: recent[0] ?? null,
      story,
      libraryNext,
      prefersOwnTexts: !!lastOwnView && (!lastStoryView || lastOwnView > lastStoryView),
      hasReadOwnTexts: !!lastOwnView,
    });
  } catch (error) {
    console.error('[Today] Error:', error);
    return NextResponse.json<ApiErrorResponse>({ error: 'Failed to load today' }, { status: 500 });
  }
}
