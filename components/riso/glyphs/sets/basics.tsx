import type { ReactNode } from 'react';
import {
  G, L, T, F, FL, Ring, Box, INKS as I,
  BLACK, Swatch, Numeral, CalendarPage, WeekStrip, ClockFace, Arrow, Compass, BoxPart,
} from '../kit';

/* Template-driven glyphs: colours, numbers, calendar, time, directions,
   seasons, measurements. */

// ─── Colours: real swatches (the one place the palette leaves the three inks) ──
const COLORS: Record<string, ReactNode> = {
  red: <Swatch fill="#C8433A" />,
  green: <Swatch fill="#3F7D4E" />,
  blue: <Swatch fill="#3C6E9E" />,
  yellow: <Swatch fill="#E3B341" />,
  brown: <Swatch fill="#8A5A3B" />,
  pink: <Swatch fill="#E59AA8" />,
  orange: <Swatch fill="#E38B3A" />,
  black: <Swatch fill={BLACK} />,
  white: <Swatch fill={I.paper} outline />,
  gray: <Swatch fill="#9A9893" />,
  color: (
    <G blob="none">
      <circle cx="24" cy="26" r="13" fill="#C8433A" opacity="0.9" />
      <circle cx="40" cy="26" r="13" fill="#E3B341" opacity="0.9" style={{ mixBlendMode: 'multiply' }} />
      <circle cx="32" cy="40" r="13" fill="#3C6E9E" opacity="0.9" style={{ mixBlendMode: 'multiply' }} />
    </G>
  ),
};

// ─── Numbers ────────────────────────────────────────────────────────────────
const NUMBER_TEXT: Record<string, string> = {
  one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
  eleven: '11', twelve: '12', thirteen: '13', fourteen: '14', fifteen: '15', sixteen: '16', seventeen: '17',
  eighteen: '18', nineteen: '19', twenty: '20', 'twenty-one': '21', 'twenty-two': '22', thirty: '30',
  forty: '40', fifty: '50', sixty: '60', seventy: '70', eighty: '80', ninety: '90', 'one-hundred': '100',
  'one-thousand': '1000', million: '1 000 000', first: '1º', 'second-2nd': '2º', third: '3º', fourth: '4º',
  fifth: '5º', number: '#',
};
const NUMBERS = Object.fromEntries(Object.entries(NUMBER_TEXT).map(([k, t]) => [k, <Numeral key={k} text={t} />]));

// ─── Calendar ───────────────────────────────────────────────────────────────
const MONTH_IDS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MONTHS = Object.fromEntries(MONTH_IDS.map((m, i) => [m, <CalendarPage key={m} n={i + 1} />]));
const DAY_IDS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const WEEKDAYS = Object.fromEntries(DAY_IDS.map((d, i) => [d, <WeekStrip key={d} day={i} />]));

function Sun({ cx = 32, cy = 30, r = 9, rays = true }: { cx?: number; cy?: number; r?: number; rays?: boolean }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={I.coral} />
      {rays &&
        [0, 45, 90, 135, 180, 225, 270, 315].map((d) => {
          const a = (d * Math.PI) / 180;
          return (
            <path
              key={d}
              d={`M${cx + Math.sin(a) * (r + 4)} ${cy - Math.cos(a) * (r + 4)} L${cx + Math.sin(a) * (r + 9)} ${cy - Math.cos(a) * (r + 9)}`}
              stroke={I.green}
              strokeWidth="3"
              strokeLinecap="round"
            />
          );
        })}
    </>
  );
}

const TIME: Record<string, ReactNode> = {
  week: <WeekStrip day={null} />,
  month: <CalendarPage grid />,
  year: (
    <G>
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <rect key={`${r}${c}`} x={12 + c * 10.5} y={16 + r * 11} width="8" height="8.5" rx="1.2" fill={r === 0 && c === 0 ? I.coral : I.paper} stroke={I.green} strokeWidth="1.8" />
        ))
      )}
    </G>
  ),
  day: (
    <G>
      <Sun cy={28} />
      {L('M8 50 H56')}
    </G>
  ),
  'morning-tomorrow': (
    <G>
      <path d="M20 44 A12 12 0 0 1 44 44 Z" fill={I.coral} />
      {T('M32 24 V18 M18 30 L14 26 M46 30 L50 26')}
      {L('M8 44 H56')}
      {T('M18 52 H46', { opacity: 0.6 })}
    </G>
  ),
  'afternoon-evening': (
    <G>
      <rect x="8" y="14" width="48" height="30" fill={I.gold} opacity="0.55" />
      <path d="M22 44 A10 10 0 0 1 42 44 Z" fill={I.coral} />
      {L('M8 44 H56')}
      {T('M14 50 H50', { opacity: 0.6 })}
    </G>
  ),
  hour: <ClockFace hour={60} minute={0} arc={[0, 359.9]} />,
  minute: <ClockFace hour={300} minute={36} arc={[0, 36]} />,
  second: (
    <G>
      <rect x="28" y="6" width="8" height="5" rx="1.5" fill={I.green} />
      <ClockFace hour={0} minute={6} arc={[0, 6]} />
    </G>
  ),
  time: (
    <G blob="tall">
      {L('M20 10 H44 M20 56 H44')}
      {L('M22 10 Q22 26 32 33 Q42 26 42 10 M22 56 Q22 40 32 33 Q42 40 42 56')}
      {F('M26 52 Q32 42 38 52 Z', I.coral)}
      {F('M27 17 H37 Q35 24 32 26 Q29 24 27 17 Z', I.coral)}
    </G>
  ),
};

// ─── Directions ─────────────────────────────────────────────────────────────
const DIRECTIONS: Record<string, ReactNode> = {
  'top-up': <Arrow deg={0} />,
  down: <Arrow deg={180} />,
  left: <Arrow deg={270} />,
  right: <Arrow deg={90} />,
  straight: (
    <G blob="tall">
      {T('M16 58 L24 8 M48 58 L40 8', { opacity: 0.7 })}
      <path d="M32 52 V18" stroke={I.coral} strokeWidth="5" strokeLinecap="round" />
      <path d="M24 26 L32 16 L40 26" stroke={I.coral} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </G>
  ),
  'back-direction': (
    <G>
      <path d="M22 50 V26 Q22 14 34 14 Q46 14 46 26 V36" stroke={I.coral} strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M38 30 L46 40 L54 30" stroke={I.coral} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </G>
  ),
  north: <Compass point="n" />,
  east: <Compass point="e" />,
  south: <Compass point="s" />,
  west: <Compass point="w" />,
  direction: <Compass point={null} />,
  inside: <BoxPart part="inside" />,
  outside: <BoxPart part="outside" />,
  side: <BoxPart part="side" />,
  front: <BoxPart part="front" />,
  bottom: <BoxPart part="bottom" />,
};

// ─── Seasons ────────────────────────────────────────────────────────────────
const SEASONS: Record<string, ReactNode> = {
  summer: (
    <G>
      <Sun r={11} />
    </G>
  ),
  winter: (
    <G>
      {[0, 60, 120].map((d) => (
        <g key={d} transform={`rotate(${d} 32 32)`}>
          {L('M32 12 V52')}
          {T('M27 17 L32 22 L37 17 M27 47 L32 42 L37 47')}
        </g>
      ))}
      <circle cx="32" cy="32" r="3.5" fill={I.coral} />
    </G>
  ),
  spring: (
    <G blob="ground">
      {L('M32 56 V30')}
      {FL('M32 38 Q20 36 18 24 Q30 24 32 38 Z', I.green)}
      {FL('M32 32 Q42 30 46 18 Q34 18 32 32 Z', I.green)}
      <circle cx="32" cy="22" r="5" fill={I.coral} />
      {L('M18 56 H46')}
    </G>
  ),
  fall: (
    <G>
      {FL('M22 44 Q14 24 34 14 Q50 10 50 24 Q48 44 22 44 Z', I.coral)}
      {T('M22 44 L42 22 M30 34 L30 26 M36 28 L42 30')}
      {T('M14 54 Q20 50 26 54', { opacity: 0.6 })}
    </G>
  ),
};

// ─── Measurements ───────────────────────────────────────────────────────────
function Ruler({ highlight }: { highlight: [number, number] }) {
  return (
    <G blob="wide">
      <rect x="6" y="24" width="52" height="16" rx="2" fill={I.paper} stroke={I.green} strokeWidth="2.5" />
      <rect x={highlight[0]} y="24" width={highlight[1] - highlight[0]} height="16" fill={I.coral} opacity="0.8" />
      {Array.from({ length: 11 }, (_, i) => (
        <path key={i} d={`M${10 + i * 4.4} 24 V${i % 5 === 0 ? 33 : 29}`} stroke={I.green} strokeWidth="1.6" />
      ))}
    </G>
  );
}

function WeightBlock({ label }: { label: string }) {
  return (
    <G>
      <path d="M18 52 L22 26 H42 L46 52 Z" fill={I.green} />
      <path d="M26 26 Q26 16 32 16 Q38 16 38 26" stroke={I.green} strokeWidth="3.5" fill="none" />
      <text x="32" y="42" textAnchor="middle" fontFamily="var(--font-inter), sans-serif" fontWeight="700" fontSize="11" fill={I.paper}>
        {label}
      </text>
    </G>
  );
}

const MEASURE: Record<string, ReactNode> = {
  meter: <Ruler highlight={[6, 58]} />,
  centimeter: <Ruler highlight={[10, 14.4]} />,
  inch: <Ruler highlight={[10, 21]} />,
  kilogram: <WeightBlock label="kg" />,
  pound: <WeightBlock label="lb" />,
  half: (
    <G>
      {Ring(32, 32, 18)}
      <path d="M32 14 A18 18 0 0 1 32 50 Z" fill={I.coral} />
    </G>
  ),
  circle: <G>{Ring(32, 32, 18, { stroke: I.coral, strokeWidth: 5 })}</G>,
  square: (
    <G>
      <rect x="15" y="15" width="34" height="34" fill="none" stroke={I.coral} strokeWidth="5" />
    </G>
  ),
  temperature: (
    <G blob="tall">
      <path d="M27 40 V14 Q27 9 32 9 Q37 9 37 14 V40" fill={I.paper} stroke={I.green} strokeWidth="3" />
      <circle cx="32" cy="46" r="8" fill={I.coral} stroke={I.green} strokeWidth="3" />
      <rect x="30" y="22" width="4" height="22" fill={I.coral} />
      {T('M40 18 H44 M40 26 H44 M40 34 H44')}
    </G>
  ),
  date: (
    <G>
      <rect x="12" y="14" width="40" height="40" rx="3" fill={I.paper} stroke={I.green} strokeWidth="3" />
      {L('M12 24 H52')}
      {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={16 + c * 9} y={29 + r * 7.5} width="4.5" height="4" fill={I.green} opacity="0.6" />))}
      <circle cx="36.3" cy="38.5" r="5.5" fill="none" stroke={I.coral} strokeWidth="2.5" />
    </G>
  ),
  weight: (
    <G>
      {L('M32 14 V50 M14 22 H50 M20 50 H44')}
      {L('M14 22 L8 36 H20 Z M50 22 L44 36 H56 Z')}
      {F('M8 36 H20 Q14 42 8 36 Z', I.coral)}
      <circle cx="32" cy="13" r="3" fill={I.green} />
    </G>
  ),
  edge: (
    <G>
      <path d="M14 24 L32 16 L50 24 L32 32 Z M14 24 V44 L32 52 V32 Z M50 24 V44 L32 52" fill={I.paper} stroke={I.green} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M32 32 V52" stroke={I.coral} strokeWidth="5" strokeLinecap="round" />
    </G>
  ),
  corner: (
    <G>
      {Box(14, 14, 36, 36, I.paper, 0)}
      <path d="M38 50 H50 V38" stroke={I.coral} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </G>
  ),
};

// Shared with other sets
export { Sun };

export const BASIC_GLYPHS: Record<string, ReactNode> = {
  ...COLORS,
  ...NUMBERS,
  ...MONTHS,
  ...WEEKDAYS,
  ...TIME,
  ...DIRECTIONS,
  ...SEASONS,
  ...MEASURE,
};

// Silence unused-import lint for helpers kept for parity across sets.
