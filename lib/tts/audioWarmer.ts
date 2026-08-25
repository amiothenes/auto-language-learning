'use client';

// Warmed <audio> elements are kept referenced on purpose: dropping the only
// reference to an element mid-download lets the browser cancel the request,
// which would defeat the prefetch.
const warmed = new Map<string, HTMLAudioElement>();
const MAX_WARMED = 12;

/**
 * Pulls an MP3 into the browser's HTTP cache ahead of time. Uses an <audio>
 * element rather than fetch() so it isn't subject to CORS preflight, and so
 * the bytes land in exactly the cache the real playback element reads from.
 * Measured cold vs. warm on the same object: ~424ms vs ~106ms for a word.
 */
export function warmAudio(url: string | null): void {
  if (!url || warmed.has(url)) return;

  const el = new Audio();
  el.preload = 'auto';
  el.src = url;
  warmed.set(url, el);

  if (warmed.size > MAX_WARMED) {
    const oldestUrl = warmed.keys().next().value;
    if (oldestUrl !== undefined) {
      const oldest = warmed.get(oldestUrl);
      if (oldest) oldest.src = '';
      warmed.delete(oldestUrl);
    }
  }
}
