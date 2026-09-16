import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { texts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { ApiErrorResponse } from '@/lib/types/api';
import { requireUser } from '@/lib/auth/requireUser';

interface AdjacentText {
  id: string;
  title: string;
}

interface AdjacentTextsResponse {
  prev: AdjacentText | null;
  next: AdjacentText | null;
}

type SortOption = 'title-asc' | 'progress-desc' | 'progress-asc' | 'recent' | 'custom';

// ============================================================================
// GET /api/texts/[id]/adjacent?sort=<option>
// Returns prev/next text in the same series ordered by the requested sort,
// matching the client-side sort used in series/[id]. Defaults to recent,
// matching that page's own default.
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  const { id } = await params;
  const sort = (request.nextUrl.searchParams.get('sort') ?? 'recent') as SortOption;

  const current = await db.query.texts.findFirst({
    where: and(eq(texts.id, id), eq(texts.userId, user.id)),
    columns: { seriesId: true },
  });

  if (!current) {
    return NextResponse.json<ApiErrorResponse>(
      { error: `Text not found: ${id}` },
      { status: 404 }
    );
  }

  const allTexts = await db.query.texts.findMany({
    where: and(eq(texts.seriesId, current.seriesId), eq(texts.userId, user.id)),
    columns: { id: true, title: true, knownPercentage: true, lastViewedAt: true, order: true },
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
    case 'custom':
      sorted.sort((a, b) => a.order - b.order);
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
