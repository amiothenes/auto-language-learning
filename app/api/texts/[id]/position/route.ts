import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { texts } from '@/lib/db/schema';
import type { ApiErrorResponse } from '@/lib/types/api';
import { requireUser } from '@/lib/auth/requireUser';
import { ownedBy } from '@/lib/db/scope';

// ============================================================================
// PATCH /api/texts/[id]/position — Save reading/narration resume position
//
// Fired frequently (on scroll settle, tab hide, and periodically during
// playback) so it's intentionally minimal — no audit logging, no return of
// the full text. Separate from the general metadata PATCH in
// app/api/texts/[id]/route.ts, which deliberately excludes fast-changing
// fields like this one.
// ============================================================================

interface PositionRequestBody {
  paragraphIndex: number;
  sentenceIndex: number | null;
  audioPositionMs: number | null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = (await request.json()) as Partial<PositionRequestBody>;

    if (typeof body.paragraphIndex !== 'number' || body.paragraphIndex < 0) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'paragraphIndex must be a non-negative number' },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(texts)
      .set({
        lastParagraphIndex: body.paragraphIndex,
        lastSentenceIndex: body.sentenceIndex ?? null,
        lastAudioPositionMs: body.audioPositionMs ?? null,
      })
      .where(ownedBy('texts', id, user.id))
      .returning({ id: texts.id });

    if (!updated) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Text not found: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Position Save] Unexpected error:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Internal server error saving reading position' },
      { status: 500 }
    );
  }
}
