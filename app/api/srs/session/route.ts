import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { buildSession } from '@/lib/srs/queue';
import type { ApiErrorResponse, SrsSessionResponse } from '@/lib/types/api';

// ============================================================================
// GET /api/srs/session — Today's SRS review queue for a language
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
    const { cards, dueCount, newCount } = await buildSession(user.id, languageId);
    return NextResponse.json<SrsSessionResponse>({ languageId, cards, dueCount, newCount });
  } catch (error) {
    console.error('[SRS Session] Error:', error);
    return NextResponse.json<ApiErrorResponse>({ error: 'Failed to build review session' }, { status: 500 });
  }
}
