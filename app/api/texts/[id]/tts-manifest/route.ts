import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sentenceAudio, sentences, wordInstances } from '@/lib/db/schema';
import { ownedBy } from '@/lib/db/scope';
import { requireUser } from '@/lib/auth/requireUser';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { alignMarksToWordInstances } from '@/lib/tts/alignment';
import { hashText } from '@/lib/tts/contentHash';
import { rateToRatePercent } from '@/lib/tts/rate';
import { getPublicAudioUrl } from '@/lib/tts/storage';
import { resolveVoiceForLanguage } from '@/lib/tts/voiceMap';
import type { ApiErrorResponse, TtsManifestResponse, TtsManifestEntry } from '@/lib/types/api';

// ============================================================================
// GET /api/texts/[id]/tts-manifest?rate=0.9
//
// Resolves ALREADY-CACHED narration audio for every sentence in a text in one
// round trip, so playback doesn't pay a per-sentence API call. Deliberately
// never synthesizes: a text can have hundreds of sentences, and one request
// that fanned out to Azure for all of them would be slow, expensive, and a
// rate-limit hazard. Uncached sentences come back with audioUrl: null and the
// client falls back to POST /api/tts/sentences/[id], which does synthesize.
// That also makes this endpoint free of rate limiting by construction.
// ============================================================================

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  const { id } = await params;

  const rateParam = Number(request.nextUrl.searchParams.get('rate'));
  const rate = Number.isFinite(rateParam) && rateParam > 0 ? rateParam : 1.0;
  const ratePercent = rateToRatePercent(rate);

  const text = await db.query.texts.findFirst({
    where: ownedBy('texts', id, user.id),
    columns: { id: true },
    with: { language: { columns: { code: true } } },
  });
  if (!text) {
    return NextResponse.json<ApiErrorResponse>({ error: 'Text not found' }, { status: 404 });
  }

  const languageCode = text.language.code;
  // Must resolve to the SAME voice the player will request, or the manifest
  // would prime the cache with rows playback never looks up.
  const voiceId = resolveVoiceForLanguage(
    languageCode,
    request.nextUrl.searchParams.get('voiceId')
  );
  if (!voiceId) {
    return NextResponse.json<ApiErrorResponse>({ error: 'VOICE_NOT_CONFIGURED' }, { status: 422 });
  }

  // Three bulk queries total, regardless of sentence count — the whole point
  // of this endpoint versus N per-sentence requests.
  const [sentenceRows, instanceRows] = await Promise.all([
    db.query.sentences.findMany({
      where: eq(sentences.textId, id),
      orderBy: asc(sentences.order),
      columns: { id: true, content: true, order: true },
    }),
    db.query.wordInstances.findMany({
      where: eq(wordInstances.textId, id),
      columns: { id: true, surfaceForm: true, position: true, sentenceId: true },
    }),
  ]);

  const hashBySentenceId = new Map<string, string>();
  for (const s of sentenceRows) {
    const trimmed = s.content.trim();
    if (trimmed) hashBySentenceId.set(s.id, hashText(trimmed));
  }

  const hashes = [...new Set(hashBySentenceId.values())];
  const audioRows = hashes.length
    ? await db.query.sentenceAudio.findMany({
        where: and(
          inArray(sentenceAudio.contentHash, hashes),
          eq(sentenceAudio.languageCode, languageCode),
          eq(sentenceAudio.voiceId, voiceId),
          eq(sentenceAudio.ratePercent, ratePercent)
        ),
      })
    : [];
  const audioByHash = new Map(audioRows.map((r) => [r.contentHash, r]));

  const instancesBySentence = new Map<string, typeof instanceRows>();
  for (const inst of instanceRows) {
    if (!inst.sentenceId) continue;
    const arr = instancesBySentence.get(inst.sentenceId);
    if (arr) arr.push(inst);
    else instancesBySentence.set(inst.sentenceId, [inst]);
  }

  const entries: TtsManifestEntry[] = sentenceRows.map((s) => {
    const hash = hashBySentenceId.get(s.id);
    const cached = hash ? audioByHash.get(hash) : undefined;
    if (!cached) {
      return { sentenceId: s.id, order: s.order, audioUrl: null, durationMs: 0, marks: [] };
    }
    return {
      sentenceId: s.id,
      order: s.order,
      audioUrl: getPublicAudioUrl(cached.storagePath),
      durationMs: cached.durationMs,
      marks: alignMarksToWordInstances(
        cached.marks,
        s.content.trim(),
        instancesBySentence.get(s.id) ?? []
      ),
    };
  });

  return NextResponse.json<TtsManifestResponse>({ textId: id, ratePercent, entries });
}
