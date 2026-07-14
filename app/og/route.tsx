import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import type { PublicStatsResponse } from '@/app/api/public/stats/route';

export const runtime = 'edge';

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

// GET /og                         → generic marketing card
// GET /og?userId=xxx&lang=es      → user-specific progress card
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const userId = searchParams.get('userId');
  const lang = searchParams.get('lang');

  let stats: PublicStatsResponse | null = null;
  if (userId && lang) {
    try {
      const res = await fetch(`${origin}/api/public/stats?userId=${encodeURIComponent(userId)}&lang=${encodeURIComponent(lang)}`);
      if (res.ok) stats = await res.json();
    } catch {
      // fall through to generic card
    }
  }

  const flag = lang ? (LANGUAGE_FLAGS[lang] ?? '🌐') : null;

  return new ImageResponse(
    stats ? (
      // ── User-specific progress card ──────────────────────────────────────
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#183A37',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top: flag + language name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: 56 }}>{flag}</span>
          <span style={{ color: 'rgba(240,239,234,0.65)', fontSize: 28, letterSpacing: 2 }}>
            {stats.languageName.toUpperCase()}
          </span>
        </div>

        {/* Center: big stat */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
          <span
            style={{
              color: '#ffffff',
              fontSize: 96,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: -2,
            }}
          >
            {stats.totalKnown.toLocaleString()}
          </span>
          <span style={{ color: 'rgba(240,239,234,0.75)', fontSize: 36, marginTop: 8 }}>
            words known
          </span>
        </div>

        {/* Bottom row: CEFR + streak + branding */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            {/* CEFR badge */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.12)',
                borderRadius: 12,
                padding: '14px 28px',
              }}
            >
              <span style={{ color: '#ffffff', fontSize: 28, fontWeight: 700 }}>{stats.cefrBand}</span>
              <span style={{ color: 'rgba(240,239,234,0.55)', fontSize: 14, marginTop: 4 }}>CEFR</span>
            </div>

            {/* Streak badge (only show if > 0) */}
            {stats.streak > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  padding: '14px 28px',
                }}
              >
                <span style={{ color: '#ffffff', fontSize: 28, fontWeight: 700 }}>
                  🔥 {stats.streak}
                </span>
                <span style={{ color: 'rgba(240,239,234,0.55)', fontSize: 14, marginTop: 4 }}>
                  day streak
                </span>
              </div>
            )}
          </div>

          {/* Wordmark */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ color: '#ffffff', fontSize: 24, fontWeight: 700, letterSpacing: 1 }}>
              VERBISTA
            </span>
            <span style={{ color: 'rgba(240,239,234,0.4)', fontSize: 16 }}>verbista.vercel.app</span>
          </div>
        </div>
      </div>
    ) : (
      // ── Generic marketing card ────────────────────────────────────────────
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#183A37',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Wordmark */}
        <span
          style={{
            color: 'rgba(240,239,234,0.55)',
            fontSize: 18,
            letterSpacing: 5,
            textTransform: 'uppercase' as const,
          }}
        >
          VERBISTA
        </span>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
          <span
            style={{
              color: '#ffffff',
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            Grammar in context,
          </span>
          <span
            style={{
              color: '#ffffff',
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            word by word.
          </span>
          <span
            style={{
              color: 'rgba(240,239,234,0.6)',
              fontSize: 28,
              marginTop: 24,
            }}
          >
            Read Russian, Spanish, English and French — tap any word for its grammar.
          </span>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 52, letterSpacing: 8 }}>🇷🇺 🇪🇸 🇬🇧 🇫🇷</span>
          <span style={{ color: 'rgba(240,239,234,0.4)', fontSize: 20 }}>verbista.vercel.app</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
