'use client';

import { rateToRatePercent } from './rate';
import { warmAudio } from './audioWarmer';
import type { SynthesizeWordAudioResponse } from '@/lib/types/api';

export interface ResolvedWordAudio {
  audioUrl: string;
  durationMs: number;
}

// Session-scoped and module-level, so re-opening the same word — or meeting
// the same lemma again later in a text — costs nothing.
const resolved = new Map<string, ResolvedWordAudio>();

// Full requests (may synthesize) and cache-only probes (never do) are tracked
// separately on purpose. A click must never simply join an in-flight probe:
// the probe can legitimately answer "not cached", which would leave the click
// with no audio despite the user having asked for it.
const inFlightFull = new Map<string, Promise<ResolvedWordAudio>>();
const inFlightProbe = new Map<string, Promise<ResolvedWordAudio | null>>();

// Voice is part of the key: switching voice must not replay audio synthesized
// in the previous one.
function cacheKey(wordId: string, rate: number, voiceId?: string): string {
  return `${wordId}:${rateToRatePercent(rate)}:${voiceId ?? 'default'}`;
}

async function request(
  wordId: string,
  rate: number,
  cachedOnly: boolean,
  voiceId?: string
): Promise<ResolvedWordAudio | null> {
  const res = await fetch(`/api/tts/words/${wordId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rate, cachedOnly, voiceId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error ?? 'Playback failed');
  }
  const data: SynthesizeWordAudioResponse = await res.json();
  if (!data.audioUrl) return null; // cache-only probe: not synthesized yet

  const value: ResolvedWordAudio = { audioUrl: data.audioUrl, durationMs: data.durationMs };
  resolved.set(cacheKey(wordId, rate, voiceId), value);
  warmAudio(value.audioUrl);
  return value;
}

/**
 * Cache-only warm, called when a word's tooltip/sheet opens.
 *
 * Deliberately never synthesizes: opening a word must not spend Azure quota
 * or rate-limit budget for audio that may never be played. When the word HAS
 * been synthesized before (the common case, since the cache is global and
 * shared across all users), this turns the speaker button instant by paying
 * the ~760ms lookup + MP3 download while the user is still reading the
 * tooltip. When it hasn't, this costs a single cheap DB lookup and the click
 * synthesizes as before.
 */
export function prefetchWordAudio(wordId: string, rate: number, voiceId?: string): void {
  const key = cacheKey(wordId, rate, voiceId);
  if (resolved.has(key) || inFlightFull.has(key) || inFlightProbe.has(key)) return;

  const probe = request(wordId, rate, true, voiceId).finally(() => inFlightProbe.delete(key));
  inFlightProbe.set(key, probe);
  probe.catch(() => {}); // a failed probe is never surfaced; the click will retry properly
}

/** Full resolve for an actual play — synthesizes if the word isn't cached. */
export function resolveWordAudio(
  wordId: string,
  rate: number,
  voiceId?: string
): Promise<ResolvedWordAudio> {
  const key = cacheKey(wordId, rate, voiceId);

  const hit = resolved.get(key);
  if (hit) return Promise.resolve(hit);

  const existing = inFlightFull.get(key);
  if (existing) return existing;

  const run = (async () => {
    // If the open-time probe is still in flight, let it finish first: when the
    // word IS cached that's the complete answer at no extra cost. Only if it
    // comes back empty do we fall through to a synthesizing request.
    const probe = inFlightProbe.get(key);
    if (probe) {
      const probed = await probe.catch(() => null);
      if (probed) return probed;
    }
    const value = await request(wordId, rate, false, voiceId);
    if (!value) throw new Error('No audio available for this word');
    return value;
  })();

  const tracked = run.finally(() => inFlightFull.delete(key));
  inFlightFull.set(key, tracked);
  return tracked;
}
