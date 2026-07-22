/**
 * NLP Processing API Route
 *
 * POST /api/nlp/process-text
 *
 * Processes text through the spaCy NLP pipeline:
 * tokenization + lemmatization + POS tagging in one call.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { processWithSpacy } from '@/lib/nlp/spacyClient';
import { requireUser } from '@/lib/auth/requireUser';
import { ownedBy } from '@/lib/db/scope';

// ============================================================================
// Request/Response Types
// ============================================================================

interface ProcessTextRequest {
  textContent: string;
  languageId: string;
}

interface WordInstance {
  surface: string;
  lemma: string;
  pos: string;
  morph: Record<string, string>;
  inflectionData: Record<string, string>;
  position: number;
  sentenceIndex: number;
}

interface ProcessTextResponse {
  wordInstances: WordInstance[];
  stats: {
    totalTokens: number;
    wordTokens: number;
    totalTime: number;
  };
}

// ============================================================================
// API Route Handler
// ============================================================================

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  try {
    const body = (await request.json()) as ProcessTextRequest;
    const { textContent, languageId } = body;

    if (!textContent || textContent.trim().length === 0) {
      return NextResponse.json({ error: 'textContent is required and cannot be empty' }, { status: 400 });
    }

    if (!languageId) {
      return NextResponse.json({ error: 'languageId is required' }, { status: 400 });
    }

    const language = await db.query.languages.findFirst({
      where: ownedBy('languages', languageId, user.id),
    });

    if (!language) {
      return NextResponse.json({ error: `Language not found: ${languageId}` }, { status: 404 });
    }

    const startTime = Date.now();
    const spacyResult = await processWithSpacy(textContent, language.code);

    const allTokens = spacyResult.tokens;
    const wordTokens = allTokens.filter((t) => t.is_word);

    const wordInstances: WordInstance[] = wordTokens.map((t) => ({
      surface: t.surface,
      lemma: t.lemma,
      pos: t.pos,
      morph: t.morph,
      inflectionData: t.morph,
      position: t.position,
      sentenceIndex: t.sentence_index,
    }));

    const response: ProcessTextResponse = {
      wordInstances,
      stats: {
        totalTokens: allTokens.length,
        wordTokens: wordTokens.length,
        totalTime: Date.now() - startTime,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[NLP API] Processing error:', error);
    return NextResponse.json(
      { error: 'Processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'NLP Processing API',
    version: '2.0.0',
    backend: 'spaCy via FastAPI microservice',
    endpoints: {
      POST: {
        description: 'Process text through spaCy pipeline (tokenization + lemmatization + POS)',
        request: { textContent: 'string (required)', languageId: 'string (required)' },
        response: { wordInstances: 'WordInstance[]', stats: 'ProcessingStats' },
      },
    },
  });
}
