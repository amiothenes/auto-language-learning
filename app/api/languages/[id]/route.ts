import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { languages, texts, words, series } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import type { ApiErrorResponse, LanguageItem, UpdateLanguageResponse } from '@/lib/types/api';

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

// ============================================================================
// PATCH /api/languages/[id] — Update language settings
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json<ApiErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json<ApiErrorResponse>({ error: 'Request body must be valid JSON' }, { status: 400 });
    }

    const { dictURI, googleTTSCode, isRTL, includeForeignScript } = body as {
      dictURI?: string | null;
      googleTTSCode?: string | null;
      isRTL?: boolean;
      includeForeignScript?: boolean;
    };

    const updates: Partial<typeof languages.$inferInsert> = { updatedAt: new Date() };
    if (dictURI !== undefined) updates.dictURI = dictURI?.trim() || null;
    if (googleTTSCode !== undefined) updates.googleTTSCode = googleTTSCode?.trim() || null;
    if (isRTL !== undefined) updates.isRTL = isRTL;
    if (includeForeignScript !== undefined) updates.includeForeignScript = includeForeignScript;

    const [row] = await db
      .update(languages)
      .set(updates)
      .where(eq(languages.id, id))
      .returning();

    if (!row) {
      return NextResponse.json<ApiErrorResponse>({ error: 'Language not found' }, { status: 404 });
    }

    const language: LanguageItem = {
      id: row.id,
      code: row.code,
      name: row.name,
      isRTL: row.isRTL,
      dictURI: row.dictURI ?? null,
      googleTTSCode: row.googleTTSCode ?? null,
      includeForeignScript: row.includeForeignScript,
    };

    return NextResponse.json<UpdateLanguageResponse>({ language });
  } catch (error) {
    console.error('[Languages] Error updating language:', error);
    return NextResponse.json<ApiErrorResponse>(
      {
        error: 'Internal server error updating language',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
