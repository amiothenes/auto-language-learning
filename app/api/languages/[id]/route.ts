import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { languages, texts, words, series } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import type { ApiErrorResponse } from '@/lib/types/api';

// ============================================================================
// DELETE /api/languages/[id] — Delete a language by ID
// Blocked if any texts, words, or series reference this language.
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json<ApiErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check for references before deleting
    const [textCount, wordCount, seriesCount] = await Promise.all([
      db.select({ value: count() }).from(texts).where(eq(texts.languageId, id)),
      db.select({ value: count() }).from(words).where(eq(words.languageId, id)),
      db.select({ value: count() }).from(series).where(eq(series.languageId, id)),
    ]);

    const totalRefs =
      (textCount[0]?.value ?? 0) +
      (wordCount[0]?.value ?? 0) +
      (seriesCount[0]?.value ?? 0);

    if (totalRefs > 0) {
      const parts: string[] = [];
      if ((textCount[0]?.value ?? 0) > 0) parts.push(`${textCount[0].value} text(s)`);
      if ((seriesCount[0]?.value ?? 0) > 0) parts.push(`${seriesCount[0].value} series`);
      if ((wordCount[0]?.value ?? 0) > 0) parts.push(`${wordCount[0].value} word(s)`);
      return NextResponse.json<ApiErrorResponse>(
        { error: `Cannot delete: language is referenced by ${parts.join(', ')}` },
        { status: 409 }
      );
    }

    await db.delete(languages).where(eq(languages.id, id));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[Languages] Error deleting language:', error);
    return NextResponse.json<ApiErrorResponse>(
      {
        error: 'Internal server error deleting language',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
