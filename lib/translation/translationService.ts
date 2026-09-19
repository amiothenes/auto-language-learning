import { db } from '../db';
import { wordTranslations, texts, languages, wordInstances, words } from '../db/schema';
import { eq, and, inArray, ne } from 'drizzle-orm';
import { dictionaryLookup, dictionaryExamples, translateWord, isAzureConfigured } from './azureTranslator';
import { wiktionaryLookup } from './wiktionary';
import { resolveTranslationTarget } from '../languages/presets';
import type { TranslationSource } from '../db/schema/wordTranslations';

export type FetchTranslationResult = {
  translation: string | null;
  source: TranslationSource;
};

/**
 * Budget for one background translation job. Import routes export
 * maxDuration = 300, and the import work itself runs before the job starts,
 * so stop well short of the limit and let the next reader-open retry
 * (see claimTranslationRetry) pick up whatever is left.
 */
export const TRANSLATION_TIME_BUDGET_MS = 200_000;

/**
 * Fetches a translation for a single lemma and upserts the result into word_translations.
 * Cascade: Azure Dictionary Lookup → Azure Translate → Wiktionary → null
 *
 * Outcomes:
 *  - found: row written with the translation.
 *  - definitive miss (every source answered "nothing"): a placeholder row with a
 *    null translation is written, so the word isn't re-billed on every retry pass.
 *  - transient failure (429 / 5xx / quota): Azure helpers throw, nothing is
 *    written, and the word stays eligible for the next retry.
 *
 * Skips if a 'user' translation already exists (user overrides are never clobbered).
 * TODO(auth): add userId param and scope upsert per-user when auth lands
 */
export async function fetchAndStoreTranslation(
  wordId: string,
  lemma: string,
  sourceLangCode: string,
  targetLangCode: string
): Promise<FetchTranslationResult> {
  const existing = await db.query.wordTranslations.findFirst({
    where: and(
      eq(wordTranslations.wordId, wordId),
      eq(wordTranslations.targetLangCode, targetLangCode)
    ),
  });
  if (existing?.source === 'user') {
    return { translation: existing.translation, source: 'user' };
  }

  let translation: string | null = null;
  let meanings = null;
  let exampleSentence: string | null = null;
  let exampleSentenceTranslation: string | null = null;
  let source: TranslationSource = 'azure';

  // Step 1: Azure Dictionary Lookup — best quality, returns POS + multiple meanings
  const azureDict = await dictionaryLookup(lemma, sourceLangCode, targetLangCode);
  if (azureDict) {
    translation = azureDict.primaryTranslation;
    meanings = azureDict.meanings;
    source = 'azure';

    const example = await dictionaryExamples(
      lemma,
      azureDict.primaryTranslation,
      sourceLangCode,
      targetLangCode
    );
    if (example) {
      exampleSentence = example.source;
      exampleSentenceTranslation = example.target;
    }
  } else {
    // Step 2: Azure general Translate — works for all 100+ language pairs
    const azureFallback = await translateWord(lemma, sourceLangCode, targetLangCode);
    if (azureFallback) {
      translation = azureFallback;
      source = 'azure';
    } else {
      // Step 3: Wiktionary — completely free, good coverage for major languages
      const wiki = await wiktionaryLookup(lemma, sourceLangCode);
      if (wiki) {
        meanings = wiki.meanings;
        // Wiktionary provides monolingual definitions, not native-language translations
        translation = wiki.meanings[0]?.definitions[0] ?? null;
        exampleSentence = wiki.exampleSentence;
        source = 'wiktionary';
      }
    }
  }

  // Without an Azure key every lookup "misses" trivially — that says nothing
  // about the word, so don't cache it as a definitive miss.
  if (translation === null && meanings === null && !isAzureConfigured()) {
    return { translation: null, source: 'azure' };
  }

  await db
    .insert(wordTranslations)
    .values({
      wordId,
      targetLangCode,
      translation,
      meanings,
      exampleSentence,
      exampleSentenceTranslation,
      source,
    })
    .onConflictDoUpdate({
      target: [wordTranslations.wordId, wordTranslations.targetLangCode],
      set: {
        translation,
        meanings,
        exampleSentence,
        exampleSentenceTranslation,
        source,
        updatedAt: new Date(),
      },
      setWhere: ne(wordTranslations.source, 'user'),
    });

  return { translation, source };
}

// Each word costs up to 2 Azure calls, so this is ~16 requests in flight. 25 was
// enough to trip Azure's throttling on a several-thousand-word vocabulary import.
const BATCH_SIZE = 8;
// Workers in a batch start this far apart, so a throttled batch doesn't retry in lockstep.
const STAGGER_MS = 60;

/**
 * Shared batch worker: fetches + stores an Azure/Wiktionary translation for
 * whichever of `wordIds` don't already have a word_translations row for
 * `targetLangCode`. Used by both the per-text and per-word-list entry points.
 *
 * Stops starting new batches once `deadline` (epoch ms) passes and logs how
 * many words are left; they stay row-less, so a later run picks them up.
 */
async function processTranslationsForWordIds(
  wordIds: string[],
  sourceLangCode: string,
  targetLangCode: string,
  logLabel: string,
  deadline: number = Date.now() + TRANSLATION_TIME_BUDGET_MS
): Promise<void> {
  if (wordIds.length === 0) return;

  const existing = await db
    .select({ wordId: wordTranslations.wordId })
    .from(wordTranslations)
    .where(
      and(
        inArray(wordTranslations.wordId, wordIds),
        eq(wordTranslations.targetLangCode, targetLangCode)
      )
    );

  const alreadyTranslated = new Set(existing.map((r) => r.wordId));
  const pendingIds = wordIds.filter((id) => !alreadyTranslated.has(id));

  if (pendingIds.length === 0) return;

  const wordRows = await db
    .select({ id: words.id, lemma: words.lemma })
    .from(words)
    .where(inArray(words.id, pendingIds));

  console.log(`[Translations] Processing ${wordRows.length} lemmas for ${logLabel} → ${targetLangCode}`);

  let translated = 0;
  let noResult = 0;
  let failed = 0;
  let firstError: unknown = null;
  let attempted = 0;

  for (let i = 0; i < wordRows.length; i += BATCH_SIZE) {
    if (Date.now() >= deadline) break;

    const batch = wordRows.slice(i, i + BATCH_SIZE);
    attempted += batch.length;

    await Promise.allSettled(
      batch.map(async ({ id: wordId, lemma }, index) => {
        await new Promise((resolve) => setTimeout(resolve, index * STAGGER_MS));
        try {
          const result = await fetchAndStoreTranslation(wordId, lemma, sourceLangCode, targetLangCode);
          if (result.translation === null) noResult++;
          else translated++;
        } catch (err) {
          // Log only the first error in full — a throttled/quota-exhausted run
          // would otherwise print thousands of identical lines.
          if (firstError === null) {
            firstError = err;
            console.error(`[Translations] First failure, for "${lemma}":`, err);
          }
          failed++;
        }
      })
    );
  }

  const remaining = wordRows.length - attempted;
  console.log(
    `[Translations] ${logLabel} done — ${translated} translated, ${noResult} no result, ${failed} failed` +
      (remaining > 0 ? `, ${remaining} deferred (time budget reached; they'll retry on next open)` : '')
  );
}

// Best-effort, per-server-instance memory of when a text last had a retry
// queued. Serverless instances don't share it, so it only dampens bursts (e.g.
// reloading the Reader repeatedly) rather than guaranteeing at-most-once.
const RETRY_COOLDOWN_MS = 10 * 60 * 1000;
const lastRetryAt = new Map<string, number>();

/**
 * Returns true if a translation retry for this text should be queued now, and
 * records that it was. Used by the Reader's word-instances route when it finds
 * words with no word_translations row.
 */
export function claimTranslationRetry(textId: string): boolean {
  const now = Date.now();
  const last = lastRetryAt.get(textId);
  if (last !== undefined && now - last < RETRY_COOLDOWN_MS) return false;
  lastRetryAt.set(textId, now);
  return true;
}

/**
 * Processes all pending lemma translations for a given text.
 * Called via Next.js `after()` from the import route — runs after response is sent.
 * TODO(auth): accept userId and scope target language per-user when auth lands
 */
export async function processTranslationsForText(
  textId: string,
  deadline: number = Date.now() + TRANSLATION_TIME_BUDGET_MS
): Promise<void> {
  const text = await db.query.texts.findFirst({
    where: eq(texts.id, textId),
    columns: { languageId: true },
  });
  if (!text) return;

  const language = await db.query.languages.findFirst({
    where: eq(languages.id, text.languageId),
    columns: { id: true, code: true, defaultTranslationLangCode: true },
  });
  if (!language) return;

  const targetLangCode = resolveTranslationTarget(language);
  if (!targetLangCode) {
    console.log(`[Translations] No translation target for language ${language.code} (${language.id}) — skipping`);
    return;
  }
  if (!language.defaultTranslationLangCode) {
    console.warn(
      `[Translations] Language ${language.code} (${language.id}) has NULL default_translation_lang_code — using "${targetLangCode}". Set it in Settings → Languages.`
    );
  }

  const instances = await db
    .selectDistinct({ wordId: wordInstances.wordId })
    .from(wordInstances)
    .where(eq(wordInstances.textId, textId));

  if (instances.length === 0) return;

  await processTranslationsForWordIds(
    instances.map((i) => i.wordId),
    language.code,
    targetLangCode,
    `text ${textId}`,
    deadline
  );
}

/**
 * Processes pending translations for an explicit list of word IDs — used by
 * the vocabulary import route for rows that landed with no translation
 * (e.g. an LWT export rated a word without ever typing a gloss for it).
 * Called via Next.js `after()`, same fire-and-forget convention as
 * processTranslationsForText.
 */
export async function processTranslationsForWords(
  wordIds: string[],
  sourceLangCode: string,
  targetLangCode: string
): Promise<void> {
  await processTranslationsForWordIds(wordIds, sourceLangCode, targetLangCode, 'vocabulary import');
}
