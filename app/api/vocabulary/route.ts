import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { words, wordInstances, languages } from '@/lib/db/schema';
import { eq, ne, and, ilike, asc, desc, count, countDistinct, inArray, SQL } from 'drizzle-orm';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import type { VocabularyItem } from '@/lib/types/vocabulary';
import type { ApiErrorResponse } from '@/lib/types/api';

// ============================================================================
// GET /api/vocabulary — Paginated, filtered vocabulary list for a language
// ============================================================================

/**
 * Query params:
 *   languageCode  string  required
 *   status        string  optional — one of VocabularyStatus enum values
 *   search        string  optional — ilike match on lemma
 *   sort          string  optional — 'name-asc' | 'dict-freq-desc' | 'user-freq-desc' | 'status'
 *   page          number  optional — default 1
 *   limit         number  optional — default 50, max 100
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const languageCode = searchParams.get('languageCode');
    const statusParam = searchParams.get('status');
    const searchParam = searchParams.get('search');
    const sortParam = searchParams.get('sort') ?? 'name-asc';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));

    if (!languageCode?.trim()) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'languageCode query parameter is required' },
        { status: 400 }
      );
    }

    const language = await db.query.languages.findFirst({
      where: eq(languages.code, languageCode),
    });

    if (!language) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Language not found: ${languageCode}` },
        { status: 404 }
      );
    }

    // ========================================================================
    // Build WHERE conditions
    // ========================================================================

    const conditions: SQL[] = [eq(words.languageId, language.id)];

    if (statusParam && Object.values(VocabularyStatus).includes(statusParam as VocabularyStatus)) {
      conditions.push(eq(words.status, statusParam as VocabularyStatus));
    } else {
      conditions.push(ne(words.status, VocabularyStatus.IGNORE));
    }

    if (searchParam?.trim()) {
      conditions.push(ilike(words.lemma, `%${searchParam.trim()}%`));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    // ========================================================================
    // Build ORDER BY
    // ========================================================================

    let orderByClause;
    switch (sortParam) {
      case 'dict-freq-desc':
        orderByClause = desc(words.dictionaryFrequency);
        break;
      case 'user-freq-desc':
        orderByClause = desc(words.userFrequency);
        break;
      case 'status':
        orderByClause = asc(words.status);
        break;
      default:
        orderByClause = asc(words.lemma);
    }

    // ========================================================================
    // Count + paginated fetch (parallel)
    // ========================================================================

    const offset = (page - 1) * limit;

    const [[{ total }], rows] = await Promise.all([
      db.select({ total: count() }).from(words).where(whereClause),
      db
        .select({
          id: words.id,
          lemma: words.lemma,
          status: words.status,
          dictionaryFrequency: words.dictionaryFrequency,
          userFrequency: words.userFrequency,
          translation: words.translation,
        })
        .from(words)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset),
    ]);

    // Batch-fetch distinct text counts for this page of words
    let textCountMap: Record<string, number> = {};
    if (rows.length > 0) {
      const wordIds = rows.map((r) => r.id);
      const counts = await db
        .select({
          wordId: wordInstances.wordId,
          textCount: countDistinct(wordInstances.textId),
        })
        .from(wordInstances)
        .where(inArray(wordInstances.wordId, wordIds))
        .groupBy(wordInstances.wordId);
      textCountMap = Object.fromEntries(counts.map((c) => [c.wordId, Number(c.textCount)]));
    }

    const vocabItems: VocabularyItem[] = rows.map((r) => ({
      id: r.id,
      lemma: r.lemma,
      status: r.status as VocabularyStatus,
      dictionaryFrequency: r.dictionaryFrequency,
      userFrequency: r.userFrequency,
      translation: r.translation ?? '',
      tags: [],
      textCount: textCountMap[r.id] ?? 0,
    }));

    return NextResponse.json({
      words: vocabItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[Vocabulary] Error:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Internal server error fetching vocabulary' },
      { status: 500 }
    );
  }
}
