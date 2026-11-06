import { NextRequest, NextResponse, after } from 'next/server';
import { processTranslationsForText, TRANSLATION_TIME_BUDGET_MS } from '@/lib/translation/translationService';
import { db } from '@/lib/db';
import {
  languages,
  series,
  tags,
  textTags,
  texts,
  type NewTag,
  type NewTextTag,
} from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { TextProcessingError } from '@/lib/nlp/textProcessor';
import { importTextPages, type ImportTextResult } from '@/lib/texts/importText';
import type { ImportTextRequest, ImportTextResponse, ApiErrorResponse } from '@/lib/types/api';
import { requireUser } from '@/lib/auth/requireUser';
import { ownedBy } from '@/lib/db/scope';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { checkQuota, quotaResponse } from '@/lib/quotas';

// The after() translation job below counts toward this limit, not just the
// request itself. Raised from the platform default so a large text has time to
// finish translating; the job also enforces its own time budget.
export const maxDuration = 300;

// ============================================================================
// POST /api/texts/import - Import text with NLP processing
// ============================================================================

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  const startTime = Date.now();

  try {
    // ========================================================================
    // 1. Parse and Validate Request Body
    // ========================================================================

    let body: ImportTextRequest;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { title, content, languageCode, seriesId, tags: tagNames, sourceURI } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Title is required and cannot be empty' },
        { status: 400 }
      );
    }

    if (title.trim().length > 200) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Title must be 200 characters or less' },
        { status: 400 }
      );
    }

    if (!content || content.trim().length < 10) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Content must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (content.trim().length > 50_000) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Content must be 50,000 characters or less' },
        { status: 400 }
      );
    }

    if (!languageCode || languageCode.trim().length === 0) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Language code is required' },
        { status: 400 }
      );
    }

    const rateLimit = await checkRateLimit('import', user.id);
    if (!rateLimit.allowed) {
      return rateLimitResponse('import', rateLimit);
    }

    const textsQuota = await checkQuota('texts', user.id);
    if (!textsQuota.allowed) {
      return quotaResponse('texts', textsQuota);
    }

    const wordsQuota = await checkQuota('words', user.id);
    if (!wordsQuota.allowed) {
      return quotaResponse('words', wordsQuota);
    }

    console.log(`[Text Import] Starting import: "${title}" (${content.trim().length} chars)`);

    // ========================================================================
    // 2. Resolve Language by Code
    // ========================================================================

    const language = await db.query.languages.findFirst({
      where: and(eq(languages.code, languageCode), eq(languages.userId, user.id)),
    });

    if (!language) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Language not found with code: ${languageCode}` },
        { status: 404 }
      );
    }

    console.log(`[Text Import] Language resolved: ${language.name} (id: ${language.id})`);

    // ========================================================================
    // 3. Resolve Series (verify provided, or auto-create)
    // ========================================================================

    let resolvedSeriesId: string;

    if (seriesId) {
      const seriesRecord = await db.query.series.findFirst({
        where: ownedBy('series', seriesId, user.id),
      });

      if (!seriesRecord) {
        return NextResponse.json<ApiErrorResponse>(
          { error: `Series not found with ID: ${seriesId}` },
          { status: 404 }
        );
      }

      resolvedSeriesId = seriesRecord.id;
      console.log(`[Text Import] Series verified: ${seriesRecord.name}`);
    } else {
      const seriesQuota = await checkQuota('series', user.id);
      if (!seriesQuota.allowed) {
        return quotaResponse('series', seriesQuota);
      }

      const [newSeries] = await db
        .insert(series)
        .values({ name: title.trim(), languageId: language.id, userId: user.id })
        .returning();
      resolvedSeriesId = newSeries.id;
      console.log(`[Text Import] Series auto-created: ${newSeries.id} ("${newSeries.name}")`);
    }

    // ========================================================================
    // 4. Split, NLP-process and store the pages (shared with onboarding).
    //    Pages are appended after the series' last text, so a manually
    //    arranged Custom Order isn't disturbed.
    // ========================================================================

    let imported: ImportTextResult;
    try {
      imported = await importTextPages({
        userId: user.id,
        languageId: language.id,
        seriesId: resolvedSeriesId,
        title,
        content,
      });
    } catch (error) {
      if (error instanceof TextProcessingError) {
        console.error(`[Text Import] Failed at stage "${error.stage}":`, error.message);
        return NextResponse.json<ApiErrorResponse>(
          { error: 'Text processing failed', details: error.message, stage: error.stage },
          { status: 400 }
        );
      }
      throw error;
    }

    // ========================================================================
    // 5. Handle Tags (linked to first text page only)
    // ========================================================================

    let processedTags: Array<{ id: string; name: string }> = [];
    const firstTextId = imported.textIds[0];

    if (tagNames && tagNames.length > 0) {
      try {
        const validTagNames = tagNames
          .map((name) => name.trim())
          .filter((name) => name.length > 0 && name.length <= 30)
          .slice(0, 10);

        if (validTagNames.length > 0) {
          const existingTags = await db.query.tags.findMany({
            where: and(inArray(tags.name, validTagNames), eq(tags.userId, user.id)),
          });

          const existingTagNames = new Set(existingTags.map((t) => t.name));
          const newTagNames = validTagNames.filter((name) => !existingTagNames.has(name));

          let newTags: Array<{ id: string; name: string }> = [];

          if (newTagNames.length > 0) {
            const newTagsData: NewTag[] = newTagNames.map((name) => ({ name, userId: user.id }));
            newTags = await db.insert(tags).values(newTagsData).returning();
            console.log(`[Text Import] Created ${newTags.length} new tags:`, newTagNames);
          }

          const allTags = [...existingTags, ...newTags];
          processedTags = allTags.map((t) => ({ id: t.id, name: t.name }));

          const textTagsData: NewTextTag[] = allTags.map((tag) => ({
            textId: firstTextId,
            tagId: tag.id,
          }));

          await db.insert(textTags).values(textTagsData);
          console.log(`[Text Import] Linked ${allTags.length} tags to first text page`);
        }
      } catch (error) {
        console.error('[Text Import] Tag processing error:', error);
      }
    }

    // ========================================================================
    // 6. Save sourceURI to first text page (non-fatal, URL imports only)
    // ========================================================================

    if (sourceURI && firstTextId) {
      try {
        await db.update(texts).set({ sourceURI }).where(eq(texts.id, firstTextId));
      } catch (error) {
        console.error('[Text Import] Failed to save sourceURI:', error);
      }
    }

    // ========================================================================
    // 7. Return Success Response
    // ========================================================================

    const totalTime = Date.now() - startTime;
    console.log(`[Text Import] Import complete: ${imported.pages.length} page(s) in ${totalTime}ms`);

    // Proper-noun auto-ignore and the stats resync already ran inside importTextPages.
    const textIds = imported.textIds;
    const response: ImportTextResponse = {
      success: true,
      seriesId: resolvedSeriesId,
      texts: imported.pages,
      statistics: imported.statistics,
      tags: processedTags,
      ignoredPropnCount: imported.ignoredPropnCount,
    };

    // Trigger auto-translation after response is sent — does not block the client
    after(async () => {
      // One shared deadline for all chunks, not one per chunk.
      const deadline = Date.now() + TRANSLATION_TIME_BUDGET_MS;
      for (const id of textIds) {
        try {
          await processTranslationsForText(id, deadline);
        } catch (err) {
          console.error(`[Text Import] Translation job failed for text ${id}:`, err);
        }
      }
    });

    return NextResponse.json<ImportTextResponse>(response, { status: 201 });
  } catch (error) {
    console.error('[Text Import] Unexpected error:', error);

    return NextResponse.json<ApiErrorResponse>(
      {
        error: 'Internal server error during text import',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/texts/import - API Documentation
// ============================================================================

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/texts/import',
    method: 'POST',
    description: 'Import a text with complete NLP processing. Auto-creates a series if none provided. Auto-splits long texts into ordered pages.',
    requestBody: {
      title: 'string (required, 1-200 chars)',
      content: 'string (required, min 10 chars)',
      languageCode: 'string (required)',
      seriesId: 'string (optional, FK to series — auto-created if omitted)',
      tags: 'string[] (optional, max 10 tags, each max 30 chars)',
    },
    responses: {
      201: 'Import successful — returns seriesId + texts array (N pages)',
      400: 'Invalid request or text processing failed',
      404: 'Language or series not found',
      500: 'Internal server error',
    },
  });
}
