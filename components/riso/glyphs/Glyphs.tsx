import type { ReactNode } from 'react';
import { INK } from '@/components/riso/RisoDefs';
import { BASIC_GLYPHS } from './sets/basics';
import { PEOPLE_GLYPHS } from './sets/people';
import { NATURE_GLYPHS } from './sets/nature';
import { HOME_GLYPHS } from './sets/home';
import { BODY_GLYPHS } from './sets/body';
import { PLACES_GLYPHS } from './sets/places';
import { ACTION_GLYPHS } from './sets/actions';

/**
 * Riso glyphs for picture flashcards: small two-ink drawings keyed by deck
 * conceptId (content/<lang>/deck.generated.json, language-independent).
 *
 * Every concrete or picturable concept in the starter deck has one, in sets
 * under ./sets (drawn with ./kit). Words a picture would get wrong, or treat
 * insensitively (grammar words, most abstractions, and a few sensitive
 * concepts), are listed in TYPOGRAPHIC_ONLY and keep the typographic card,
 * as Wyner's method recommends. lib/onboarding/glyphCoverage.test.ts checks
 * that every deck concept is one or the other.
 *
 * Each glyph: a 64×64 canvas, ochre underlay offset (misregistration), green
 * line/fill on top, at most one coral accent.
 */

const S = { stroke: INK.green, strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

function G({ under, children }: { under: ReactNode; children: ReactNode }) {
  return (
    <>
      <g fill={INK.ochre} opacity="0.55" transform="translate(-2,1.8)" style={{ mixBlendMode: 'multiply' }}>
        {under}
      </g>
      {children}
    </>
  );
}

// The original Chapter 1 set (drawn first; takes precedence over the sets).
const CHAPTER_ONE: Record<string, ReactNode> = {
  'boy-child': (
    <G under={<path d="M20 58 L22 36 Q32 30 42 36 L44 58 Z" />}>
      <circle cx="32" cy="20" r="9" fill={INK.green} />
      <path d="M20 58 L22 36 Q32 30 42 36 L44 58" {...S} />
      <path d="M26 13 Q32 6 38 13" {...S} />
    </G>
  ),
  book: (
    <G under={<path d="M8 18 Q20 12 32 18 V54 Q20 48 8 54 Z" />}>
      <path d="M8 18 Q20 12 32 18 Q44 12 56 18 V54 Q44 48 32 54 Q20 48 8 54 Z" {...S} />
      <path d="M32 18 V54" {...S} />
      <path d="M14 26 H26 M14 33 H26 M38 26 H50 M38 33 H50" {...S} strokeWidth={2} opacity="0.6" />
    </G>
  ),
  house: (
    <G under={<rect x="14" y="30" width="36" height="26" />}>
      <path d="M8 32 L32 10 L56 32" {...S} />
      <path d="M14 28 V56 H50 V28" {...S} />
      <rect x="27" y="40" width="10" height="16" fill={INK.coral} />
    </G>
  ),
  door: (
    <G under={<path d="M18 58 V20 Q32 6 46 20 V58 Z" />}>
      <path d="M18 58 V20 Q32 6 46 20 V58 Z" {...S} />
      <circle cx="39" cy="38" r="2.6" fill={INK.coral} />
      <path d="M10 58 H54" {...S} />
    </G>
  ),
  key: (
    <G under={<circle cx="20" cy="32" r="11" />}>
      <circle cx="20" cy="32" r="10" {...S} stroke={INK.coral} strokeWidth={5} />
      <path d="M30 32 H56 M48 32 V41 M55 32 V38" {...S} stroke={INK.coral} strokeWidth={5} />
    </G>
  ),
  cat: (
    <G under={<path d="M14 56 Q12 34 24 30 L40 30 Q52 34 50 56 Z" />}>
      <path d="M14 56 Q12 34 24 30 L40 30 Q52 34 50 56 Z" fill={INK.green} />
      <path d="M22 31 L20 18 L28 27 M42 31 L44 18 L36 27" {...S} fill={INK.green} />
      <path d="M50 52 Q60 48 56 36" {...S} />
      <circle cx="27" cy="40" r="2" fill={INK.paper} />
      <circle cx="37" cy="40" r="2" fill={INK.paper} />
    </G>
  ),
  night: (
    <G under={<circle cx="30" cy="32" r="18" />}>
      <path d="M40 12 A20 20 0 1 0 52 42 A16 16 0 1 1 40 12 Z" fill={INK.green} />
      <path d="M50 14 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5 z" fill={INK.coral} />
    </G>
  ),
  light: (
    <G under={<circle cx="32" cy="32" r="14" />}>
      <circle cx="32" cy="32" r="11" fill={INK.coral} />
      <path d="M32 8 V14 M32 50 V56 M8 32 H14 M50 32 H56 M15 15 L19 19 M45 45 L49 49 M49 15 L45 19 M19 45 L15 49" {...S} />
    </G>
  ),
  lamp: (
    <G under={<path d="M20 14 H44 L50 34 H14 Z" />}>
      <path d="M20 14 H44 L50 34 H14 Z" {...S} />
      <path d="M32 34 V52 M22 54 H42" {...S} />
      <ellipse cx="32" cy="38" rx="5" ry="3" fill={INK.coral} />
    </G>
  ),
  table: (
    <G under={<rect x="8" y="22" width="48" height="8" />}>
      <path d="M8 24 H56 M14 24 V54 M50 24 V54 M14 38 H50" {...S} />
      <rect x="27" y="14" width="10" height="10" rx="1" fill={INK.coral} />
    </G>
  ),
};

const GLYPHS: Record<string, ReactNode> = {
  ...BASIC_GLYPHS,
  ...PEOPLE_GLYPHS,
  ...NATURE_GLYPHS,
  ...HOME_GLYPHS,
  ...BODY_GLYPHS,
  ...PLACES_GLYPHS,
  ...ACTION_GLYPHS,
  ...CHAPTER_ONE,
};

/** All concept ids that have a picture. */
export const GLYPH_IDS: string[] = Object.keys(GLYPHS);

export function hasGlyph(conceptId: string | null | undefined): boolean {
  return !!conceptId && conceptId in GLYPHS;
}

export function Glyph({ conceptId, size = 96, label }: { conceptId: string; size?: number; label?: string }) {
  const art = GLYPHS[conceptId];
  if (!art) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {art}
      {/* Grain pass: riso-grain outputs noise clipped to the ink shapes, so
          laying it over the art adds texture without greying the background. */}
      <g filter="url(#riso-grain)" opacity="0.45" style={{ mixBlendMode: 'multiply' }}>
        {art}
      </g>
    </svg>
  );
}
