import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { ApiErrorResponse } from '@/lib/types/api';

// True only for a real production deploy (Vercel prod, or a self-hosted `next
// start` prod build) — never local dev or a Vercel preview, both of which run
// with Redis intentionally unconfigured.
const isProduction = (process.env.VERCEL_ENV ?? process.env.NODE_ENV) === 'production';

// Fails open: if Redis isn't configured or errors, requests are allowed through.
// Availability matters more than strict cost enforcement at this app's scale.
// Missing config in production should never happen — it means a deploy is
// misconfigured — so it's reported to Sentry as fatal (see also the module
// load doubling as a per-cold-start "startup check").
let redis: Redis | null = null;
try {
  redis = Redis.fromEnv();
} catch (error) {
  redis = null;
  if (isProduction) {
    console.error('[rateLimit] UPSTASH_REDIS_* not configured — all rate limits are failing open');
    Sentry.captureMessage('Rate limiting is not configured in production — all limits are failing open', {
      level: 'fatal',
      tags: { component: 'rateLimit' },
      extra: { error },
    });
  }
}

export type RateLimitName = 'import' | 'fetchUrl' | 'translationsProcess' | 'bulkUpdate' | 'textsBulk' | 'ttsWord' | 'ttsSentence';

const RATE_LIMIT_CONFIG: Record<RateLimitName, { limit: number; window: `${number} ${'s' | 'm' | 'h' | 'd'}` }> = {
  import: { limit: 5, window: '1 h' },
  fetchUrl: { limit: 10, window: '1 h' },
  translationsProcess: { limit: 10, window: '1 h' },
  bulkUpdate: { limit: 20, window: '1 h' },
  textsBulk: { limit: 20, window: '1 h' },
  // Only consumed on an actual cache-miss (real Azure synthesis) — see
  // lib/tts/wordAudioService.ts / sentenceAudioService.ts. Re-listening to
  // already-cached audio never counts against these.
  ttsWord: { limit: 120, window: '1 h' },
  ttsSentence: { limit: 300, window: '1 h' },
};

const RATE_LIMIT_LABELS: Record<RateLimitName, string> = {
  import: 'imports',
  fetchUrl: 'URL fetches',
  translationsProcess: 'translation requests',
  bulkUpdate: 'bulk vocabulary updates',
  textsBulk: 'bulk text actions',
  ttsWord: 'word pronunciation requests',
  ttsSentence: 'sentence narration requests',
};

const limiters = redis
  ? (Object.fromEntries(
      (Object.keys(RATE_LIMIT_CONFIG) as RateLimitName[]).map((name) => [
        name,
        new Ratelimit({
          redis: redis!,
          limiter: Ratelimit.slidingWindow(RATE_LIMIT_CONFIG[name].limit, RATE_LIMIT_CONFIG[name].window),
          prefix: `ratelimit:${name}`,
        }),
      ])
    ) as Record<RateLimitName, Ratelimit>)
  : null;

export interface RateLimitCheck {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
}

export async function checkRateLimit(name: RateLimitName, userId: string): Promise<RateLimitCheck> {
  if (!limiters) {
    return { allowed: true, retryAfterSeconds: 0, remaining: -1 };
  }

  try {
    const { success, remaining, reset } = await limiters[name].limit(userId);
    const retryAfterSeconds = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
    return { allowed: success, retryAfterSeconds, remaining };
  } catch (error) {
    console.error(`[rateLimit] check failed for "${name}" — failing open`, error);
    Sentry.captureException(error, {
      level: 'warning',
      tags: { component: 'rateLimit', limiter: name },
    });
    return { allowed: true, retryAfterSeconds: 0, remaining: -1 };
  }
}

export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) return 'under a minute';
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}

export function rateLimitResponse(name: RateLimitName, check: RateLimitCheck) {
  return NextResponse.json<ApiErrorResponse>(
    {
      error: `Too many ${RATE_LIMIT_LABELS[name]} — try again in ${formatRetryAfter(check.retryAfterSeconds)}`,
      retryAfter: check.retryAfterSeconds,
    },
    { status: 429, headers: { 'Retry-After': String(check.retryAfterSeconds) } }
  );
}
