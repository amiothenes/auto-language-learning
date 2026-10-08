import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wordInstances } from '@/lib/db/schema';
import { ownedBy } from '@/lib/db/scope';
import { requireUser } from '@/lib/auth/requireUser';
import { eq } from 'drizzle-orm';
import type { ApiErrorResponse, VocabularyContextsResponse } from '@/lib/types/api';
import type { VocabularyStatus } from '@/lib/types/vocabulary';

// ============================================================================
// GET /api/vocabulary/[id]/contexts — every text/sentence occurrence of a
// word (lemma), for the "Seen In" link on the vocabulary table.
// Ownership is verified once on the word; every joined text/sentence row is
// transitively owned too, since words and texts are both created user-scoped
// and words are never shared across users.
// ============================================================================

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  const { id } = await params;

  const word = await db.query.words.findFirst({
    where: ownedBy('words', id, user.id),
    columns: { id: true, lemma: true, status: true, translation: true },
  });
  if (!word) {
    return NextResponse.json<ApiErrorResponse>({ error: 'Word not found' }, { status: 404 });
  }

  const instances = await db.query.wordInstances.findMany({
    where: eq(wordInstances.wordId, id),
    columns: { id: true, surfaceForm: true, position: true },
    with: {
      sentence: { columns: { id: true, content: true, order: true } },
      text: {
        columns: { id: true, title: true, seriesId: true },
        with: { series: { columns: { id: true, name: true } } },
      },
    },
    orderBy: (fields, { asc }) => [asc(fields.textId), asc(fields.position)],
  });

  return NextResponse.json<VocabularyContextsResponse>({
    word: { ...word, status: word.status as VocabularyStatus },
    contexts: instances,
  });
}
