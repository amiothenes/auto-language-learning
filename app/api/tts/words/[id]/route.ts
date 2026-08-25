import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ownedBy } from '@/lib/db/scope';
import { requireUser } from '@/lib/auth/requireUser';
import { getOrSynthesizeWordAudio } from '@/lib/tts/wordAudioService';
import { RateLimitExceededError, VoiceNotConfiguredError } from '@/lib/tts/errors';
import type { ApiErrorResponse, SynthesizeWordAudioResponse } from '@/lib/types/api';

// ============================================================================
// POST /api/tts/words/[id] — synthesize (or fetch cached) pronunciation audio
// for a single word (lemma). `id` is words.id.
// ============================================================================

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  const { id } = await params;

  let body: { rate?: number; cachedOnly?: boolean; voiceId?: string } = {};
  try {
    const raw = await request.text();
    if (raw) body = JSON.parse(raw);
  } catch {
    return NextResponse.json<ApiErrorResponse>({ error: 'Invalid JSON' }, { status: 400 });
  }
  const rate = typeof body.rate === 'number' ? body.rate : 1.0;
  // Cache-only requests never reach Azure, so they cost nothing and are
  // exempt from the synthesis rate limit by construction (see the service).
  const cachedOnly = body.cachedOnly === true;

  const word = await db.query.words.findFirst({
    where: ownedBy('words', id, user.id),
    columns: { lemma: true },
    with: { language: { columns: { code: true } } },
  });
  if (!word) {
    return NextResponse.json<ApiErrorResponse>({ error: 'Word not found' }, { status: 404 });
  }

  try {
    const result = await getOrSynthesizeWordAudio({
      lemma: word.lemma,
      languageCode: word.language.code,
      rate,
      userId: user.id,
      cachedOnly,
      requestedVoiceId: typeof body.voiceId === 'string' ? body.voiceId : null,
    });
    return NextResponse.json<SynthesizeWordAudioResponse>(result);
  } catch (error) {
    if (error instanceof VoiceNotConfiguredError) {
      return NextResponse.json<ApiErrorResponse>({ error: 'VOICE_NOT_CONFIGURED' }, { status: 422 });
    }
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: `Too many word pronunciation requests — try again in ${error.retryAfterSeconds}s`,
          retryAfter: error.retryAfterSeconds,
        },
        { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } }
      );
    }
    console.error('[TTS] Word synthesis failed:', error);
    return NextResponse.json<ApiErrorResponse>({ error: 'Speech synthesis failed' }, { status: 502 });
  }
}
