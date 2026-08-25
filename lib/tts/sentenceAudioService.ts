import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { sentenceAudio, wordInstances } from '../db/schema';
import { checkRateLimit } from '../rateLimit';
import { alignMarksToWordInstances, type AlignedMark } from './alignment';
import { synthesizeSpeech } from './azureSpeechClient';
import { hashText } from './contentHash';
import { RateLimitExceededError, VoiceNotConfiguredError } from './errors';
import { quantizeRate, rateToRatePercent } from './rate';
import { getPublicAudioUrl, uploadAudio } from './storage';
import { resolveVoiceForLanguage } from './voiceMap';

/**
 * Global, content-keyed cache — see lib/db/schema/sentenceAudio.ts. Unlike
 * word audio, marks are re-aligned against the CURRENT wordInstances for
 * this sentenceId on every call (cache hit or miss) — cheap, and keeps
 * each mark's highlight target correct even if the text was reprocessed
 * since the audio was cached (reprocessing regenerates wordInstances with
 * new ids, but the cached audio itself is still valid since it's keyed by
 * content, not id).
 */
export async function getOrSynthesizeSentenceAudio({
  sentenceId,
  content,
  languageCode,
  rate,
  userId,
  requestedVoiceId,
}: {
  sentenceId: string;
  content: string;
  languageCode: string;
  rate: number;
  userId: string;
  /** Validated against the language's allow-list, never trusted as-is. */
  requestedVoiceId?: string | null;
}): Promise<{ audioUrl: string | null; durationMs: number; cached: boolean; marks: AlignedMark[] }> {
  const trimmed = content.trim();
  if (!trimmed) {
    return { audioUrl: null, durationMs: 0, cached: false, marks: [] };
  }

  const voiceId = resolveVoiceForLanguage(languageCode, requestedVoiceId);
  if (!voiceId) {
    throw new VoiceNotConfiguredError(`No TTS voice configured for language "${languageCode}"`);
  }
  const ratePercent = rateToRatePercent(rate);
  const contentHash = hashText(trimmed);

  // Independent lookups against a remote Postgres (~145ms each, measured) —
  // run concurrently rather than back-to-back, since neither needs the other.
  const [instanceRows, existing] = await Promise.all([
    db.query.wordInstances.findMany({
      where: eq(wordInstances.sentenceId, sentenceId),
      columns: { id: true, surfaceForm: true, position: true },
    }),
    db.query.sentenceAudio.findFirst({
      where: and(
        eq(sentenceAudio.contentHash, contentHash),
        eq(sentenceAudio.languageCode, languageCode),
        eq(sentenceAudio.voiceId, voiceId),
        eq(sentenceAudio.ratePercent, ratePercent)
      ),
    }),
  ]);

  if (existing) {
    const audioUrl = getPublicAudioUrl(existing.storagePath);
    const marks = alignMarksToWordInstances(existing.marks, trimmed, instanceRows);
    return { audioUrl, durationMs: existing.durationMs, cached: true, marks };
  }

  const rateLimit = await checkRateLimit('ttsSentence', userId);
  if (!rateLimit.allowed) {
    throw new RateLimitExceededError(rateLimit.retryAfterSeconds);
  }

  const {
    audioBuffer,
    marks: rawMarks,
    durationMs,
  } = await synthesizeSpeech({
    text: trimmed,
    voiceId,
    langCode: languageCode,
    rate: quantizeRate(rate),
  });

  const storagePath = `tts/sentence/${languageCode}/${voiceId}/${ratePercent}/${contentHash}.mp3`;
  await uploadAudio(storagePath, audioBuffer);

  await db
    .insert(sentenceAudio)
    .values({ contentHash, languageCode, voiceId, ratePercent, storagePath, durationMs, marks: rawMarks })
    .onConflictDoUpdate({
      target: [sentenceAudio.contentHash, sentenceAudio.languageCode, sentenceAudio.voiceId, sentenceAudio.ratePercent],
      set: { storagePath, durationMs, marks: rawMarks, updatedAt: new Date() },
    });

  const audioUrl = getPublicAudioUrl(storagePath);
  const marks = alignMarksToWordInstances(rawMarks, trimmed, instanceRows);
  return { audioUrl, durationMs, cached: false, marks };
}
