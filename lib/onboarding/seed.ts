import { db } from '@/lib/db';
import { words, series, texts } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import { lookupDictionaryFrequency } from '@/lib/utils/wordFrequency';
import { importTextPages } from '@/lib/texts/importText';
import type { OnboardingContent, StoryChapter } from './content';
import type { PremarkStatus } from './placement';

/**
 * Server-side seeding for onboarding, called by POST /api/onboarding/complete.
 * Order matters, because word rows are unique on (lemma, language, user):
 *   1. placement words (Known / Well-known)
 *   2. starter deck (Unknown; rows that already exist are left alone, so
 *      words placement marked as known never enter the deck)
 *   3. story chapters (the text importer reuses the rows above, so a chapter's
 *      known percentage reflects the placement straight away)
 * Every step is safe to re-run (retake placement, retried requests).
 */

const BATCH = 1000;

interface LanguageRef {
  id: string;
  code: string;
}

/**
 * Upsert the interpolated known-word list. On conflict the status only ever
 * goes UP: Postgres compares enum values in declaration order (UNKNOWN <
 * NEWLY_SEEN < ... < WELL_KNOWN < IGNORE), so GREATEST keeps the higher status
 * and leaves IGNORE alone. A word whose status was raised becomes
 * origin 'placement', which keeps it out of Review's new-card queue
 * (lib/srs/queue.ts).
 */
export async function seedKnownWords(
  userId: string,
  language: LanguageRef,
  plan: Array<{ lemma: string; status: PremarkStatus }>
): Promise<number> {
  const now = new Date();
  for (let i = 0; i < plan.length; i += BATCH) {
    const rows = plan.slice(i, i + BATCH).map(({ lemma, status }) => ({
      lemma,
      languageId: language.id,
      userId,
      status: status as VocabularyStatus,
      origin: 'placement' as const,
      dictionaryFrequency: lookupDictionaryFrequency(language.code, lemma) ?? 0,
      statusChangedAt: now,
    }));
    await db
      .insert(words)
      .values(rows)
      .onConflictDoUpdate({
        target: [words.lemma, words.languageId, words.userId],
        set: {
          status: sql`GREATEST(${words.status}, excluded.status)`,
          origin: sql`CASE WHEN excluded.status > ${words.status} THEN 'placement' ELSE ${words.origin} END`,
          statusChangedAt: sql`CASE WHEN excluded.status > ${words.status} THEN excluded.status_changed_at ELSE ${words.statusChangedAt} END`,
          updatedAt: now,
        },
      });
  }
  return plan.length;
}

/**
 * Insert the starter deck as UNKNOWN cards in deck order, for Review to drip
 * in (lib/srs/queue.ts findNewWordIds). The first `learnedCount` cards, the
 * words a beginner just learned on the picture cards, start at NEWLY_SEEN.
 * Existing rows are left untouched.
 */
export async function seedStarterDeck(
  userId: string,
  language: LanguageRef,
  content: OnboardingContent,
  learnedCount: number
): Promise<number> {
  const now = new Date();
  const rows = content.deck.map((card) => ({
    lemma: card.lemma,
    languageId: language.id,
    userId,
    status: card.order <= learnedCount ? VocabularyStatus.NEWLY_SEEN : VocabularyStatus.UNKNOWN,
    origin: 'starter_deck' as const,
    deckOrder: card.order,
    glyph: card.conceptId,
    translation: card.gloss,
    dictionaryFrequency: lookupDictionaryFrequency(language.code, card.lemma) ?? 0,
    statusChangedAt: now,
  }));
  for (let i = 0; i < rows.length; i += BATCH) {
    await db.insert(words).values(rows.slice(i, i + BATCH)).onConflictDoNothing();
  }
  return rows.length;
}

export interface SeededStory {
  seriesId: string;
  startTextId: string;
  /** Chapters still to import; the caller imports them in after(). */
  pending: StoryChapter[];
  created: boolean;
}

/**
 * Create the starter story series and import the learner's start chapter now,
 * so they can open it straight away. Returns the remaining chapters for the
 * caller to import in the background. If the series already exists (retake,
 * retried request), its existing start chapter is returned and nothing is
 * imported twice.
 */
export async function seedStory(
  userId: string,
  language: LanguageRef,
  content: OnboardingContent,
  startChapter: StoryChapter
): Promise<SeededStory> {
  const [created] = await db
    .insert(series)
    .values({
      name: content.libraryName,
      description: 'A boy, a green door, and a library of forgotten words. Your starter story, one chapter per level.',
      languageId: language.id,
      userId,
      kind: 'starter_story',
    })
    .onConflictDoNothing()
    .returning({ id: series.id });

  if (!created) {
    const existing = await db.query.series.findFirst({
      where: and(eq(series.userId, userId), eq(series.languageId, language.id), eq(series.kind, 'starter_story')),
    });
    if (!existing) throw new Error('Starter story series conflict but no existing row');
    const chapterTexts = await db
      .select({ id: texts.id, order: texts.order, title: texts.title })
      .from(texts)
      .where(eq(texts.seriesId, existing.id));
    const start =
      chapterTexts.find((t) => t.title === startChapter.title || t.title.startsWith(`${startChapter.title} (Part`)) ??
      chapterTexts.sort((a, b) => a.order - b.order)[0];
    const importedTitles = new Set(chapterTexts.map((t) => t.title.replace(/ \(Part \d+\)$/, '')));
    const pending = content.chapters.filter((c) => !importedTitles.has(c.title));
    if (start) return { seriesId: existing.id, startTextId: start.id, pending, created: false };
    // The series exists but has no texts yet (a crash mid-seed): import the start chapter now.
    const page = await importChapter(userId, language, existing.id, startChapter);
    return { seriesId: existing.id, startTextId: page, pending: pending.filter((c) => c.id !== startChapter.id), created: false };
  }

  const startTextId = await importChapter(userId, language, created.id, startChapter);
  return {
    seriesId: created.id,
    startTextId,
    pending: content.chapters.filter((c) => c.id !== startChapter.id),
    created: true,
  };
}

/**
 * Import one chapter at its story position. Order is spaced by 10 per chapter,
 * so a chapter split into several pages keeps its pages together in order.
 */
export async function importChapter(
  userId: string,
  language: LanguageRef,
  seriesId: string,
  chapter: StoryChapter
): Promise<string> {
  const result = await importTextPages({
    userId,
    languageId: language.id,
    seriesId,
    title: chapter.title,
    content: chapter.body,
    startOrder: chapter.order * 10,
    logTag: `[Onboarding ${chapter.id}]`,
  });
  return result.textIds[0];
}
