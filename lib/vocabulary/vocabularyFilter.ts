import { and, eq, ilike, inArray, ne, SQL } from 'drizzle-orm';
import { words } from '@/lib/db/schema';
import { VocabularyStatus } from '@/lib/types/vocabulary';

export interface VocabularyFilterParams {
  languageId: string;
  userId: string;
  /** Comma-separated VocabularyStatus values (multiselect filter chips), or null/empty for the default. */
  statusParam?: string | null;
  searchParam?: string | null;
}

/**
 * Shared WHERE-clause builder for the vocabulary list and ids endpoints —
 * keeps the "no status filter -> exclude IGNORE/UNKNOWN" default in one
 * place so the two endpoints can't drift out of sync on what counts as
 * a "match".
 */
export function buildVocabularyWhereClause({
  languageId,
  userId,
  statusParam,
  searchParam,
}: VocabularyFilterParams): SQL {
  const conditions: SQL[] = [eq(words.languageId, languageId), eq(words.userId, userId)];

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

  return conditions.length > 1 ? and(...conditions)! : conditions[0];
}
