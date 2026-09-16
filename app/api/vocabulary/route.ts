import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { words, wordInstances, languages, wordTranslations } from '@/lib/db/schema';
import { eq, ne, and, ilike, asc, desc, count, countDistinct, inArray, SQL } from 'drizzle-orm';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import type { VocabularyItem } from '@/lib/types/vocabulary';
import type { WordTranslation } from '@/lib/db/schema/wordTranslations';
import type { ApiErrorResponse } from '@/lib/types/api';
import { requireUser } from '@/lib/auth/requireUser';

// ============================================================================
// GET /api/vocabulary — Paginated, filtered vocabulary list for a language
// ============================================================================

/**
 * Query params:
 *   languageCode  string  required
 *   status        string  optional — one of VocabularyStatus enum values
 *   search        string  optional — ilike match on lemma
 *   sort          string  optional — 'recent' | 'name-asc' | 'dict-freq-desc' | 'user-freq-desc' | 'status'
 *   page          number  optional — default 1
 *   limit         number  optional — default 50, max 100
 */
export async function GET(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const languageCode = searchParams.get('languageCode');
    const statusParam = searchParams.get('status');
    const searchParam = searchParams.get('search');
    const sortParam = searchParams.get('sort') ?? 'recent';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));

    if (!languageCode?.trim()) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'languageCode query parameter is required' },
        { status: 400 }
      );
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

    // ========================================================================
    // Build WHERE conditions
    // ========================================================================

    const conditions: SQL[] = [eq(words.languageId, language.id), eq(words.userId, user.id)];

    // status may be a single value or a comma-separated list (multiselect filter chips)
    const requestedStatuses = (statusParam?.split(',') ?? [])
      .map((s) => s.trim())
      .filter((s): s is VocabularyStatus =>
        Object.values(VocabularyStatus).includes(s as VocabularyStatus)
      );

    if (requestedStatuses.length > 0) {
      conditions.push(inArray(words.status, requestedStatuses));
    } else {
      conditions.push(ne(words.status, VocabularyStatus.IGNORE));
      conditions.push(ne(words.status, VocabularyStatus.UNKNOWN));
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
      case 'recent':
        orderByClause = desc(words.updatedAt);
        break;
      case 'dict-freq-desc':
        orderByClause = desc(words.dictionaryFrequency);
        break;
      case 'user-freq-desc':
        orderByClause = desc(words.userFrequency);
        break;
      case 'status':
        orderByClause = asc(words.status);
        break;
      case 'name-asc':
        orderByClause = asc(words.lemma);
        break;
      default:
        orderByClause = desc(words.createdAt);
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

    // Prefer word_translations (populated by auto-translation/user edits) over
    // the legacy words.translation column — same precedence as the Reader's
    // /api/texts/[id]/word-instances route.
    const wordTranslationMap = new Map<string, WordTranslation>();
    if (language.defaultTranslationLangCode && rows.length > 0) {
      const wordIds = rows.map((r) => r.id);
      const translations = await db
        .select()
        .from(wordTranslations)
        .where(
          and(
            inArray(wordTranslations.wordId, wordIds),
            eq(wordTranslations.targetLangCode, language.defaultTranslationLangCode)
          )
        );
      for (const t of translations) {
        wordTranslationMap.set(t.wordId, t);
      }
    }

    const vocabItems: VocabularyItem[] = rows.map((r) => ({
      id: r.id,
      lemma: r.lemma,
      status: r.status as VocabularyStatus,
      dictionaryFrequency: r.dictionaryFrequency,
      userFrequency: r.userFrequency,
      translation: wordTranslationMap.get(r.id)?.translation ?? r.translation ?? '',
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
