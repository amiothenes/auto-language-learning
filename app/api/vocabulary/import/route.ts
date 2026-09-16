import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { words, languages } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import type { ApiErrorResponse } from '@/lib/types/api';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { lookupDictionaryFrequency } from '@/lib/utils/wordFrequency';

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

  let imported = 0;

  await db.transaction(async (tx) => {
    if (mergeStrategy === 'replace') {
      await tx.delete(words).where(and(eq(words.languageId, language.id), eq(words.userId, user.id)));
    }

    for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
      const batch = rows.slice(offset, offset + BATCH_SIZE);
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
          .returning({ id: words.id });
        imported += inserted.length;
      } else {
        // 'update', and 'replace' (table already cleared above, so this is
        // effectively a plain insert — upsert here just tolerates duplicate
        // lemmas within the same import file).
        await tx
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
          });
        imported += batch.length;
      }
    }
  });

  return NextResponse.json({ imported, skipped: items.length - rows.length });
}
