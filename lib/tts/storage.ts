import { createClient } from '@/lib/supabase/server';

// Public-read bucket — pronunciation audio isn't sensitive per-user data,
// it's a shared cache (see lib/tts/wordAudioService.ts). Writes go through
// the same authenticated-user Supabase client used everywhere else in this
// app (lib/supabase/server.ts) — there is no service-role client here.
export const TTS_AUDIO_BUCKET = 'tts-audio';

// Storage paths are content-addressed (a hash of the text + voice + rate), so
// a given URL's bytes can never change — the cache lifetime is therefore
// capped only by how long we're willing to serve it. A year + immutable
// means repeat listens hit the browser/CDN cache instead of the network;
// measured cold-vs-warm fetch of the same object was ~1000ms vs ~35ms.
const AUDIO_CACHE_CONTROL = '31536000';

export async function uploadAudio(path: string, buffer: Buffer): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.storage.from(TTS_AUDIO_BUCKET).upload(path, buffer, {
    contentType: 'audio/mpeg',
    cacheControl: AUDIO_CACHE_CONTROL,
    upsert: true,
  });
  if (error) {
    throw new Error(`Failed to upload TTS audio to "${path}": ${error.message}`);
  }
}

/**
 * Deterministic public URL for a stored object. Pure string construction on
 * purpose: this used to build a fresh Supabase client (reading cookies) per
 * call just to concatenate a URL, which added a client construction to every
 * playback request — including cache hits, the common case.
 */
export function getPublicAudioUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }
  return `${base.replace(/\/$/, '')}/storage/v1/object/public/${TTS_AUDIO_BUCKET}/${path}`;
}
