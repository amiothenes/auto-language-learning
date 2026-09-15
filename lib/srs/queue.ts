import { db } from '@/lib/db';
import { words, wordInstances, wordReviews, wordTranslations, srsSettings, srsDailyStats } from '@/lib/db/schema';
import { eq, and, lte, inArray, isNull, notInArray, asc, count, sql } from 'drizzle-orm';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import { STATUS_PROGRESSION, stepStatusDown, stepStatusUp } from '@/lib/vocabulary/statusProgression';
import { applySm2 } from '@/lib/srs/sm2';
import type { SrsCard, SrsCardSentence, SrsCardSource, SrsSettingsPayload } from '@/lib/types/api';

export const DEFAULT_SRS_SETTINGS: SrsSettingsPayload = {
  newCardsPerDay: 20,
  reviewsPerDay: 100,
  minEligibleStatus: VocabularyStatus.NEWLY_SEEN,
  maxEligibleStatus: VocabularyStatus.KNOWN,
  typeSwitchStatus: VocabularyStatus.FAMILIAR,
  sentenceAudioEnabled: true,
  wordAudioEnabled: true,
  newCardsPosition: 'end',
};

const NON_MASTERED = [VocabularyStatus.WELL_KNOWN, VocabularyStatus.IGNORE];

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getSrsSettings(userId: string, languageId: string): Promise<SrsSettingsPayload> {
  const row = await db.query.srsSettings.findFirst({
    where: and(eq(srsSettings.userId, userId), eq(srsSettings.languageId, languageId)),
  });
  if (!row) return DEFAULT_SRS_SETTINGS;
  return {
    newCardsPerDay: row.newCardsPerDay,
    reviewsPerDay: row.reviewsPerDay,
    minEligibleStatus: row.minEligibleStatus as VocabularyStatus,
    maxEligibleStatus: row.maxEligibleStatus as VocabularyStatus,
    typeSwitchStatus: row.typeSwitchStatus as VocabularyStatus,
    sentenceAudioEnabled: row.sentenceAudioEnabled,
    wordAudioEnabled: row.wordAudioEnabled,
    newCardsPosition: row.newCardsPosition,
  };
}

export function eligibleStatusesFor(settings: SrsSettingsPayload): VocabularyStatus[] {
  const minIdx = STATUS_PROGRESSION.indexOf(settings.minEligibleStatus as (typeof STATUS_PROGRESSION)[number]);
  const maxIdx = STATUS_PROGRESSION.indexOf(settings.maxEligibleStatus as (typeof STATUS_PROGRESSION)[number]);
  const lo = Math.max(0, Math.min(minIdx, maxIdx));
  const hi = Math.max(minIdx, maxIdx);
  return STATUS_PROGRESSION.slice(lo, hi + 1);
}

async function getDailyStats(userId: string, languageId: string, date: string) {
  const row = await db.query.srsDailyStats.findFirst({
    where: and(eq(srsDailyStats.userId, userId), eq(srsDailyStats.languageId, languageId), eq(srsDailyStats.date, date)),
  });
  return {
    newIntroducedCount: row?.newIntroducedCount ?? 0,
    reviewsCompletedCount: row?.reviewsCompletedCount ?? 0,
  };
}

interface QueueBudget {
  eligibleStatuses: VocabularyStatus[];
  remainingNew: number;
  remainingReviews: number;
}

async function getQueueBudget(userId: string, languageId: string): Promise<QueueBudget> {
  const settings = await getSrsSettings(userId, languageId);
  const eligibleStatuses = eligibleStatusesFor(settings);
  const stats = await getDailyStats(userId, languageId, todayDateString());

  const remainingNew = Math.max(0, settings.newCardsPerDay - stats.newIntroducedCount);
  const remainingReviews =
    settings.reviewsPerDay === null
      ? 500
      : Math.max(0, settings.reviewsPerDay - stats.reviewsCompletedCount);

  return { eligibleStatuses, remainingNew, remainingReviews: Math.min(remainingReviews, 500) };
}

async function findDueWordIds(userId: string, languageId: string, budget: QueueBudget): Promise<string[]> {
  if (budget.remainingReviews <= 0) return [];
  const rows = await db
    .select({ wordId: wordReviews.wordId })
    .from(wordReviews)
    .innerJoin(words, eq(wordReviews.wordId, words.id))
    .where(
      and(
        eq(wordReviews.userId, userId),
        eq(words.languageId, languageId),
        lte(wordReviews.dueAt, new Date()),
        inArray(words.status, budget.eligibleStatuses)
      )
    )
    .orderBy(asc(wordReviews.dueAt))
    .limit(budget.remainingReviews);
  return rows.map((r) => r.wordId);
}

async function findNewWordIds(userId: string, languageId: string, budget: QueueBudget): Promise<string[]> {
  if (budget.remainingNew <= 0) return [];
  const rows = await db
    .select({ id: words.id })
    .from(words)
    .leftJoin(wordReviews, eq(wordReviews.wordId, words.id))
    .where(
      and(
        eq(words.userId, userId),
        eq(words.languageId, languageId),
        inArray(words.status, budget.eligibleStatuses),
        isNull(wordReviews.id)
      )
    )
    .orderBy(asc(words.statusChangedAt))
    .limit(budget.remainingNew);
  return rows.map((r) => r.id);
}

/** Cheap counts for the nav due-badge — same budget logic as the full session, no card assembly. */
export async function countDueToday(userId: string, languageId: string): Promise<number> {
  const budget = await getQueueBudget(userId, languageId);
  const [dueIds, newIds] = await Promise.all([
    findDueWordIds(userId, languageId, budget),
    findNewWordIds(userId, languageId, budget),
  ]);
  return dueIds.length + newIds.length;
}

function pickRandom<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

async function buildSentenceForWord(
  wordId: string,
  cardType: 'SENTENCE' | 'WORD'
): Promise<SrsCardSentence | null> {
  const instances = await db.query.wordInstances.findMany({
    where: and(eq(wordInstances.wordId, wordId)),
    columns: { id: true, surfaceForm: true, sentenceId: true },
  });
  const candidates = instances.filter((i): i is typeof i & { sentenceId: string } => i.sentenceId !== null);
  if (candidates.length === 0) return null;

  if (cardType === 'WORD') {
    const chosen = pickRandom(candidates)!;
    const sentence = await db.query.sentences.findFirst({ where: (s, { eq }) => eq(s.id, chosen.sentenceId) });
    if (!sentence) return null;
    return { sentenceId: sentence.id, content: sentence.content, targetSurface: chosen.surfaceForm, degraded: false };
  }

  // Type A ("1T"): find sentences where this is the only non-mastered target word.
  const sentenceIds = [...new Set(candidates.map((c) => c.sentenceId))];
  const rivalCounts = await db
    .select({ sentenceId: wordInstances.sentenceId, cnt: count() })
    .from(wordInstances)
    .innerJoin(words, eq(wordInstances.wordId, words.id))
    .where(and(inArray(wordInstances.sentenceId, sentenceIds), notInArray(words.status, NON_MASTERED)))
    .groupBy(wordInstances.sentenceId);
  const rivalMap = new Map(rivalCounts.map((r) => [r.sentenceId, Number(r.cnt)]));

  const cleanCandidates = candidates.filter((c) => (rivalMap.get(c.sentenceId) ?? 1) === 1);
  const chosen = pickRandom(cleanCandidates) ?? pickRandom(candidates)!;
  const sentence = await db.query.sentences.findFirst({ where: (s, { eq }) => eq(s.id, chosen.sentenceId) });
  if (!sentence) return null;
  return {
    sentenceId: sentence.id,
    content: sentence.content,
    targetSurface: chosen.surfaceForm,
    degraded: cleanCandidates.length === 0,
  };
}

async function buildCardForWord(wordId: string, userId: string, typeSwitchStatus: VocabularyStatus): Promise<SrsCard | null> {
  const word = await db.query.words.findFirst({
    where: and(eq(words.id, wordId), eq(words.userId, userId)),
    with: { language: { columns: { defaultTranslationLangCode: true } } },
  });
  if (!word) return null;

  const targetLangCode = word.language?.defaultTranslationLangCode ?? null;
  const translationRow = targetLangCode
    ? await db.query.wordTranslations.findFirst({
        where: and(eq(wordTranslations.wordId, wordId), eq(wordTranslations.targetLangCode, targetLangCode)),
      })
    : undefined;

  const status = word.status as VocabularyStatus;
  const switchIdx = STATUS_PROGRESSION.indexOf(typeSwitchStatus as (typeof STATUS_PROGRESSION)[number]);
  const statusIdx = STATUS_PROGRESSION.indexOf(status as (typeof STATUS_PROGRESSION)[number]);
  const cardType: 'SENTENCE' | 'WORD' = statusIdx < switchIdx ? 'SENTENCE' : 'WORD';

  const sentence = await buildSentenceForWord(wordId, cardType);

  let pos: string | null = null;
  let inflectionData: Record<string, unknown> | null = null;
  if (sentence) {
    const instance = await db.query.wordInstances.findFirst({
      where: and(eq(wordInstances.wordId, wordId), eq(wordInstances.sentenceId, sentence.sentenceId)),
      columns: { pos: true, inflectionData: true },
    });
    pos = instance?.pos ?? null;
    inflectionData = instance?.inflectionData ?? null;
  }

  let source: SrsCardSource | null = null;
  if (sentence) {
    const sentenceRow = await db.query.sentences.findFirst({
      where: (s, { eq }) => eq(s.id, sentence.sentenceId),
      with: { text: { with: { series: true } } },
    });
    if (sentenceRow?.text) {
      source = {
        textId: sentenceRow.text.id,
        textTitle: sentenceRow.text.title,
        seriesId: sentenceRow.text.series?.id ?? null,
        seriesName: sentenceRow.text.series?.name ?? null,
      };
    }
  }

  const review = await db.query.wordReviews.findFirst({ where: eq(wordReviews.wordId, wordId) });

  // Same SM-2/status-step logic POST /api/srs/review applies on an actual
  // grade — computed here purely as a preview so the button captions can
  // never drift from what grading will really do.
  const currentSm2 = {
    easeFactor: review?.easeFactor ?? 2.5,
    intervalDays: review?.intervalDays ?? 0,
    repetitions: review?.repetitions ?? 0,
  };
  const knewSm2 = applySm2(currentSm2, 'KNEW');
  const didntKnowSm2 = applySm2(currentSm2, 'DIDNT_KNOW');

  return {
    wordId: word.id,
    cardType,
    lemma: word.lemma,
    translation: translationRow?.translation ?? word.translation ?? null,
    meanings: translationRow?.meanings ?? null,
    pos,
    inflectionData,
    romanization: word.romanization,
    sentence,
    source,
    isNew: !review,
    status,
    preview: {
      knew: { status: stepStatusUp(status), intervalDays: knewSm2.intervalDays },
      didntKnow: { status: stepStatusDown(status), intervalDays: didntKnowSm2.intervalDays },
    },
  };
}

/** Inserts each `extra` item into `base` at evenly-spaced positions, preserving both orders. */
function interleaveEvenly<T>(base: T[], extra: T[]): T[] {
  if (extra.length === 0) return [...base];
  if (base.length === 0) return [...extra];

  const result = [...base];
  extra.forEach((item, j) => {
    const position = Math.round(((j + 1) * result.length) / (extra.length + 1)) + j;
    result.splice(Math.min(position, result.length), 0, item);
  });
  return result;
}

export async function buildSession(userId: string, languageId: string) {
  const budget = await getQueueBudget(userId, languageId);
  const [dueIds, newIds] = await Promise.all([
    findDueWordIds(userId, languageId, budget),
    findNewWordIds(userId, languageId, budget),
  ]);

  const settings = await getSrsSettings(userId, languageId);
  const orderedIds =
    settings.newCardsPosition === 'interleaved' ? interleaveEvenly(dueIds, newIds) : [...dueIds, ...newIds];
  const cards = (
    await Promise.all(orderedIds.map((id) => buildCardForWord(id, userId, settings.typeSwitchStatus)))
  ).filter((c): c is SrsCard => c !== null);

  return { cards, dueCount: dueIds.length, newCount: newIds.length };
}

export async function bumpDailyStats(
  userId: string,
  languageId: string,
  field: 'newIntroducedCount' | 'reviewsCompletedCount'
): Promise<void> {
  const date = todayDateString();
  await db
    .insert(srsDailyStats)
    .values({ userId, languageId, date, [field]: 1 })
    .onConflictDoUpdate({
      target: [srsDailyStats.userId, srsDailyStats.languageId, srsDailyStats.date],
      set: { [field]: sql`${srsDailyStats[field]} + 1`, updatedAt: new Date() },
    });
}
