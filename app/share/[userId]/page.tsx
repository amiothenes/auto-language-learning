import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { PublicStatsResponse } from '@/app/api/public/stats/route';

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

const LANGUAGE_FLAGS: Record<string, string> = {
  ru: '🇷🇺',
  es: '🇪🇸',
  en: '🇬🇧',
  fr: '🇫🇷',
  de: '🇩🇪',
  ja: '🇯🇵',
  zh: '🇨🇳',
  pt: '🇧🇷',
  it: '🇮🇹',
  ko: '🇰🇷',
};

async function fetchPublicStats(userId: string, lang: string): Promise<PublicStatsResponse | null> {
  try {
    const res = await fetch(
      `${APP_URL}/api/public/stats?userId=${encodeURIComponent(userId)}&lang=${encodeURIComponent(lang)}`,
      { next: { revalidate: 300 } } // cache for 5 minutes
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Metadata (user-specific OG image) ───────────────────────────────────────

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  const { lang } = await searchParams;
  const stats = lang ? await fetchPublicStats(userId, lang) : null;

  const title = stats
    ? `${stats.totalKnown.toLocaleString()} words known in ${stats.languageName} — Verbista`
    : 'My progress — Verbista';
  const ogImage = lang
    ? `${APP_URL}/og?userId=${encodeURIComponent(userId)}&lang=${encodeURIComponent(lang)}`
    : `${APP_URL}/og`;

  return {
    title,
    openGraph: {
      title,
      description: 'Grammar-in-context reading for Russian, Spanish, English, and French.',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      images: [ogImage],
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SharePage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { userId } = await params;
  const { lang } = await searchParams;

  const stats = lang ? await fetchPublicStats(userId, lang) : null;
  const flag = lang ? (LANGUAGE_FLAGS[lang] ?? '🌐') : null;

  return (
    <div className="min-h-screen bg-desk flex flex-col items-center justify-center px-4 py-16">

      {/* Progress card */}
      <div className="bg-paper border border-border rounded-card shadow-modal p-8 md:p-12 max-w-sm w-full text-center">

        {/* Wordmark */}
        <span
          className="block text-muted mb-6"
          style={{ fontFamily: 'var(--font-eb-garamond)', fontSize: '18px' }}
        >
          Verbista
        </span>

        {stats ? (
          <>
            {/* Language flag */}
            {flag && (
              <span className="block text-5xl mb-4" role="img" aria-label={stats.languageName}>
                {flag}
              </span>
            )}

            {/* Big stat */}
            <span
              className="block text-ink"
              style={{
                fontFamily: 'var(--font-eb-garamond)',
                fontSize: 'clamp(52px, 8vw, 72px)',
                lineHeight: 1,
              }}
            >
              {stats.totalKnown.toLocaleString()}
            </span>
            <span className="block font-sans text-ui-md text-muted mt-2 mb-6">
              words known in {stats.languageName}
            </span>

            {/* Badges */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <span className="font-sans text-ui-sm font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded">
                {stats.cefrBand}
              </span>
              {stats.streak > 0 && (
                <span className="font-sans text-ui-sm text-muted border border-border rounded px-3 py-1.5">
                  🔥 {stats.streak} day streak
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="py-8">
            <span className="block font-sans text-ui-md text-muted">
              Vocabulary progress not available.
            </span>
          </div>
        )}

        {/* CTA */}
        <Link
          href="/signup"
          className="inline-flex items-center justify-center gap-2 w-full font-sans text-ui-base font-medium bg-primary text-white px-5 py-2.5 rounded hover:bg-primary-dark transition-colors"
        >
          Learn with Verbista
          <ArrowRight size={16} strokeWidth={2} />
        </Link>
        <Link
          href="/"
          className="block font-sans text-ui-sm text-muted hover:text-ink transition-colors mt-3"
        >
          Learn more →
        </Link>
      </div>

    </div>
  );
}
