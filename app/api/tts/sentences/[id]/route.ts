import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sentences } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { eq } from 'drizzle-orm';
import { getOrSynthesizeSentenceAudio } from '@/lib/tts/sentenceAudioService';
import { RateLimitExceededError, VoiceNotConfiguredError } from '@/lib/tts/errors';
import type { ApiErrorResponse, SynthesizeSentenceAudioResponse } from '@/lib/types/api';

// ============================================================================
// POST /api/tts/sentences/[id] — synthesize (or fetch cached) narration audio
// for a sentence, with word-boundary marks aligned to wordInstances for
// karaoke-style highlight sync. `id` is sentences.id. `sentences` has no
// userId column, so ownership is checked via the parent text.
// ============================================================================

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  const { id } = await params;

  let body: { rate?: number; voiceId?: string } = {};
  try {
    const raw = await request.text();
    if (raw) body = JSON.parse(raw);
  } catch {
    return NextResponse.json<ApiErrorResponse>({ error: 'Invalid JSON' }, { status: 400 });
  }
  const rate = typeof body.rate === 'number' ? body.rate : 1.0;

  const sentence = await db.query.sentences.findFirst({
    where: eq(sentences.id, id),
    columns: { id: true, content: true },
    with: {
      text: {
        columns: { userId: true },
        with: { language: { columns: { code: true } } },
      },
    },
  });
  if (!sentence || sentence.text.userId !== user.id) {
    return NextResponse.json<ApiErrorResponse>({ error: 'Sentence not found' }, { status: 404 });
  }

  try {
    const result = await getOrSynthesizeSentenceAudio({
      sentenceId: sentence.id,
      content: sentence.content,
      languageCode: sentence.text.language.code,
      rate,
      userId: user.id,
      requestedVoiceId: typeof body.voiceId === 'string' ? body.voiceId : null,
    });
    return NextResponse.json<SynthesizeSentenceAudioResponse>(result);
  } catch (error) {
    if (error instanceof VoiceNotConfiguredError) {
      return NextResponse.json<ApiErrorResponse>({ error: 'VOICE_NOT_CONFIGURED' }, { status: 422 });
    }
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: `Too many sentence narration requests — try again in ${error.retryAfterSeconds}s`,
          retryAfter: error.retryAfterSeconds,
        },
        { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } }
      );
    }
    console.error('[TTS] Sentence synthesis failed:', error);
    return NextResponse.json<ApiErrorResponse>({ error: 'Speech synthesis failed' }, { status: 502 });
  }
}
