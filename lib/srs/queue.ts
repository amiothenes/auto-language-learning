import { db } from '@/lib/db';
import { words, wordInstances, wordReviews, wordTranslations, srsSettings, srsDailyStats, languages, texts } from '@/lib/db/schema';
import { resolveTranslationTarget } from '@/lib/languages/presets';
import { eq, and, lte, inArray, isNull, notInArray, asc, count, sql } from 'drizzle-orm';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import { STATUS_PROGRESSION, stepStatusDown, stepStatusUp } from '@/lib/vocabulary/statusProgression';
import { applySm2 } from '@/lib/srs/sm2';
import { todayDateString } from '@/lib/srs/today';
import type { SrsCard, SrsCardSentence, SrsCardSource, SrsSettingsPayload } from '@/lib/types/api';

export const DEFAULT_SRS_SETTINGS: SrsSettingsPayload = {
  newCardsPerDay: 20,
  reviewsPerDay: 100,
  maxDowngradesPerDay: 1,
  minEligibleStatus: VocabularyStatus.NEWLY_SEEN,
  maxEligibleStatus: VocabularyStatus.KNOWN,
  typeSwitchStatus: VocabularyStatus.FAMILIAR,
  sentenceAudioEnabled: true,
  wordAudioEnabled: true,
  newCardsPosition: 'end',
  excludeSentencesFrom: 'incomplete',
};

const NON_MASTERED = [VocabularyStatus.WELL_KNOWN, VocabularyStatus.IGNORE];

export async function getSrsSettings(userId: string, languageId: string): Promise<SrsSettingsPayload> {
  const row = await db.query.srsSettings.findFirst({
    where: and(eq(srsSettings.userId, userId), eq(srsSettings.languageId, languageId)),
  });
  if (!row) return DEFAULT_SRS_SETTINGS;
  return {
    newCardsPerDay: row.newCardsPerDay,
    reviewsPerDay: row.reviewsPerDay,
    maxDowngradesPerDay: row.maxDowngradesPerDay,
    minEligibleStatus: row.minEligibleStatus as VocabularyStatus,
    maxEligibleStatus: row.maxEligibleStatus as VocabularyStatus,
    typeSwitchStatus: row.typeSwitchStatus as VocabularyStatus,
    sentenceAudioEnabled: row.sentenceAudioEnabled,
    wordAudioEnabled: row.wordAudioEnabled,
    newCardsPosition: row.newCardsPosition,
    excludeSentencesFrom: row.excludeSentencesFrom,
  };
}

// WELL_KNOWN is never reviewable — mastered words are retired from review
// rotation permanently. This caps maxIdx below WELL_KNOWN's position
// regardless of what's stored in settings, so old rows that set
// maxEligibleStatus to WELL_KNOWN are simply reinterpreted, not treated as
// invalid.
const WELL_KNOWN_IDX = STATUS_PROGRESSION.indexOf(VocabularyStatus.WELL_KNOWN);

export function eligibleStatusesFor(settings: SrsSettingsPayload): VocabularyStatus[] {
  const minIdx = STATUS_PROGRESSION.indexOf(settings.minEligibleStatus as (typeof STATUS_PROGRESSION)[number]);
  const maxIdx = Math.min(
    STATUS_PROGRESSION.indexOf(settings.maxEligibleStatus as (typeof STATUS_PROGRESSION)[number]),
    WELL_KNOWN_IDX - 1
  );
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

async function getQueueBudget(
  userId: string,
  languageId: string,
  settings?: SrsSettingsPayload
): Promise<QueueBudget> {
  const resolvedSettings = settings ?? (await getSrsSettings(userId, languageId));
  const eligibleStatuses = eligibleStatusesFor(resolvedSettings);
  const stats = await getDailyStats(userId, languageId, todayDateString());

  const remainingNew = Math.max(0, resolvedSettings.newCardsPerDay - stats.newIntroducedCount);
  const remainingReviews =
    resolvedSettings.reviewsPerDay === null
      ? 500
      : Math.max(0, resolvedSettings.reviewsPerDay - stats.reviewsCompletedCount);

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

interface ChosenSentenceCandidate {
  sentenceId: string;
  surfaceForm: string;
  pos: string | null;
  inflectionData: Record<string, unknown> | null;
  degraded: boolean;
}

/**
 * Builds SrsCards for a batch of word ids in a small constant number of
 * queries, instead of the 6-7 round trips per word this used to cost (words,
 * translations, word instances fetched twice, sentences fetched twice,
 * reviews — all `inArray`'d across the whole batch here instead). Assembly
 * (sentence/rival-count selection, preview computation) happens in JS from
 * the batch results, preserving the exact same per-word selection logic.
 */
async function buildCardsForWords(
  orderedIds: string[],
  userId: string,
  languageId: string,
  typeSwitchStatus: VocabularyStatus,
  excludeSentencesFrom: SrsSettingsPayload['excludeSentencesFrom']
): Promise<SrsCard[]> {
  if (orderedIds.length === 0) return [];

  const language = await db.query.languages.findFirst({
    where: eq(languages.id, languageId),
    columns: { code: true, defaultTranslationLangCode: true },
  });
  const targetLangCode = language ? resolveTranslationTarget(language) : null;

  const [wordRows, translationRows, instanceRows, reviewRows] = await Promise.all([
    db.query.words.findMany({ where: and(inArray(words.id, orderedIds), eq(words.userId, userId)) }),
    targetLangCode
      ? db.query.wordTranslations.findMany({
          where: and(inArray(wordTranslations.wordId, orderedIds), eq(wordTranslations.targetLangCode, targetLangCode)),
        })
      : Promise.resolve([]),
    db.query.wordInstances.findMany({
      where: inArray(wordInstances.wordId, orderedIds),
      columns: { wordId: true, surfaceForm: true, sentenceId: true, pos: true, inflectionData: true, textId: true },
    }),
    db.query.wordReviews.findMany({ where: inArray(wordReviews.wordId, orderedIds) }),
  ]);

  const wordMap = new Map(wordRows.map((w) => [w.id, w]));
  const translationMap = new Map(translationRows.map((t) => [t.wordId, t]));
  const reviewMap = new Map(reviewRows.map((r) => [r.wordId, r]));

  const instancesByWord = new Map<string, Array<(typeof instanceRows)[number] & { sentenceId: string }>>();
  for (const instance of instanceRows) {
    if (instance.sentenceId === null) continue;
    const candidate = instance as (typeof instanceRows)[number] & { sentenceId: string };
    const list = instancesByWord.get(instance.wordId);
    if (list) list.push(candidate);
    else instancesByWord.set(instance.wordId, [candidate]);
  }

  // Exclude sentence candidates belonging to texts the user hasn't engaged
  // with yet, per excludeSentencesFrom. A word's every occurrence being in an
  // excluded text must never cause that word to drop out of review entirely —
  // fall back to the unfiltered pool for that word instead (same spirit as
  // the rival-count "degraded" fallback below).
  let effectiveInstancesByWord = instancesByWord;
  if (excludeSentencesFrom !== 'none') {
    const textIds = [...new Set(instanceRows.map((i) => i.textId))];
    const textRows = textIds.length
      ? await db
          .select({ id: texts.id, viewCount: texts.viewCount, knownPercentage: texts.knownPercentage })
          .from(texts)
          .where(inArray(texts.id, textIds))
      : [];
    const excludedTextIds = new Set(
      textRows
        .filter((t) => (excludeSentencesFrom === 'unopened' ? t.viewCount === 0 : t.knownPercentage < 100))
        .map((t) => t.id)
    );
    effectiveInstancesByWord = new Map();
    for (const [wordId, instances] of instancesByWord) {
      const filtered = instances.filter((inst) => !excludedTextIds.has(inst.textId));
      effectiveInstancesByWord.set(wordId, filtered.length > 0 ? filtered : instances);
    }
  }

  const switchIdx = STATUS_PROGRESSION.indexOf(typeSwitchStatus as (typeof STATUS_PROGRESSION)[number]);
  const cardTypeByWord = new Map<string, 'SENTENCE' | 'WORD'>();
  const rivalCheckSentenceIds = new Set<string>();
  for (const id of orderedIds) {
    const word = wordMap.get(id);
    if (!word) continue;
    const statusIdx = STATUS_PROGRESSION.indexOf(word.status as (typeof STATUS_PROGRESSION)[number]);
    const cardType: 'SENTENCE' | 'WORD' = statusIdx < switchIdx ? 'SENTENCE' : 'WORD';
    cardTypeByWord.set(id, cardType);
    if (cardType === 'SENTENCE') {
      for (const instance of effectiveInstancesByWord.get(id) ?? []) rivalCheckSentenceIds.add(instance.sentenceId);
    }
  }

  // Type A ("1T"): a sentence qualifies if this is its only non-mastered
  // target word — computed once for every SENTENCE-type candidate sentence
  // in the whole batch rather than once per word.
  const rivalMap = new Map<string, number>();
  if (rivalCheckSentenceIds.size > 0) {
    const rivalCounts = await db
      .select({ sentenceId: wordInstances.sentenceId, cnt: count() })
      .from(wordInstances)
      .innerJoin(words, eq(wordInstances.wordId, words.id))
      .where(and(inArray(wordInstances.sentenceId, [...rivalCheckSentenceIds]), notInArray(words.status, NON_MASTERED)))
      .groupBy(wordInstances.sentenceId);
    for (const r of rivalCounts) {
      if (r.sentenceId) rivalMap.set(r.sentenceId, Number(r.cnt));
    }
  }

  const chosenByWord = new Map<string, ChosenSentenceCandidate>();
  for (const id of orderedIds) {
    const cardType = cardTypeByWord.get(id);
    const candidates = effectiveInstancesByWord.get(id) ?? [];
    if (!cardType || candidates.length === 0) continue;

    if (cardType === 'WORD') {
      const chosen = pickRandom(candidates)!;
      chosenByWord.set(id, {
        sentenceId: chosen.sentenceId,
        surfaceForm: chosen.surfaceForm,
        pos: chosen.pos,
        inflectionData: chosen.inflectionData,
        degraded: false,
      });
      continue;
    }

    const cleanCandidates = candidates.filter((c) => (rivalMap.get(c.sentenceId) ?? 1) === 1);
    const chosen = pickRandom(cleanCandidates) ?? pickRandom(candidates)!;
    chosenByWord.set(id, {
      sentenceId: chosen.sentenceId,
      surfaceForm: chosen.surfaceForm,
      pos: chosen.pos,
      inflectionData: chosen.inflectionData,
      degraded: cleanCandidates.length === 0,
    });
  }

  const chosenSentenceIds = [...new Set([...chosenByWord.values()].map((c) => c.sentenceId))];
  const sentenceRows = chosenSentenceIds.length
    ? await db.query.sentences.findMany({
        where: (s, { inArray }) => inArray(s.id, chosenSentenceIds),
        with: { text: { with: { series: true } } },
      })
    : [];
  const sentenceMap = new Map(sentenceRows.map((s) => [s.id, s]));

  const cards: SrsCard[] = [];
  for (const id of orderedIds) {
    const word = wordMap.get(id);
    if (!word) continue;

    const status = word.status as VocabularyStatus;
    const cardType = cardTypeByWord.get(id)!;
    const translationRow = translationMap.get(id);
    const chosen = chosenByWord.get(id);
    const sentenceRow = chosen ? sentenceMap.get(chosen.sentenceId) : undefined;

    let sentence: SrsCardSentence | null = null;
    let source: SrsCardSource | null = null;
    if (chosen && sentenceRow) {
      sentence = {
        sentenceId: sentenceRow.id,
        content: sentenceRow.content,
        targetSurface: chosen.surfaceForm,
        degraded: chosen.degraded,
      };
      if (sentenceRow.text) {
        source = {
          textId: sentenceRow.text.id,
          textTitle: sentenceRow.text.title,
          seriesId: sentenceRow.text.series?.id ?? null,
          seriesName: sentenceRow.text.series?.name ?? null,
        };
      }
    }

    const review = reviewMap.get(id);
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

    cards.push({
      wordId: word.id,
      cardType,
      lemma: word.lemma,
      translation: translationRow?.translation ?? word.translation ?? null,
      meanings: translationRow?.meanings ?? null,
      pos: chosen?.pos ?? null,
      inflectionData: chosen?.inflectionData ?? null,
      romanization: word.romanization,
      sentence,
      source,
      isNew: !review,
      status,
      preview: {
        knew: { status: stepStatusUp(status), intervalDays: knewSm2.intervalDays },
        didntKnow: { status: stepStatusDown(status), intervalDays: didntKnowSm2.intervalDays },
      },
    });
  }

  return cards;
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
  const settings = await getSrsSettings(userId, languageId);
  const budget = await getQueueBudget(userId, languageId, settings);
  const [dueIds, newIds] = await Promise.all([
    findDueWordIds(userId, languageId, budget),
    findNewWordIds(userId, languageId, budget),
  ]);

  const orderedIds =
    settings.newCardsPosition === 'interleaved' ? interleaveEvenly(dueIds, newIds) : [...dueIds, ...newIds];
  const cards = await buildCardsForWords(orderedIds, userId, languageId, settings.typeSwitchStatus, settings.excludeSentencesFrom);

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
