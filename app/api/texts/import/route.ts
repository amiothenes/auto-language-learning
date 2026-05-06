import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  languages,
  series,
  tags,
  textTags,
  type NewTag,
  type NewTextTag,
} from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import {
  processTextForImport,
  TextProcessingError,
} from '@/lib/nlp/textProcessor';
import type { ImportTextRequest, ImportTextResponse, ApiErrorResponse } from '@/lib/types/api';

// ============================================================================
// POST /api/texts/import - Import text with NLP processing
// ============================================================================

/**
 * Import a text into the database with complete NLP processing
 *
 * This endpoint:
 * 1. Validates the request payload
 * 2. Verifies language and series exist
 * 3. Processes text through NLP pipeline (tokenization, lemmatization, romanization)
 * 4. Creates database records (text, sentences, words, word instances)
 * 5. Handles tag creation and association
 * 6. Returns complete text data with statistics
 *
 * @see processTextForImport in lib/nlp/textProcessor.ts for NLP pipeline details
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ========================================================================
    // 1. Parse and Validate Request Body
    // ========================================================================

    let body: ImportTextRequest;

    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { title, content, languageCode, seriesId, tags: tagNames } = body;

    // Validate required fields
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
    // 3. Verify Series Exists (if provided)
    // ========================================================================

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

      console.log(`[Text Import] Series verified: ${seriesRecord.name}`);
    }

    // ========================================================================
    // 4. Process Text Through NLP Pipeline
    // ========================================================================

    let result;

    try {
      result = await processTextForImport(
        title.trim(),
        content.trim(),
        language.id,
        seriesId || null
      );

      console.log(
        `[Text Import] NLP processing complete: ${result.wordCount} words, ` +
        `${result.uniqueWordCount} unique, ${result.knownPercentage}% known, ` +
        `${result.processingTime}ms`
      );
    } catch (error) {
      if (error instanceof TextProcessingError) {
        console.error(`[Text Import] Processing failed at stage "${error.stage}":`, error.message);
        return NextResponse.json<ApiErrorResponse>(
          {
            error: 'Text processing failed',
            details: error.message,
            stage: error.stage,
          },
          { status: 400 }
        );
      }

      throw error; // Re-throw unexpected errors
    }

    // ========================================================================
    // 5. Handle Tags (Create New + Link Existing)
    // ========================================================================

    let processedTags: Array<{ id: string; name: string }> = [];

    if (tagNames && tagNames.length > 0) {
      try {
        // Filter and validate tag names
        const validTagNames = tagNames
          .map((name) => name.trim())
          .filter((name) => name.length > 0 && name.length <= 30)
          .slice(0, 10); // Max 10 tags

        if (validTagNames.length > 0) {
          // Query existing tags
          const existingTags = await db.query.tags.findMany({
            where: inArray(tags.name, validTagNames),
          });

          const existingTagNames = new Set(existingTags.map((t) => t.name));

          // Identify new tags that need to be created
          const newTagNames = validTagNames.filter((name) => !existingTagNames.has(name));

          let newTags: Array<{ id: string; name: string }> = [];

          // Create new tags
          if (newTagNames.length > 0) {
            const newTagsData: NewTag[] = newTagNames.map((name) => ({ name }));
            newTags = await db.insert(tags).values(newTagsData).returning();

            console.log(`[Text Import] Created ${newTags.length} new tags:`, newTagNames);
          }

          // Combine all tags (existing + new)
          const allTags = [...existingTags, ...newTags];
          processedTags = allTags.map((t) => ({ id: t.id, name: t.name }));

          // Create textTags relationships
          const textTagsData: NewTextTag[] = allTags.map((tag) => ({
            textId: result.textId,
            tagId: tag.id,
          }));

          await db.insert(textTags).values(textTagsData);

          console.log(`[Text Import] Linked ${allTags.length} tags to text`);
        }
      } catch (error) {
        console.error('[Text Import] Tag processing error:', error);
        // Don't fail the entire import if tag processing fails
        // Text was already created successfully
      }
    }

    // ========================================================================
    // 6. Return Success Response
    // ========================================================================

    const totalTime = Date.now() - startTime;

    console.log(`[Text Import] Import complete: ${result.textId} (${totalTime}ms total)`);

    const response: ImportTextResponse = {
      success: true,
      text: {
        id: result.textId,
        title: title.trim(),
        wordCount: result.wordCount,
        uniqueWordCount: result.uniqueWordCount,
        knownPercentage: result.knownPercentage,
      },
      statistics: {
        newWordsCreated: result.newWordsCreated,
        sentencesCreated: result.sentencesCreated,
        processingTime: result.processingTime,
      },
      tags: processedTags,
    };

    return NextResponse.json<ImportTextResponse>(response, { status: 201 });
  } catch (error) {
    // ========================================================================
    // Unexpected Error Handler
    // ========================================================================

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

/**
 * Returns API documentation for the text import endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/texts/import',
    method: 'POST',
    description: 'Import a text with complete NLP processing and database storage',
    requestBody: {
      title: 'string (required, 1-200 chars)',
      content: 'string (required, min 10 chars)',
      languageId: 'string (required, FK to languages)',
      seriesId: 'string (optional, FK to series)',
      tags: 'string[] (optional, max 10 tags, each max 30 chars)',
    },
    responses: {
      201: 'Text imported successfully',
      400: 'Invalid request or text processing failed',
      404: 'Language or series not found',
      500: 'Internal server error',
    },
    processingSteps: [
      'Tokenization',
      'Lemmatization',
      'Romanization (if needed)',
      'Database record creation',
      'Tag association',
      'Statistics calculation',
    ],
    performance: 'Target: < 3 seconds for 2000-word texts',
  });
}
