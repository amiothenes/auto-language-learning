'use client';

import { rateToRatePercent } from './rate';
import { warmAudio } from './audioWarmer';
import type {
  SynthesizeSentenceAudioResponse,
  TtsManifestEntry,
  WordBoundaryMarkResponse,
} from '@/lib/types/api';

export interface ResolvedSentenceAudio {
  audioUrl: string | null;
  durationMs: number;
  marks: WordBoundaryMarkResponse[];
}

// Session-scoped, module-level (not React state) so it survives Reader
// re-mounts the same way the shared <audio> element and karaoke session do.
const resolved = new Map<string, ResolvedSentenceAudio>();
const inFlight = new Map<string, Promise<ResolvedSentenceAudio>>();

function cacheKey(sentenceId: string, ratePercent: number, voiceId?: string): string {
  return `${sentenceId}:${ratePercent}:${voiceId ?? 'default'}`;
}

/** Bulk-seed from GET /api/texts/[id]/tts-manifest. */
export function primeFromManifest(
  entries: TtsManifestEntry[],
  ratePercent: number,
  voiceId?: string
): void {
  for (const entry of entries) {
    if (!entry.audioUrl) continue; // not synthesized yet — leave it to the lazy path
    resolved.set(cacheKey(entry.sentenceId, ratePercent, voiceId), {
      audioUrl: entry.audioUrl,
      durationMs: entry.durationMs,
      marks: entry.marks,
    });
  }
}

/**
 * Cache-then-network. Concurrent callers for the same sentence share one
 * request, so a prefetch already in flight is reused rather than duplicated
 * when playback catches up to it.
 */
export function resolveSentenceAudio(
  sentenceId: string,
  rate: number,
  voiceId?: string
): Promise<ResolvedSentenceAudio> {
  const key = cacheKey(sentenceId, rateToRatePercent(rate), voiceId);

  const hit = resolved.get(key);
  if (hit) return Promise.resolve(hit);

  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = (async () => {
    try {
      const res = await fetch(`/api/tts/sentences/${sentenceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate, voiceId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? 'Playback failed');
      }
      const data: SynthesizeSentenceAudioResponse = await res.json();
      const value: ResolvedSentenceAudio = {
        audioUrl: data.audioUrl,
        durationMs: data.durationMs,
        marks: data.marks,
      };
      resolved.set(key, value);
      return value;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, request);
  return request;
}

/** Fire-and-forget warm of a sentence that's about to be needed. Failures are
 * swallowed deliberately — a prefetch miss must never surface as a playback
 * error; the real request will retry and report properly if it still fails. */
export function prefetchSentenceAudio(sentenceId: string, rate: number, voiceId?: string): void {
  resolveSentenceAudio(sentenceId, rate, voiceId)
    .then((value) => warmAudio(value.audioUrl))
    .catch(() => {});
}
