/**
 * NLP Processing API Route
 *
 * POST /api/nlp/process-text
 *
 * Processes text through the NLP pipeline:
 * 1. Fetches language metadata from database
 * 2. Tokenizes text with language-specific rules
 * 3. Lemmatizes tokens in batches
 * 4. Returns structured word data for reader
 *
 * **Request:**
 * ```json
 * {
 *   "textContent": "El gobierno anunció reformas...",
 *   "languageId": "lang_spanish_id"
 * }
 * ```
 *
 * **Response:**
 * ```json
 * {
 *   "wordInstances": [
 *     {
 *       "surface": "anunció",
 *       "lemma": "anunciar",
 *       "pos": "VERB",
 *       "inflectionData": { "tense": "past", "number": "singular" },
 *       "position": 12,
 *       "sentenceIndex": 0
 *     }
 *   ],
 *   "stats": {
 *     "totalTokens": 247,
 *     "wordTokens": 189,
 *     "tokenizeTime": 45,
 *     "lemmatizeTime": 234,
 *     "cacheHitRate": 0.73
 *   }
 * }
 * ```
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { languages } from '@/lib/db/schema/languages';
import { eq } from 'drizzle-orm';
import { tokenizeText } from '@/lib/nlp/tokenizer';
import { lemmatizeBatch } from '@/lib/nlp/lemmatizer';

// ============================================================================
// Request/Response Types
// ============================================================================

interface ProcessTextRequest {
  /** Full text content to process */
  textContent: string;

  /** Language ID from database */
  languageId: string;
}

interface WordInstance {
  /** Surface form as it appears in text */
  surface: string;

  /** Root lemma form */
  lemma: string;

  /** Universal Dependencies POS tag */
  pos: string;

  /** Grammatical inflection metadata */
  inflectionData: Record<string, unknown>;

  /** Character position in text */
  position: number;

  /** Sentence index (0-based) */
  sentenceIndex: number;

  /** Token index within sentence */
  tokenIndex: number;

  /** Whether this is a contraction */
  isContraction?: boolean;

  /** Sub-tokens if contraction */
  subTokens?: string[];
}

interface ProcessTextResponse {
  /** Array of processed word instances */
  wordInstances: WordInstance[];

  /** Processing statistics */
  stats: {
    /** Total tokens (words + punctuation) */
    totalTokens: number;

    /** Word tokens only */
    wordTokens: number;

    /** Tokenization time (ms) */
    tokenizeTime: number;

    /** Lemmatization time (ms) */
    lemmatizeTime: number;

    /** Total processing time (ms) */
    totalTime: number;

    /** Cache hit rate (0-1) */
    cacheHitRate: number;
  };
}

// ============================================================================
// API Route Handler
// ============================================================================

/**
 * POST /api/nlp/process-text
 *
 * Process text through NLP pipeline
 */
export async function POST(request: Request) {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Parse request body
    const body = (await request.json()) as ProcessTextRequest;
    const { textContent, languageId } = body;

    // Validate request
    if (!textContent || textContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'textContent is required and cannot be empty' },
        { status: 400 }
      );
    }

    if (!languageId) {
      return NextResponse.json(
        { error: 'languageId is required' },
        { status: 400 }
      );
    }

    // Fetch language metadata from database
    const language = await db.query.languages.findFirst({
      where: eq(languages.id, languageId),
    });

    if (!language) {
      return NextResponse.json(
        { error: `Language not found: ${languageId}` },
        { status: 404 }
      );
    }

    console.log(`[NLP API] Processing text in language: ${language.code} (${language.name})`);

    // Step 1: Tokenize text
    const tokenizeStart = Date.now();

    const tokens = await tokenizeText(textContent, {
      languageCode: language.code,
      sentenceSplitRegex: language.sentenceSplitRegex || '[.!?]+',
      characterSubstitutions: (language.characterSubstitutions as Record<string, string>) || {},
      isRTL: language.isRTL || false,
    });

    const tokenizeTime = Date.now() - tokenizeStart;

    console.log(`[NLP API] Tokenized ${tokens.length} tokens in ${tokenizeTime}ms`);

    // Filter to word tokens only (exclude punctuation)
    const wordTokens = tokens.filter((t) => t.isWord);

    // Step 2: Lemmatize word tokens in batch
    const lemmatizeStart = Date.now();

    const lemmaResponse = await lemmatizeBatch({
      words: wordTokens.map((t) => t.cleanForm),
      languageCode: language.code,
    });

    const lemmatizeTime = Date.now() - lemmatizeStart;

    console.log(
      `[NLP API] Lemmatized ${wordTokens.length} words in ${lemmatizeTime}ms ` +
      `(cache hit rate: ${(lemmaResponse.cacheHitRate * 100).toFixed(1)}%)`
    );

    // Step 3: Combine tokens with lemmatization results
    const wordInstances: WordInstance[] = wordTokens.map((token, index) => {
      const lemmaResult = lemmaResponse.results[index];

      return {
        surface: token.surfaceForm,
        lemma: lemmaResult.lemma,
        pos: lemmaResult.pos,
        inflectionData: lemmaResult.inflectionData,
        position: token.position,
        sentenceIndex: token.sentenceIndex,
        tokenIndex: token.tokenIndex,
        isContraction: token.isContraction,
        subTokens: token.subTokens,
      };
    });

    // Build response
    const totalTime = Date.now() - tokenizeStart;

    const response: ProcessTextResponse = {
      wordInstances,
      stats: {
        totalTokens: tokens.length,
        wordTokens: wordTokens.length,
        tokenizeTime,
        lemmatizeTime,
        totalTime,
        cacheHitRate: lemmaResponse.cacheHitRate,
      },
    };

    console.log(
      `[NLP API] Completed processing in ${totalTime}ms ` +
      `(${wordTokens.length} words, ${(lemmaResponse.cacheHitRate * 100).toFixed(1)}% cache hit)`
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('[NLP API] Processing error:', error);

    return NextResponse.json(
      {
        error: 'Processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/nlp/process-text
 *
 * Return API information
 */
export async function GET() {
  return NextResponse.json({
    service: 'NLP Processing API',
    version: '1.0.0',
    endpoints: {
      POST: {
        description: 'Process text through NLP pipeline (tokenization + lemmatization)',
        request: {
          textContent: 'string (required)',
          languageId: 'string (required)',
        },
        response: {
          wordInstances: 'WordInstance[]',
          stats: 'ProcessingStats',
        },
      },
    },
    capabilities: {
      tokenization: 'Language-aware text splitting with position tracking',
      lemmatization: 'Universal Dependencies-based lemma extraction',
      posTagging: 'Multilingual POS tagging via Transformers.js',
      caching: 'LRU cache for < 100ms per-word performance',
    },
  });
}
