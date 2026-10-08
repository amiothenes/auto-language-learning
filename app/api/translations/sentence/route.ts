import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sentences, languages } from '@/lib/db/schema';
import { ownedBy } from '@/lib/db/scope';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { translateWord } from '@/lib/translation/azureTranslator';
import { resolveTranslationTarget } from '@/lib/languages/presets';
import { eq } from 'drizzle-orm';
import type { ApiErrorResponse } from '@/lib/types/api';

// ============================================================================
// POST /api/translations/sentence — on-demand, ephemeral sentence translation
// for the Reader's word-tooltip "Translate sentence" button. No DB write —
// unlike word-level translations (word_translations), a full sentence isn't
// worth caching; re-translating on a rare repeat tap is cheap enough.
// ============================================================================

interface TranslateSentenceRequestBody {
  sentenceId: string;
}

interface TranslateSentenceResponse {
  translation: string | null;
}

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  let body: TranslateSentenceRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiErrorResponse>({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.sentenceId) {
    return NextResponse.json<ApiErrorResponse>({ error: 'sentenceId is required' }, { status: 400 });
  }

  // Sentences carry no userId of their own — ownership flows through the
  // parent text, same as GET /api/texts/[id]/sentences.
  const sentenceRow = await db.query.sentences.findFirst({
    where: eq(sentences.id, body.sentenceId),
    columns: { id: true, content: true, textId: true },
  });
  if (!sentenceRow) {
    return NextResponse.json<ApiErrorResponse>({ error: 'Sentence not found' }, { status: 404 });
  }

  const text = await db.query.texts.findFirst({
    where: ownedBy('texts', sentenceRow.textId, user.id),
    columns: { languageId: true },
  });
  if (!text) {
    return NextResponse.json<ApiErrorResponse>({ error: 'Sentence not found' }, { status: 404 });
  }

  const rateLimitCheck = await checkRateLimit('translateSentence', user.id);
  if (!rateLimitCheck.allowed) {
    return rateLimitResponse('translateSentence', rateLimitCheck);
  }

  const language = await db.query.languages.findFirst({
    where: eq(languages.id, text.languageId),
    columns: { code: true, defaultTranslationLangCode: true },
  });
  const targetLangCode = language ? resolveTranslationTarget(language) : null;
  if (!language || !targetLangCode) {
    return NextResponse.json<ApiErrorResponse>({ error: 'No translation target available for this language' }, { status: 422 });
  }

  try {
    const translation = await translateWord(sentenceRow.content, language.code, targetLangCode);
    return NextResponse.json<TranslateSentenceResponse>({ translation });
  } catch {
    return NextResponse.json<ApiErrorResponse>({ error: 'Translation service is temporarily unavailable' }, { status: 502 });
  }
}
