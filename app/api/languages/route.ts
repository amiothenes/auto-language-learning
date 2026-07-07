import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { languages } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';
import type { LanguageItem, LanguagesListResponse, CreateLanguageResponse, ApiErrorResponse } from '@/lib/types/api';
import { requireUser } from '@/lib/auth/requireUser';

// ============================================================================
// GET /api/languages — List all available languages
// ============================================================================

export async function GET() {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  try {
    const rows = await db.query.languages.findMany({
      where: eq(languages.userId, user.id),
      orderBy: [asc(languages.name)],
    });

    const result: LanguageItem[] = rows.map((lang) => ({
      id: lang.id,
      code: lang.code,
      name: lang.name,
      isRTL: lang.isRTL,
      dictURI: lang.dictURI ?? null,
      googleTTSCode: lang.googleTTSCode ?? null,
      includeForeignScript: lang.includeForeignScript,
    }));

    return NextResponse.json<LanguagesListResponse>({ languages: result });
  } catch (error) {
    console.error('[Languages] Unexpected error:', error);
    return NextResponse.json<ApiErrorResponse>(
      {
        error: 'Internal server error fetching languages',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/languages — Create a new language
// ============================================================================

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json<ApiErrorResponse>({ error: 'Request body must be valid JSON' }, { status: 400 });
    }

    const { name, code, isRTL, dictURI, googleTTSCode, includeForeignScript } = body as {
      name?: string;
      code?: string;
      isRTL?: boolean;
      dictURI?: string;
      googleTTSCode?: string;
      includeForeignScript?: boolean;
    };

    if (!name?.trim()) {
      return NextResponse.json<ApiErrorResponse>({ error: 'name is required' }, { status: 400 });
    }
    if (!code?.trim()) {
      return NextResponse.json<ApiErrorResponse>({ error: 'code is required' }, { status: 400 });
    }

    const [row] = await db
      .insert(languages)
      .values({
        name: name.trim(),
        code: code.trim().toLowerCase(),
        userId: user.id,
        isRTL: isRTL ?? false,
        dictURI: dictURI?.trim() || null,
        googleTTSCode: googleTTSCode?.trim() || null,
        includeForeignScript: includeForeignScript ?? false,
      })
      .returning();

    const language: LanguageItem = {
      id: row.id,
      code: row.code,
      name: row.name,
      isRTL: row.isRTL,
      dictURI: row.dictURI ?? null,
      googleTTSCode: row.googleTTSCode ?? null,
      includeForeignScript: row.includeForeignScript,
    };

    return NextResponse.json<CreateLanguageResponse>({ language }, { status: 201 });
  } catch (error) {
    console.error('[Languages] Error creating language:', error);
    return NextResponse.json<ApiErrorResponse>(
      {
        error: 'Internal server error creating language',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
