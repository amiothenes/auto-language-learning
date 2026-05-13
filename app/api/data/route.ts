import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wordInstances, textTags, sentences, words, texts, tags, series } from '@/lib/db/schema';
import type { ApiErrorResponse } from '@/lib/types/api';

// ============================================================================
// DELETE /api/data — Truncate all user-data tables
// Does NOT delete languages or settings.
// Order matters: child tables before parent tables to respect FK constraints.
// ============================================================================

export async function DELETE(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json<ApiErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await db.delete(wordInstances);
    await db.delete(textTags);
    await db.delete(sentences);
    await db.delete(words);
    await db.delete(texts);
    await db.delete(tags);
    await db.delete(series);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Data] Error deleting all data:', error);
    return NextResponse.json<ApiErrorResponse>(
      {
        error: 'Internal server error deleting data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
