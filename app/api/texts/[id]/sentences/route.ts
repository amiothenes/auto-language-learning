import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sentences } from '@/lib/db/schema';
import { ownedBy } from '@/lib/db/scope';
import { requireUser } from '@/lib/auth/requireUser';
import { asc, eq } from 'drizzle-orm';
import type { ApiErrorResponse, SentencesListResponse } from '@/lib/types/api';

// ============================================================================
// GET /api/texts/[id]/sentences — ordered sentence rows for a text.
// Used by TTS sentence/paragraph playback and Tutor Mode's sentence walker.
// ============================================================================

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  const { id } = await params;

  const text = await db.query.texts.findFirst({
    where: ownedBy('texts', id, user.id),
    columns: { id: true },
  });
  if (!text) {
    return NextResponse.json<ApiErrorResponse>({ error: 'Text not found' }, { status: 404 });
  }

  const rows = await db.query.sentences.findMany({
    where: eq(sentences.textId, id),
    orderBy: asc(sentences.order),
    columns: { id: true, content: true, order: true },
  });

  return NextResponse.json<SentencesListResponse>({ textId: id, sentences: rows });
}
