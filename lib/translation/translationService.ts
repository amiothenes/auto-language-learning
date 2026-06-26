import { db } from '../db';
import { wordTranslations, texts, languages, wordInstances, words } from '../db/schema';
import { eq, and, inArray, ne } from 'drizzle-orm';
import { dictionaryLookup, dictionaryExamples, translateWord } from './azureTranslator';
import { wiktionaryLookup } from './wiktionary';
import type { TranslationSource } from '../db/schema/wordTranslations';

export type FetchTranslationResult = {
  translation: string | null;
  source: TranslationSource;
};

/**
 * Fetches a translation for a single lemma and upserts the result into word_translations.
 * Cascade: Azure Dictionary Lookup → Azure Translate → Wiktionary → null
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

  if (translation === null && meanings === null) {
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

const BATCH_SIZE = 25;

/**
 * Processes all pending lemma translations for a given text.
 * Called via Next.js `after()` from the import route — runs after response is sent.
 * TODO(auth): accept userId and scope target language per-user when auth lands
 */
export async function processTranslationsForText(textId: string): Promise<void> {
  const text = await db.query.texts.findFirst({
    where: eq(texts.id, textId),
    columns: { languageId: true },
  });
  if (!text) return;

  const language = await db.query.languages.findFirst({
    where: eq(languages.id, text.languageId),
    columns: { id: true, code: true, defaultTranslationLangCode: true },
  });
  if (!language?.defaultTranslationLangCode) {
    console.log(`[Translations] No defaultTranslationLangCode for language ${text.languageId} — skipping`);
    return;
  }

  const targetLangCode = language.defaultTranslationLangCode;

  const instances = await db
    .selectDistinct({ wordId: wordInstances.wordId })
    .from(wordInstances)
    .where(eq(wordInstances.textId, textId));

  if (instances.length === 0) return;

  const allWordIds = instances.map((i) => i.wordId);

  const existing = await db
    .select({ wordId: wordTranslations.wordId })
    .from(wordTranslations)
    .where(
      and(
        inArray(wordTranslations.wordId, allWordIds),
        eq(wordTranslations.targetLangCode, targetLangCode)
      )
    );

  const alreadyTranslated = new Set(existing.map((r) => r.wordId));
  const pendingIds = allWordIds.filter((id) => !alreadyTranslated.has(id));

  if (pendingIds.length === 0) return;

  const wordRows = await db
    .select({ id: words.id, lemma: words.lemma })
    .from(words)
    .where(inArray(words.id, pendingIds));

  console.log(`[Translations] Processing ${wordRows.length} lemmas for text ${textId} → ${targetLangCode}`);

  let processed = 0;
  let failed = 0;

  for (let i = 0; i < wordRows.length; i += BATCH_SIZE) {
    const batch = wordRows.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async ({ id: wordId, lemma }) => {
        try {
          await fetchAndStoreTranslation(wordId, lemma, language.code, targetLangCode);
          processed++;
        } catch (err) {
          console.error(`[Translations] Failed for "${lemma}":`, err);
          failed++;
        }
      })
    );
  }

  console.log(`[Translations] Done — ${processed} ok, ${failed} failed`);
}
