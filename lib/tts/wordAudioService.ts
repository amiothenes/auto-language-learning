import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { wordAudio } from '../db/schema';
import { checkRateLimit } from '../rateLimit';
import { synthesizeSpeech } from './azureSpeechClient';
import { hashText } from './contentHash';
import { quantizeRate, rateToRatePercent } from './rate';
import { getPublicAudioUrl, uploadAudio } from './storage';
import { resolveVoiceForLanguage } from './voiceMap';
import { RateLimitExceededError, VoiceNotConfiguredError } from './errors';

/**
 * Global, content-keyed cache — see lib/db/schema/wordAudio.ts. Rate limiting
 * (per userId) is only checked on an actual cache miss, right before the
 * real Azure call, so re-listening to already-cached words never burns quota.
 *
 * `cachedOnly` makes this a pure lookup: it answers "is this word already
 * synthesized?" and returns audioUrl: null if not, without calling Azure or
 * touching the rate limit. That's what the tooltip's open-time prefetch uses,
 * so merely LOOKING at a word never spends synthesis quota — only pressing
 * the speaker does.
 */
export async function getOrSynthesizeWordAudio({
  lemma,
  languageCode,
  rate,
  userId,
  cachedOnly = false,
  requestedVoiceId,
}: {
  lemma: string;
  languageCode: string;
  rate: number;
  userId: string;
  cachedOnly?: boolean;
  /** Validated against the language's allow-list, never trusted as-is. */
  requestedVoiceId?: string | null;
}): Promise<{ audioUrl: string | null; durationMs: number; cached: boolean }> {
  const voiceId = resolveVoiceForLanguage(languageCode, requestedVoiceId);
  if (!voiceId) {
    throw new VoiceNotConfiguredError(`No TTS voice configured for language "${languageCode}"`);
  }
  const ratePercent = rateToRatePercent(rate);

  const existing = await db.query.wordAudio.findFirst({
    where: and(
      eq(wordAudio.lemma, lemma),
      eq(wordAudio.languageCode, languageCode),
      eq(wordAudio.voiceId, voiceId),
      eq(wordAudio.ratePercent, ratePercent)
    ),
  });
  if (existing) {
    const audioUrl = getPublicAudioUrl(existing.storagePath);
    return { audioUrl, durationMs: existing.durationMs, cached: true };
  }

  // Probe-only caller: report the miss instead of synthesizing it.
  if (cachedOnly) {
    return { audioUrl: null, durationMs: 0, cached: false };
  }

  const rateLimit = await checkRateLimit('ttsWord', userId);
  if (!rateLimit.allowed) {
    throw new RateLimitExceededError(rateLimit.retryAfterSeconds);
  }

  const { audioBuffer, durationMs } = await synthesizeSpeech({
    text: lemma,
    voiceId,
    langCode: languageCode,
    rate: quantizeRate(rate),
  });

  const storagePath = `tts/word/${languageCode}/${voiceId}/${ratePercent}/${hashText(lemma)}.mp3`;
  await uploadAudio(storagePath, audioBuffer);

  await db
    .insert(wordAudio)
    .values({ lemma, languageCode, voiceId, ratePercent, storagePath, durationMs })
    .onConflictDoUpdate({
      target: [wordAudio.lemma, wordAudio.languageCode, wordAudio.voiceId, wordAudio.ratePercent],
      set: { storagePath, durationMs, updatedAt: new Date() },
    });

  const audioUrl = getPublicAudioUrl(storagePath);
  return { audioUrl, durationMs, cached: false };
}
