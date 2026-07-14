import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { languages, words, texts } from '@/lib/db/schema';
import { eq, and, isNotNull, inArray, sql, desc } from 'drizzle-orm';
import type { CefrBand } from '@/lib/types/api';

export interface PublicStatsResponse {
  knownCount: number;
  wellKnownCount: number;
  totalKnown: number;
  languageName: string;
  languageCode: string;
  cefrBand: CefrBand;
  streak: number;
}

// GET /api/public/stats?userId=xxx&lang=es
// Unauthenticated — returns aggregated vocabulary stats for a user's language.
// Exposes only counts (no word list, no email, no PII).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const lang = searchParams.get('lang');

  if (!userId || !lang) {
    return NextResponse.json({ error: 'userId and lang query params are required' }, { status: 400 });
  }

  try {
    const language = await db.query.languages.findFirst({
      where: and(eq(languages.code, lang), eq(languages.userId, userId)),
    });

    if (!language) {
      return NextResponse.json({ error: 'Language not found' }, { status: 404 });
    }

    const [knownWordRows, activityDates] = await Promise.all([
      db
        .select({ dictionaryFrequency: words.dictionaryFrequency, status: words.status })
        .from(words)
        .where(
          and(
            eq(words.languageId, language.id),
            eq(words.userId, userId),
            inArray(words.status, ['KNOWN', 'WELL_KNOWN']),
          )
        ),

      db
        .selectDistinct({ date: sql<string>`DATE(${texts.lastViewedAt} AT TIME ZONE 'UTC')` })
        .from(texts)
        .where(
          and(eq(texts.languageId, language.id), eq(texts.userId, userId), isNotNull(texts.lastViewedAt))
        )
        .orderBy(desc(sql`DATE(${texts.lastViewedAt} AT TIME ZONE 'UTC')`)),
    ]);

    const knownCount = knownWordRows.filter((w) => w.status === 'KNOWN').length;
    const wellKnownCount = knownWordRows.filter((w) => w.status === 'WELL_KNOWN').length;
    const totalKnown = knownCount + wellKnownCount;

    // Zipf-weighted CEFR band — mirrors the formula in /api/stats
    const MAX_VOCAB = 10_000;
    const H = Math.log(MAX_VOCAB) + 0.5772;
    const zipfNumerator = knownWordRows.reduce((sum, w) => {
      const rank = MAX_VOCAB * (1 - w.dictionaryFrequency / 100) + 1;
      return sum + 1 / rank;
    }, 0);
    const readingCoverage = Math.min(98, Math.round((zipfNumerator / H) * 1000) / 10);
    const cefrBand: CefrBand =
      readingCoverage >= 96 ? 'C2' :
      readingCoverage >= 92 ? 'C1' :
      readingCoverage >= 84 ? 'B1-B2' :
      readingCoverage >= 77 ? 'A2-B1' : 'A1-A2';

    // Reading streak (consecutive UTC calendar days with text activity)
    const prevDay = (d: string) =>
      new Date(new Date(d).getTime() - 86_400_000).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = prevDay(today);
    const dates = activityDates.map((r) => r.date);
    let streak = 0;
    let cursor: string | null = dates[0] === today || dates[0] === yesterday ? dates[0] : null;
    if (cursor) {
      for (const d of dates) {
        if (d === cursor) { streak++; cursor = prevDay(cursor); }
        else break;
      }
    }

    return NextResponse.json<PublicStatsResponse>({
      knownCount,
      wellKnownCount,
      totalKnown,
      languageName: language.name,
      languageCode: language.code,
      cefrBand,
      streak,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
