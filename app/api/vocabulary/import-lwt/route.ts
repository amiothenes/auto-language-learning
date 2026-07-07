import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { words, languages } from '@/lib/db/schema';
import { sql, eq } from 'drizzle-orm';
import type { ImportLwtResponse, ApiErrorResponse } from '@/lib/types/api';
import { requireUser } from '@/lib/auth/requireUser';

// ============================================================================
// POST /api/vocabulary/import-lwt — Bulk import vocabulary from LWT .tsv export
// ============================================================================

const BATCH_SIZE = 500;

// String union matching the Drizzle-inferred pgEnum type for words.status
type WordStatus = 'NEWLY_SEEN' | 'FAMILIAR' | 'KNOWN' | 'WELL_KNOWN' | 'IGNORE';

function mapLwtStatus(raw: string): WordStatus {
  const n = parseInt(raw, 10);
  if (n === 1) return 'NEWLY_SEEN';
  if (n === 2 || n === 3) return 'FAMILIAR';
  if (n === 4 || n === 5) return 'KNOWN';
  if (n === 99) return 'WELL_KNOWN';
  if (n === 98) return 'IGNORE';
  return 'NEWLY_SEEN';
}

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Expected multipart/form-data' },
      { status: 400 }
    );
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json<ApiErrorResponse>(
      { error: 'No file provided — include a "file" field in the form data' },
      { status: 400 }
    );
  }

  const languageIdOverride = (formData.get('languageId') as string | null) || null;

  const text = await file.text();
  const lines = text.split('\n').map((l) => l.trimEnd()).filter(Boolean);

  if (lines.length === 0) {
    return NextResponse.json<ApiErrorResponse>({ error: 'File is empty' }, { status: 400 });
  }

  // ========================================================================
  // 1. Parse all rows, collect unique language names
  // ========================================================================

  type ParsedRow = {
    lemma: string;
    definition: string;
    exampleSentence: string;
    status: WordStatus;
    languageName: string;
  };

  const parsed: ParsedRow[] = [];
  const skippedReasons: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].split('\t');

    if (cols.length < 6) {
      skippedReasons.push(`Line ${i + 1}: expected ≥6 columns, got ${cols.length}`);
      continue;
    }

    const lemma = cols[0].trim();
    if (!lemma) {
      skippedReasons.push(`Line ${i + 1}: empty lemma`);
      continue;
    }

    const definition = cols[1].trim();
    const exampleSentence = cols[2].replace(/\{|\}/g, '').trim();
    // cols[3] = tags (ignored)
    const rawStatus = cols[4].trim();
    const languageName = cols[5].trim();

    if (!languageName) {
      skippedReasons.push(`Line ${i + 1}: empty language name`);
      continue;
    }

    parsed.push({
      lemma,
      definition,
      exampleSentence,
      status: mapLwtStatus(rawStatus),
      languageName,
    });
  }

  if (parsed.length === 0) {
    return NextResponse.json<ApiErrorResponse>(
      { error: 'No valid rows found in file', details: skippedReasons.slice(0, 10).join('; ') },
      { status: 400 }
    );
  }

  // ========================================================================
  // 2. Resolve languages
  // ========================================================================

  const allLanguages = await db.query.languages.findMany({
    where: eq(languages.userId, user.id),
  });
  const langMap = new Map<string, string>(); // languageName (lower) → language_id

  if (languageIdOverride) {
    // Client confirmed the language — validate the id and apply to all rows
    const overrideLang = allLanguages.find((l) => l.id === languageIdOverride);
    if (!overrideLang) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Language id "${languageIdOverride}" not found in database` },
        { status: 400 }
      );
    }
    for (const row of parsed) {
      langMap.set(row.languageName.toLowerCase(), languageIdOverride);
    }
  } else {
    // Fall back to case-insensitive name matching from column 6
    for (const lang of allLanguages) {
      langMap.set(lang.name.toLowerCase(), lang.id);
    }

    const uniqueLangNames = [...new Set(parsed.map((r) => r.languageName))];
    const mismatches: string[] = [];
    for (const name of uniqueLangNames) {
      if (!langMap.has(name.toLowerCase())) {
        mismatches.push(name);
      }
    }

    if (mismatches.length > 0) {
      const available = allLanguages.map((l) => `"${l.name}" (${l.code})`).join(', ');
      return NextResponse.json<ApiErrorResponse>(
        {
          error: `Language not found in database: ${mismatches.map((m) => `"${m}"`).join(', ')}`,
          details: `Available languages: ${available}`,
        },
        { status: 400 }
      );
    }
  }

  // ========================================================================
  // 3. Upsert in batches
  // ========================================================================

  let imported = 0;

  for (let offset = 0; offset < parsed.length; offset += BATCH_SIZE) {
    const batch = parsed.slice(offset, offset + BATCH_SIZE);

    const values = batch.map((row) => ({
      lemma: row.lemma,
      languageId: langMap.get(row.languageName.toLowerCase())!,
      userId: user.id,
      status: row.status,
      definition: row.definition || null,
      exampleSentence: row.exampleSentence || null,
    }));

    await db
      .insert(words)
      .values(values)
      .onConflictDoUpdate({
        target: [words.lemma, words.languageId],
        set: {
          status: sql`EXCLUDED.status`,
          definition: sql`EXCLUDED.definition`,
          exampleSentence: sql`EXCLUDED.example_sentence`,
          updatedAt: sql`now()`,
        },
      });

    imported += batch.length;
  }

  console.log(
    `[LWT Import] Done — imported/updated: ${imported}, skipped: ${skippedReasons.length}`
  );

  return NextResponse.json<ImportLwtResponse>(
    { imported, skipped: skippedReasons.length, errors: skippedReasons },
    { status: 200 }
  );
}
