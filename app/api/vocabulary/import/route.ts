import { NextRequest, NextResponse, after } from 'next/server';
import { db } from '@/lib/db';
import { words, languages, wordInstances } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import type { ApiErrorResponse } from '@/lib/types/api';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { checkQuota, quotaResponse } from '@/lib/quotas';
import { lookupDictionaryFrequency } from '@/lib/utils/wordFrequency';
import { processTranslationsForWords } from '@/lib/translation/translationService';

// ============================================================================
// POST /api/vocabulary/import — Bulk import vocabulary from the Vocabulary
// page's Import modal. Handles both this app's own header-named CSV/TSV/JSON
// shape and (auto-detected client-side) LWT-shaped positional .tsv/.txt
// files — both arrive here already normalized into ImportedVocabularyData[],
// so this route doesn't need to know which shape the source file was.
// ============================================================================

const BATCH_SIZE = 500;
const MAX_ITEMS = 10000;

interface ImportItem {
  lemma: string;
  translation?: string;
  status?: string;
  dictionaryFrequency?: number;
  romanization?: string;
}

interface ImportRequestBody {
  languageCode: string;
  mergeStrategy: 'skip' | 'update' | 'replace';
  items: ImportItem[];
}

const validStatuses = new Set<string>(Object.values(VocabularyStatus));

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  let body: ImportRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiErrorResponse>({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { languageCode, mergeStrategy, items } = body;

  if (!languageCode?.trim()) {
    return NextResponse.json<ApiErrorResponse>({ error: 'languageCode is required' }, { status: 400 });
  }
  if (!['skip', 'update', 'replace'].includes(mergeStrategy)) {
    return NextResponse.json<ApiErrorResponse>({ error: 'Invalid mergeStrategy' }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json<ApiErrorResponse>({ error: 'items must be a non-empty array' }, { status: 400 });
  }
  if (items.length > MAX_ITEMS) {
    return NextResponse.json<ApiErrorResponse>(
      { error: `Maximum ${MAX_ITEMS} items per import` },
      { status: 400 }
    );
  }

  // Reuses the bulkUpdate limiter — same cost profile as a bulk vocabulary write.
  const rateLimit = await checkRateLimit('bulkUpdate', user.id);
  if (!rateLimit.allowed) {
    return rateLimitResponse('bulkUpdate', rateLimit);
  }

  const wordsQuota = await checkQuota('words', user.id);
  if (!wordsQuota.allowed) {
    return quotaResponse('words', wordsQuota);
  }

  const language = await db.query.languages.findFirst({
    where: and(eq(languages.code, languageCode), eq(languages.userId, user.id)),
  });
  if (!language) {
    return NextResponse.json<ApiErrorResponse>(
      { error: `Language not found: ${languageCode}` },
      { status: 404 }
    );
  }

  const rows = items
    .map((item) => {
      const lemma = item.lemma?.trim().toLowerCase();
      if (!lemma) return null;
      const status: VocabularyStatus =
        item.status && validStatuses.has(item.status)
          ? (item.status as VocabularyStatus)
          : VocabularyStatus.NEWLY_SEEN;
      const providedFrequency =
        typeof item.dictionaryFrequency === 'number' &&
        item.dictionaryFrequency >= 0 &&
        item.dictionaryFrequency <= 100
          ? item.dictionaryFrequency
          : undefined;
      // Corpus-calculated commonality takes priority over whatever the file
      // said — the file's number is only a fallback for lemmas the corpus
      // has no data for (rare words, proper nouns). Always resolves to a
      // concrete number (0 if neither source has one) so every row writes
      // an explicit value rather than silently relying on the column default.
      const dictionaryFrequency =
        lookupDictionaryFrequency(languageCode, lemma) ?? providedFrequency ?? 0;
      return {
        lemma,
        translation: item.translation?.trim() || null,
        status,
        dictionaryFrequency,
        romanization: item.romanization?.trim() || null,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) {
    return NextResponse.json<ApiErrorResponse>(
      { error: 'No valid rows found — each row needs a non-empty lemma' },
      { status: 400 }
    );
  }

  // Collapse duplicate lemmas within this import (e.g. two source rows whose
  // Term differs only in casing, both lowercasing to the same lemma) down to
  // one row before batching. A single INSERT ... ON CONFLICT DO UPDATE
  // statement throws ("ON CONFLICT DO UPDATE command cannot affect row a
  // second time") if its VALUES list contains the same conflict key twice —
  // last occurrence wins, same as a plain re-import overwriting the earlier one.
  const dedupedRows = Array.from(new Map(rows.map((row) => [row.lemma, row])).values());

  let imported = 0;
  // Word IDs that landed (inserted or updated) with no translation at all —
  // an LWT export commonly rates a word without ever typing a gloss for it.
  // Queued below for an async Azure lookup so those rows don't stay blank.
  const wordIdsNeedingTranslation: string[] = [];

  await db.transaction(async (tx) => {
    if (mergeStrategy === 'replace') {
      // A word that has ever appeared in an imported text has word_instances
      // rows pointing at it via a RESTRICT foreign key, so it can't be
      // hard-deleted — and cascading that delete would silently wipe out
      // those texts' word-highlighting data. So "Replace All" hard-deletes
      // only words nothing references (nothing to break), and resets every
      // other existing word for this language back to a fresh/unknown
      // state instead. Either way, no vocabulary data survives that isn't
      // re-established by the import below — words present in the file get
      // overwritten by the upsert loop right after this; words absent from
      // it are left blank, matching "delete all existing vocabulary".
      await tx.delete(words).where(
        and(
          eq(words.languageId, language.id),
          eq(words.userId, user.id),
          sql`NOT EXISTS (SELECT 1 FROM ${wordInstances} WHERE ${wordInstances.wordId} = ${words.id})`
        )
      );
      await tx
        .update(words)
        .set({
          status: 'UNKNOWN',
          translation: null,
          definition: null,
          romanization: null,
          exampleSentence: null,
          dictionaryFrequency: 0,
          updatedAt: new Date(),
        })
        .where(and(eq(words.languageId, language.id), eq(words.userId, user.id)));
    }

    for (let offset = 0; offset < dedupedRows.length; offset += BATCH_SIZE) {
      const batch = dedupedRows.slice(offset, offset + BATCH_SIZE);
      const values = batch.map((row) => ({
        lemma: row.lemma,
        languageId: language.id,
        userId: user.id,
        status: row.status,
        translation: row.translation,
        dictionaryFrequency: row.dictionaryFrequency,
        romanization: row.romanization,
      }));

      if (mergeStrategy === 'skip') {
        // onConflictDoNothing silently no-ops on a duplicate lemma — .returning()
        // tells us how many rows actually landed vs. were skipped as duplicates.
        const inserted = await tx
          .insert(words)
          .values(values)
          .onConflictDoNothing({ target: [words.lemma, words.languageId, words.userId] })
          .returning({ id: words.id, lemma: words.lemma });
        imported += inserted.length;

        // Ignored words are deliberately never looked up — spending an Azure
        // call on a word you've marked "don't care about this" is wasted cost.
        const blankLemmas = new Set(
          batch.filter((r) => !r.translation && r.status !== VocabularyStatus.IGNORE).map((r) => r.lemma)
        );
        for (const w of inserted) {
          if (blankLemmas.has(w.lemma)) wordIdsNeedingTranslation.push(w.id);
        }
      } else {
        // 'update', and 'replace' (table already cleared above, so this is
        // effectively a plain insert). Duplicate lemmas were already
        // collapsed above — Postgres errors if a single ON CONFLICT DO
        // UPDATE statement's VALUES list hits the same conflict key twice.
        const upserted = await tx
          .insert(words)
          .values(values)
          .onConflictDoUpdate({
            target: [words.lemma, words.languageId, words.userId],
            set: {
              status: sql`EXCLUDED.status`,
              translation: sql`COALESCE(EXCLUDED.translation, ${words.translation})`,
              // Always freshly calculated (corpus lookup, falling back to a
              // provided value, falling back to 0) — never partially stale
              // via a COALESCE-to-existing fallback like translation gets.
              dictionaryFrequency: sql`EXCLUDED.dictionary_frequency`,
              romanization: sql`COALESCE(EXCLUDED.romanization, ${words.romanization})`,
              updatedAt: sql`now()`,
            },
          })
          .returning({ id: words.id, lemma: words.lemma, translation: words.translation, status: words.status });
        imported += batch.length;

        // Ignored words are deliberately never looked up — spending an Azure
        // call on a word you've marked "don't care about this" is wasted cost.
        for (const w of upserted) {
          if (!w.translation && w.status !== VocabularyStatus.IGNORE) wordIdsNeedingTranslation.push(w.id);
        }
      }
    }
  });

  if (wordIdsNeedingTranslation.length > 0 && language.defaultTranslationLangCode) {
    const targetLangCode = language.defaultTranslationLangCode;
    // Fire-and-forget, same convention as the text-import route: runs after
    // the response is sent so a large import isn't held up waiting on Azure.
    after(async () => {
      try {
        await processTranslationsForWords(wordIdsNeedingTranslation, languageCode, targetLangCode);
      } catch (err) {
        console.error('[Vocabulary Import] Translation job failed:', err);
      }
    });
  }

  return NextResponse.json({ imported, skipped: items.length - dedupedRows.length });
}
