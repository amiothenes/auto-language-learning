import type { ReactNode, SVGProps } from 'react';
import { INK } from '@/components/riso/RisoDefs';

/*
 * Drawing kit for riso glyphs (64×64 canvas).
 *
 * Every glyph follows the same recipe so the set reads as one print run:
 *  1. an ochre "ink blob" behind the subject, offset down-left (misregistration),
 *  2. green line art (stroke 3, round caps) and green fills on top,
 *  3. at most one coral accent, for the thing the word is about.
 *
 * For family and relationship words, the coral figure IS the word
 * (e.g. "daughter" = the coral child beside green parents).
 */

export const INKS = INK;
export const BLACK = '#141413';

const LINE = {
  stroke: INK.green,
  strokeWidth: 3,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
};

/** Line path. */
export function L(d: string, p?: SVGProps<SVGPathElement>) {
  return <path d={d} {...LINE} {...p} />;
}
/** Thin line path. */
export function T(d: string, p?: SVGProps<SVGPathElement>) {
  return <path d={d} {...LINE} strokeWidth={2} {...p} />;
}
/** Filled path (green by default). */
export function F(d: string, fill: string = INK.green, p?: SVGProps<SVGPathElement>) {
  return <path d={d} fill={fill} {...p} />;
}
/** Filled path with a green outline. */
export function FL(d: string, fill: string, p?: SVGProps<SVGPathElement>) {
  return <path d={d} {...LINE} fill={fill} {...p} />;
}
export function Dot(cx: number, cy: number, r = 2.5, fill: string = INK.green) {
  return <circle cx={cx} cy={cy} r={r} fill={fill} />;
}
export function Ring(cx: number, cy: number, r: number, p?: SVGProps<SVGCircleElement>) {
  return <circle cx={cx} cy={cy} r={r} {...LINE} {...p} />;
}
export function Disc(cx: number, cy: number, r: number, fill: string = INK.green, p?: SVGProps<SVGCircleElement>) {
  return <circle cx={cx} cy={cy} r={r} fill={fill} {...p} />;
}
export function Box(x: number, y: number, w: number, h: number, fill = 'none', rx = 1.5) {
  return <rect x={x} y={y} width={w} height={h} rx={rx} {...LINE} fill={fill} />;
}

/** The ochre underlay: a soft blob behind the subject, offset (misregistration). */
export function Blob({ shape = 'circle' }: { shape?: 'circle' | 'wide' | 'tall' | 'ground' | 'none' }) {
  const g = { fill: INK.ochre, opacity: 0.38, transform: 'translate(-2.2,2)' };
  if (shape === 'none') return null;
  if (shape === 'wide') return <ellipse cx="32" cy="36" rx="27" ry="18" {...g} />;
  if (shape === 'tall') return <ellipse cx="32" cy="33" rx="17" ry="26" {...g} />;
  if (shape === 'ground') return <ellipse cx="32" cy="54" rx="26" ry="7" {...g} />;
  return <circle cx="32" cy="33" r="23" {...g} />;
}

/** Standard glyph frame: blob + art. */
export function G({ children, blob = 'circle' }: { children: ReactNode; blob?: 'circle' | 'wide' | 'tall' | 'ground' | 'none' }) {
  return (
    <>
      <g style={{ mixBlendMode: 'multiply' }}>
        <Blob shape={blob} />
      </g>
      {children}
    </>
  );
}

// ─── Person ─────────────────────────────────────────────────────────────────

export interface PersonOpts {
  x?: number;
  /** Feet baseline. */
  y?: number;
  s?: number;
  fill?: string;
  /** Hair / silhouette variant. */
  kind?: 'man' | 'woman' | 'child' | 'girl' | 'elder-man' | 'elder-woman' | 'plain';
  crown?: boolean;
  cane?: boolean;
}

/**
 * A front-facing figure: round head and a trapezoid coat or dress. Origin at
 * the feet, 40 units tall at s=1.
 */
export function Person({ x = 32, y = 58, s = 1, fill = INK.green, kind = 'plain', crown, cane }: PersonOpts) {
  const dress = kind === 'woman' || kind === 'girl' || kind === 'elder-woman';
  const body = dress ? 'M-11 0 L-6 -21 Q0 -24 6 -21 L11 0 Z' : 'M-8 0 L-7 -21 Q0 -24 7 -21 L8 0 Z';
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d={body} fill={fill} />
      <circle cx="0" cy="-30" r="6.5" fill={fill} />
      {(kind === 'woman' || kind === 'elder-woman') && (
        <path d="M-6.5 -30 Q-8 -20 -10 -18 M6.5 -30 Q8 -20 10 -18" stroke={fill} strokeWidth="3" strokeLinecap="round" fill="none" />
      )}
      {kind === 'elder-woman' && <circle cx="0" cy="-38" r="3" fill={fill} />}
      {kind === 'girl' && (
        <>
          <circle cx="-8" cy="-32" r="2.6" fill={fill} />
          <circle cx="8" cy="-32" r="2.6" fill={fill} />
        </>
      )}
      {kind === 'man' && <path d="M-6 -34 Q0 -40 6 -34" stroke={fill} strokeWidth="2.5" fill="none" strokeLinecap="round" />}
      {crown && <path d="M-6 -36 L-6 -42 L-3 -38.5 L0 -43 L3 -38.5 L6 -42 L6 -36 Z" fill={INK.gold} stroke={INK.green} strokeWidth="1.2" strokeLinejoin="round" />}
      {(cane || kind === 'elder-man' || kind === 'elder-woman') && (
        <path d="M11 0 V-16 Q11 -19 14 -19" stroke={INK.green} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      )}
    </g>
  );
}

// ─── Templates ──────────────────────────────────────────────────────────────

/** Paint swatch for colour words: a blob of the actual colour. */
export function Swatch({ fill, outline = false }: { fill: string; outline?: boolean }) {
  return (
    <G blob="none">
      <path
        d="M14 30 Q12 14 30 12 Q50 10 52 26 Q55 42 42 50 Q28 58 18 48 Q10 40 14 30 Z"
        fill={fill}
        stroke={outline ? INK.green : 'none'}
        strokeWidth={outline ? 2.5 : 0}
      />
      <path d="M46 46 Q52 52 50 57" stroke={fill === INK.paper ? INK.green : fill} strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="52" cy="58" r="2.5" fill={fill === INK.paper ? INK.green : fill} />
    </G>
  );
}

/** A numeral, set big in the reading serif. */
export function Numeral({ text }: { text: string }) {
  const size = text.length <= 2 ? 30 : text.length === 3 ? 24 : text.length <= 5 ? 17 : 10.5;
  return (
    <G>
      <text
        x="32"
        y="34"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-eb-garamond), Georgia, serif"
        fontWeight="700"
        fontSize={size}
        fill={INK.green}
      >
        {text}
      </text>
    </G>
  );
}

/** Calendar page with a number (months), or a mini grid. */
export function CalendarPage({ n, grid = false }: { n?: number; grid?: boolean }) {
  return (
    <G>
      <rect x="12" y="14" width="40" height="40" rx="3" fill={INK.paper} stroke={INK.green} strokeWidth="3" />
      <path d="M12 17 Q12 14 15 14 H49 Q52 14 52 17 V24 H12 Z" fill={INK.coral} />
      <path d="M22 10 V18 M42 10 V18" stroke={INK.green} strokeWidth="3" strokeLinecap="round" />
      {n !== undefined && (
        <text x="32" y="40" textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-eb-garamond), Georgia, serif" fontWeight="700" fontSize="19" fill={INK.green}>
          {n}
        </text>
      )}
      {grid &&
        [0, 1, 2, 3].map((r) =>
          [0, 1, 2, 3, 4].map((c) => <rect key={`${r}-${c}`} x={16 + c * 7} y={28 + r * 6} width="4" height="3.5" fill={INK.green} opacity="0.75" />)
        )}
    </G>
  );
}

/** A week as seven days, weekend shaded; the target day in coral (0 = Monday). */
export function WeekStrip({ day }: { day: number | null }) {
  return (
    <G blob="wide">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect
          key={i}
          x={5 + i * 8}
          y="22"
          width="6.5"
          height="20"
          rx="1.5"
          fill={i === day ? INK.coral : i >= 5 ? INK.gold : INK.paper}
          stroke={INK.green}
          strokeWidth="1.8"
        />
      ))}
    </G>
  );
}

/** Clock face with hands at the given angles (degrees, 0 = 12 o'clock). */
export function ClockFace({ hour = 300, minute = 0, arc }: { hour?: number; minute?: number; arc?: [number, number] }) {
  const hand = (deg: number, len: number) => {
    const r = (deg * Math.PI) / 180;
    return `M32 34 L${(32 + Math.sin(r) * len).toFixed(1)} ${(34 - Math.cos(r) * len).toFixed(1)}`;
  };
  const arcPath = arc
    ? (() => {
        const [a, b] = arc.map((d) => (d * Math.PI) / 180);
        const R = 15;
        const p = (t: number) => `${(32 + Math.sin(t) * R).toFixed(1)} ${(34 - Math.cos(t) * R).toFixed(1)}`;
        return `M32 34 L${p(a)} A${R} ${R} 0 ${b - a > Math.PI ? 1 : 0} 1 ${p(b)} Z`;
      })()
    : null;
  return (
    <G>
      <circle cx="32" cy="34" r="20" fill={INK.paper} stroke={INK.green} strokeWidth="3" />
      {arcPath && <path d={arcPath} fill={INK.coral} opacity="0.85" />}
      {[0, 90, 180, 270].map((d) => {
        const r = (d * Math.PI) / 180;
        return <circle key={d} cx={32 + Math.sin(r) * 16} cy={34 - Math.cos(r) * 16} r="1.6" fill={INK.green} />;
      })}
      <path d={hand(hour, 9)} stroke={INK.green} strokeWidth="3.2" strokeLinecap="round" />
      <path d={hand(minute, 14)} stroke={INK.green} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="32" cy="34" r="2.2" fill={INK.green} />
    </G>
  );
}

/** Arrow from the centre; deg 0 = up. */
export function Arrow({ deg, coral = true }: { deg: number; coral?: boolean }) {
  const c = coral ? INK.coral : INK.green;
  return (
    <G>
      <g transform={`rotate(${deg} 32 32)`}>
        <path d="M32 52 V16" stroke={c} strokeWidth="5" strokeLinecap="round" />
        <path d="M20 27 L32 14 L44 27" stroke={c} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </G>
  );
}

/** Compass rose with one point (N/E/S/W) in coral, or all green. */
export function Compass({ point }: { point: 'n' | 'e' | 's' | 'w' | null }) {
  const pts = { n: 0, e: 90, s: 180, w: 270 } as const;
  return (
    <G>
      <circle cx="32" cy="32" r="21" fill={INK.paper} stroke={INK.green} strokeWidth="2.5" />
      {(Object.keys(pts) as Array<keyof typeof pts>).map((k) => (
        <path
          key={k}
          d="M32 32 L28 26 L32 12 L36 26 Z"
          transform={`rotate(${pts[k]} 32 32)`}
          fill={point === k ? INK.coral : INK.green}
          opacity={point && point !== k ? 0.45 : 1}
        />
      ))}
      <circle cx="32" cy="32" r="2.5" fill={INK.paper} stroke={INK.green} strokeWidth="1.5" />
    </G>
  );
}

/** A box with the named part in coral, for top/bottom/side/front/inside/outside. */
export function BoxPart({ part }: { part: 'top' | 'bottom' | 'side' | 'front' | 'inside' | 'outside' }) {
  return (
    <G>
      {/* simple cube */}
      <path d="M14 24 L32 16 L50 24 L32 32 Z" fill={part === 'top' ? INK.coral : INK.paper} stroke={INK.green} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M14 24 V44 L32 52 V32 Z" fill={part === 'front' ? INK.coral : INK.paper} stroke={INK.green} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M50 24 V44 L32 52 V32 Z" fill={part === 'side' ? INK.coral : INK.paper} stroke={INK.green} strokeWidth="2.5" strokeLinejoin="round" />
      {part === 'bottom' && <path d="M14 44 L32 52 L50 44" stroke={INK.coral} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />}
      {part === 'inside' && <circle cx="32" cy="27" r="4" fill={INK.coral} />}
      {part === 'outside' && <circle cx="55" cy="14" r="5" fill={INK.coral} />}
    </G>
  );
}
