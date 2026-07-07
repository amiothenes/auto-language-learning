import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { texts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { ApiErrorResponse } from '@/lib/types/api';
import { requireUser } from '@/lib/auth/requireUser';

// ============================================================================
// POST /api/series/[id]/reorder — Reorder texts within a series
// ============================================================================

/**
 * Accepts a full ordered list of text IDs and writes the new `order` index
 * for each. The client sends textIds in the desired display order (0-indexed
 * position is stored as `order + 1` to stay 1-based).
 *
 * Body: { textIds: string[] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  try {
    const { id: seriesId } = await params;
    const body = await request.json().catch(() => null);

    if (!body || !Array.isArray(body.textIds) || body.textIds.length === 0) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'textIds array is required' },
        { status: 400 }
      );
    }

    const textIds: string[] = body.textIds;

    // Write each text's new order in parallel (scoped to user)
    await Promise.all(
      textIds.map((textId, index) =>
        db
          .update(texts)
          .set({ order: index + 1, updatedAt: new Date() })
          .where(and(eq(texts.id, textId), eq(texts.userId, user.id)))
      )
    );

    console.log(`[Series Reorder] Reordered ${textIds.length} texts in series ${seriesId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Series Reorder] Unexpected error:', error);
    return NextResponse.json<ApiErrorResponse>(
      {
        error: 'Internal server error reordering texts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
