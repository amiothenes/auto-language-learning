import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { texts } from '@/lib/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import type { ApiErrorResponse } from '@/lib/types/api';
import { requireUser } from '@/lib/auth/requireUser';

// ============================================================================
// POST /api/texts/[id]/view — Increment viewCount + stamp lastViewedAt
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  try {
    const { id } = await params;

    const [updated] = await db
      .update(texts)
      .set({
        viewCount: sql`${texts.viewCount} + 1`,
        lastViewedAt: new Date(),
      })
      .where(and(eq(texts.id, id), eq(texts.userId, user.id)))
      .returning({ viewCount: texts.viewCount, seriesId: texts.seriesId });

    if (!updated) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Text not found: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ viewCount: updated.viewCount, seriesId: updated.seriesId });
  } catch (error) {
    console.error('[View Increment] Unexpected error:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
