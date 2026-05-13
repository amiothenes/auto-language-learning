import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { texts } from '@/lib/db/schema';
import { eq, and, lt, gt, desc, asc } from 'drizzle-orm';
import type { ApiErrorResponse } from '@/lib/types/api';

interface AdjacentText {
  id: string;
  title: string;
}

interface AdjacentTextsResponse {
  prev: AdjacentText | null;
  next: AdjacentText | null;
}

// ============================================================================
// GET /api/texts/[id]/adjacent
// Returns the previous and next text pages within the same series, ordered by
// the `order` column. Returns null for either neighbour if none exists.
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const current = await db.query.texts.findFirst({
    where: eq(texts.id, id),
    columns: { seriesId: true, order: true },
  });

  if (!current) {
    return NextResponse.json<ApiErrorResponse>(
      { error: `Text not found: ${id}` },
      { status: 404 }
    );
  }

  const [prev, next] = await Promise.all([
    db.query.texts.findFirst({
      where: and(
        eq(texts.seriesId, current.seriesId),
        lt(texts.order, current.order)
      ),
      orderBy: [desc(texts.order)],
      columns: { id: true, title: true },
    }),
    db.query.texts.findFirst({
      where: and(
        eq(texts.seriesId, current.seriesId),
        gt(texts.order, current.order)
      ),
      orderBy: [asc(texts.order)],
      columns: { id: true, title: true },
    }),
  ]);

  return NextResponse.json<AdjacentTextsResponse>({
    prev: prev ?? null,
    next: next ?? null,
  });
}
