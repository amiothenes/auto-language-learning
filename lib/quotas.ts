import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { texts, series, words } from '@/lib/db/schema';
import type { ApiErrorResponse } from '@/lib/types/api';

// Per-user caps on total row counts, separate from the existing per-request
// size caps (texts.import's 50k chars, vocabulary import's 10k items). Those
// cap a single call; these cap how much a user can accumulate across calls.
//
// Unlike checkRateLimit (Redis-backed, fails open), this is a plain indexed
// Postgres COUNT — it fails closed: a DB error here propagates like any other
// DB error in these routes (caught by the route's own try/catch → 500),
// rather than silently allowing unbounded growth.

export type QuotaName = 'texts' | 'series' | 'words';

const QUOTA_CONFIG: Record<QuotaName, { table: typeof texts | typeof series | typeof words; limit: number; label: string }> = {
  texts: { table: texts, limit: 10_000, label: 'texts' },
  series: { table: series, limit: 1_000, label: 'series' },
  words: { table: words, limit: 150_000, label: 'vocabulary words' },
};

export interface QuotaCheck {
  allowed: boolean;
  current: number;
  limit: number;
}

export async function checkQuota(name: QuotaName, userId: string): Promise<QuotaCheck> {
  const { table, limit } = QUOTA_CONFIG[name];
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(table)
    .where(eq(table.userId, userId));

  return { allowed: count < limit, current: count, limit };
}

export function quotaResponse(name: QuotaName, check: QuotaCheck) {
  return NextResponse.json<ApiErrorResponse>(
    {
      error: `You've reached the limit of ${check.limit.toLocaleString()} ${QUOTA_CONFIG[name].label}. Delete some to add more.`,
    },
    { status: 403 }
  );
}
