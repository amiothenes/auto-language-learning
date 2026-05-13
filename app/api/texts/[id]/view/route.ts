import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { texts } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { ApiErrorResponse } from '@/lib/types/api';

// ============================================================================
// POST /api/texts/[id]/view — Increment viewCount + stamp lastViewedAt
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params;

    const [updated] = await db
      .update(texts)
      .set({
        viewCount: sql`${texts.viewCount} + 1`,
        lastViewedAt: new Date(),
      })
      .where(eq(texts.id, id))
      .returning({ viewCount: texts.viewCount });

    if (!updated) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Text not found: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ viewCount: updated.viewCount });
  } catch (error) {
    console.error('[View Increment] Unexpected error:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
