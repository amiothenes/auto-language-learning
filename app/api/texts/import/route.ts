import { NextRequest, NextResponse, after } from 'next/server';
import { processTranslationsForText } from '@/lib/translation/translationService';
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
import { eq, inArray } from 'drizzle-orm';
import {
  processTextForImport,
  TextProcessingError,
  autoIgnoreProperNouns,
} from '@/lib/nlp/textProcessor';
import { splitIntoChunks } from '@/lib/nlp/textChunker';
import type { ImportTextRequest, ImportTextResponse, ApiErrorResponse } from '@/lib/types/api';

// ============================================================================
// POST /api/texts/import - Import text with NLP processing
// ============================================================================

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

    if (!languageCode || languageCode.trim().length === 0) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Language code is required' },
        { status: 400 }
      );
    }

    console.log(`[Text Import] Starting import: "${title}" (${content.trim().length} chars)`);

    // ========================================================================
    // 2. Resolve Language by Code
    // ========================================================================

    const language = await db.query.languages.findFirst({
      where: eq(languages.code, languageCode),
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
        where: eq(series.id, seriesId),
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
      const [newSeries] = await db
        .insert(series)
        .values({ name: title.trim(), languageId: language.id })
        .returning();
      resolvedSeriesId = newSeries.id;
      console.log(`[Text Import] Series auto-created: ${newSeries.id} ("${newSeries.name}")`);
    }

    // ========================================================================
    // 4. Split Content into Chunks + Process Each
    // ========================================================================

    const normalizedContent = content.replace(/\r\n/g, '\n').trim();
    const chunks = splitIntoChunks(normalizedContent);
    const isMultiChunk = chunks.length > 1;

    console.log(`[Text Import] Split into ${chunks.length} chunk(s)`);

    type ChunkResult = Awaited<ReturnType<typeof processTextForImport>>;
    const results: ChunkResult[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkTitle = isMultiChunk ? `${title.trim()} (Part ${i + 1})` : title.trim(); //TODO change titles to what i need (later)

      try {
        const result = await processTextForImport(
          chunkTitle,
          chunks[i],
          language.id,
          resolvedSeriesId,
          i + 1
        );

        console.log(
          `[Text Import] Chunk ${i + 1}/${chunks.length} done: ${result.wordCount} words, ` +
          `${result.processingTime}ms`
        );

        results.push(result);
      } catch (error) {
        if (error instanceof TextProcessingError) {
          console.error(`[Text Import] Chunk ${i + 1} failed at stage "${error.stage}":`, error.message);
          return NextResponse.json<ApiErrorResponse>(
            {
              error: 'Text processing failed',
              details: error.message,
              stage: error.stage,
            },
            { status: 400 }
          );
        }
        throw error;
      }
    }

    // ========================================================================
    // 5. Handle Tags (linked to first text page only)
    // ========================================================================

    let processedTags: Array<{ id: string; name: string }> = [];
    const firstTextId = results[0].textId;

    if (tagNames && tagNames.length > 0) {
      try {
        const validTagNames = tagNames
          .map((name) => name.trim())
          .filter((name) => name.length > 0 && name.length <= 30)
          .slice(0, 10);

        if (validTagNames.length > 0) {
          const existingTags = await db.query.tags.findMany({
            where: inArray(tags.name, validTagNames),
          });

          const existingTagNames = new Set(existingTags.map((t) => t.name));
          const newTagNames = validTagNames.filter((name) => !existingTagNames.has(name));

          let newTags: Array<{ id: string; name: string }> = [];

          if (newTagNames.length > 0) {
            const newTagsData: NewTag[] = newTagNames.map((name) => ({ name }));
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
    console.log(`[Text Import] Import complete: ${results.length} page(s) in ${totalTime}ms`);

    // Auto-ignore proper nouns synchronously: pure SQL, <10ms, returns count for toast
    const textIds = results.map((r) => r.textId);
    const ignoredPropnCount = await autoIgnoreProperNouns(textIds);

    const response: ImportTextResponse = {
      success: true,
      seriesId: resolvedSeriesId,
      texts: results.map((r, i) => ({
        id: r.textId,
        title: isMultiChunk ? `${title.trim()} (Part ${i + 1})` : title.trim(),
        wordCount: r.wordCount,
        uniqueWordCount: r.uniqueWordCount,
        knownPercentage: r.knownPercentage,
      })),
      statistics: {
        newWordsCreated: results.reduce((sum, r) => sum + r.newWordsCreated, 0),
        sentencesCreated: results.reduce((sum, r) => sum + r.sentencesCreated, 0),
        processingTime: results.reduce((sum, r) => sum + r.processingTime, 0),
      },
      tags: processedTags,
      ignoredPropnCount,
    };

    // Trigger auto-translation after response is sent — does not block the client
    after(async () => {
      for (const id of textIds) {
        try {
          await processTranslationsForText(id);
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
