import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { countDueToday } from '@/lib/srs/queue';
import type { ApiErrorResponse, SrsDueCountResponse } from '@/lib/types/api';

// ============================================================================
// GET /api/srs/due-count — Lightweight due/new count for the nav badge
// ============================================================================

export async function GET(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const languageId = searchParams.get('languageId');
  if (!languageId) {
    return NextResponse.json<ApiErrorResponse>({ error: 'languageId query parameter is required' }, { status: 400 });
  }

  try {
    const dueCount = await countDueToday(user.id, languageId);
    return NextResponse.json<SrsDueCountResponse>({ dueCount });
  } catch (error) {
    console.error('[SRS Due Count] Error:', error);
    return NextResponse.json<ApiErrorResponse>({ error: 'Failed to compute due count' }, { status: 500 });
  }
}
