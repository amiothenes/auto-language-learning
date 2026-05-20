import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { texts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { ApiErrorResponse } from '@/lib/types/api';

interface AdjacentText {
  id: string;
  title: string;
}

interface AdjacentTextsResponse {
  prev: AdjacentText | null;
  next: AdjacentText | null;
}

type SortOption = 'title-asc' | 'progress-desc' | 'progress-asc' | 'recent';

// ============================================================================
// GET /api/texts/[id]/adjacent?sort=<option>
// Returns prev/next text in the same series ordered by the requested sort,
// matching the client-side sort used in series/[id]. Defaults to title-asc.
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sort = (request.nextUrl.searchParams.get('sort') ?? 'title-asc') as SortOption;

  const current = await db.query.texts.findFirst({
    where: eq(texts.id, id),
    columns: { seriesId: true },
  });

  if (!current) {
    return NextResponse.json<ApiErrorResponse>(
      { error: `Text not found: ${id}` },
      { status: 404 }
    );
  }

  const allTexts = await db.query.texts.findMany({
    where: eq(texts.seriesId, current.seriesId),
    columns: { id: true, title: true, knownPercentage: true, lastViewedAt: true },
  });

  const sorted = [...allTexts];
  switch (sort) {
    case 'progress-desc':
      sorted.sort((a, b) => b.knownPercentage - a.knownPercentage);
      break;
    case 'progress-asc':
      sorted.sort((a, b) => a.knownPercentage - b.knownPercentage);
      break;
    case 'recent':
      sorted.sort((a, b) => {
        const aTime = a.lastViewedAt?.getTime() ?? 0;
        const bTime = b.lastViewedAt?.getTime() ?? 0;
        return bTime - aTime;
      });
      break;
    default:
      sorted.sort((a, b) => a.title.localeCompare(b.title));
  }

  const currentIndex = sorted.findIndex((t) => t.id === id);

  return NextResponse.json<AdjacentTextsResponse>({
    prev: currentIndex > 0 ? { id: sorted[currentIndex - 1].id, title: sorted[currentIndex - 1].title } : null,
    next: currentIndex < sorted.length - 1 ? { id: sorted[currentIndex + 1].id, title: sorted[currentIndex + 1].title } : null,
  });
}
