import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { languages } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import type { LanguageItem, LanguagesListResponse, ApiErrorResponse } from '@/lib/types/api';

// ============================================================================
// GET /api/languages — List all available languages
// ============================================================================

/**
 * Returns all languages configured in the system.
 * Used by the import modal dropdown and language switcher.
 */
export async function GET() {
  try {
    console.log('[Languages] Fetching all languages');

    const rows = await db.query.languages.findMany({
      orderBy: [asc(languages.name)],
    });

    const result: LanguageItem[] = rows.map((lang) => ({
      id: lang.id,
      code: lang.code,
      name: lang.name,
      isRTL: lang.isRTL,
    }));

    console.log(`[Languages] Found ${result.length} languages`);

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
