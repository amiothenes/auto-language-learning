import type { ReactNode } from 'react';
import { G, L, T, F, FL, Ring, Box, Person, INKS as I } from '../kit';

/* Society, art and misc nouns; drawable verbs; adjectives as contrasts
   (the coral half of a pair is the word). Words a picture would get wrong
   or treat insensitively (god, religion, hell, murder, kill, shoot, sex,
   race/ethnicity) deliberately have no glyph and keep the typographic card. */

const C = I.coral;
const GR = I.green;
const P = I.paper;
const BLACKISH = '#141413';

// ─── Society, art, misc ─────────────────────────────────────────────────────
const SOCIETY: Record<string, ReactNode> = {
  team: (
    <G blob="wide">
      {[14, 32, 50].map((x) => <Person key={x} x={x} s={0.95} fill={C} />)}
      {[14, 32, 50].map((x) => <rect key={x} x={x - 3} y="44" width="6" height="4" fill={P} />)}
    </G>
  ),
  war: <G>{L('M14 50 L46 14 M18 14 L50 50', { strokeWidth: 4 })}{L('M40 22 L48 30 M16 30 L24 22', { stroke: C, strokeWidth: 4 })}</G>,
  peace: <G>{F('M12 36 Q14 20 30 22 Q38 12 50 16 Q44 20 46 26 L56 30 L46 32 Q42 46 26 44 Q16 44 12 36 Z', P, { stroke: GR, strokeWidth: 2.5 })}{L('M50 30 Q56 38 50 44', { stroke: C })}{F('M50 44 Q54 40 58 44 Q54 48 50 44 Z', C)}</G>,
  money: (
    <G blob="wide">
      {FL('M6 20 H46 V44 H6 Z', '#9FCB9F')}
      <circle cx="26" cy="32" r="6" fill="none" stroke={GR} strokeWidth="2" />
      <circle cx="46" cy="44" r="10" fill={I.gold} stroke={GR} strokeWidth="2.5" />
      <circle cx="46" cy="44" r="5" fill="none" stroke={GR} strokeWidth="1.5" />
    </G>
  ),
  dollar: (
    <G>
      <circle cx="32" cy="32" r="20" fill={I.gold} stroke={GR} strokeWidth="3" />
      <text x="32" y="33" textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-eb-garamond), Georgia, serif" fontWeight="700" fontSize="26" fill={GR}>$</text>
    </G>
  ),
  bill: (
    <G blob="tall">
      {FL('M18 8 H46 V56 L42 52 L38 56 L34 52 L30 56 L26 52 L22 56 L18 52 Z', P)}
      {T('M24 18 H40 M24 26 H40 M24 34 H34')}
      {T('M24 44 H40', { stroke: C, strokeWidth: 3 })}
    </G>
  ),
  price: (
    <G>
      {FL('M10 30 L28 12 H52 V36 L34 54 Z', C)}
      <circle cx="44" cy="20" r="3.5" fill={P} />
      {T('M22 34 L32 24 M26 40 L38 28', { stroke: P })}
    </G>
  ),
  game: (
    <G>
      {FL('M10 24 L28 16 L42 24 V44 L24 52 L10 44 Z', P)}
      <circle cx="18" cy="34" r="2.2" fill={GR} />
      <circle cx="24" cy="40" r="2.2" fill={GR} />
      {FL('M32 30 L48 24 L56 30 V46 L40 52 L32 46 Z', C)}
      <circle cx="44" cy="38" r="2.2" fill={P} />
    </G>
  ),
  ball: <G><circle cx="32" cy="32" r="20" fill={P} stroke={GR} strokeWidth="3" />{F('M32 22 L41 28 L38 39 H26 L23 28 Z', GR)}{T('M32 22 V12 M41 28 L50 24 M38 39 L44 48 M26 39 L20 48 M23 28 L14 24')}<circle cx="32" cy="32" r="20" fill="none" stroke={C} strokeWidth="0" /></G>,
  sport: <G>{Ring(24, 26, 13)}{T('M15 17 L33 35 M15 35 L33 17', { strokeWidth: 1.5 })}{L('M33 35 L46 50', { strokeWidth: 4.5 })}<circle cx="46" cy="22" r="6" fill={C} /></G>,
  'race-sport': (
    <G blob="wide">
      {L('M8 50 Q32 34 56 50 M8 40 Q32 24 56 40', { strokeWidth: 2.5 })}
      {L('M46 14 V40')}
      {[0, 1, 2].map((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={46 + c * 5} y={14 + r * 5} width="5" height="5" fill={(r + c) % 2 ? P : GR} />))}
      <Person x={22} y={44} s={0.6} fill={C} />
    </G>
  ),
  exercise: <G>{L('M14 32 H50', { strokeWidth: 4 })}{F('M8 22 H16 V42 H8 Z M48 22 H56 V42 H48 Z', C)}{F('M4 26 H8 V38 H4 Z M56 26 H60 V38 H56 Z', GR)}</G>,
  energy: <G>{F('M36 6 L14 36 H30 L26 58 L50 26 H34 Z', C)}</G>,
  technology: (
    <G>
      {FL('M20 20 H44 V44 H20 Z', GR)}
      <rect x="26" y="26" width="12" height="12" fill={C} />
      {T('M24 20 V12 M32 20 V12 M40 20 V12 M24 44 V52 M32 44 V52 M40 44 V52 M20 24 H12 M20 32 H12 M20 40 H12 M44 24 H52 M44 32 H52 M44 40 H52')}
    </G>
  ),
  science: (
    <G blob="tall">
      {L('M26 8 H38 M28 8 V24 L14 50 Q12 56 18 56 H46 Q52 56 50 50 L36 24 V8')}
      {F('M20 42 H44 L48 50 Q50 54 46 54 H18 Q14 54 16 50 Z', C)}
      <circle cx="28" cy="34" r="2" fill={GR} />
      <circle cx="34" cy="30" r="1.5" fill={GR} />
    </G>
  ),
  attack: <G>{L('M10 54 L42 22', { strokeWidth: 4 })}{F('M40 16 L56 8 L48 24 Z', GR)}{F('M46 30 l3 -8 3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 z', C)}</G>,
  magazine: (
    <G blob="tall">
      {FL('M14 8 H50 V56 H14 Z', C)}
      <circle cx="32" cy="30" r="9" fill={P} />
      {T('M20 14 H36', { stroke: P, strokeWidth: 3 })}
      {T('M20 46 H44 M20 51 H36', { stroke: P })}
    </G>
  ),
  newspaper: (
    <G blob="wide">
      {FL('M8 12 H50 V54 H14 Q8 54 8 48 Z', P)}
      {L('M50 22 H56 V48 Q56 54 50 54')}
      {T('M14 18 H44', { strokeWidth: 3.5 })}
      {F('M14 26 H28 V38 H14 Z', C)}
      {T('M32 27 H44 M32 32 H44 M32 37 H44 M14 44 H44 M14 49 H38')}
    </G>
  ),
  election: (
    <G>
      {FL('M10 30 H54 V56 H10 Z', P)}
      <rect x="22" y="30" width="20" height="4" fill={GR} />
      {FL('M24 10 H40 V32 H24 Z', P)}
      {L('M28 20 L31 24 L37 16', { stroke: C })}
    </G>
  ),
  contract: (
    <G blob="tall">
      {FL('M14 6 H46 V58 H14 Z', P)}
      {T('M20 14 H40 M20 20 H40 M20 26 H40 M20 32 H34')}
      {L('M20 46 Q24 40 28 46 T36 46 Q40 42 42 46', { stroke: C, strokeWidth: 2.5 })}
    </G>
  ),
  marriage: (
    <G>
      <circle cx="25" cy="36" r="13" fill="none" stroke={I.gold} strokeWidth="4.5" />
      <circle cx="39" cy="36" r="13" fill="none" stroke={C} strokeWidth="4.5" />
    </G>
  ),
  wedding: (
    <G blob="wide">
      <Person kind="woman" x={22} s={1.05} fill={P} />
      <path d="M11 58 L16 37 Q22 34 28 37 L33 58 Z" fill={P} stroke={GR} strokeWidth="2" />
      <circle cx="22" cy="27.5" r="7" fill={P} stroke={GR} strokeWidth="2" />
      <Person kind="man" x={44} s={1.05} />
      {F('M30 14 Q32 10 34 14 Q36 10 38 14 Q38 18 34 22 Q30 18 30 14 Z', C)}
    </G>
  ),
  relationship: (
    <G blob="wide">
      <Person x={20} s={1} />
      <Person x={44} s={1} />
      {F('M32 24 Q32 20 35 20 Q38 20 38 23 Q38 27 32 31 Q26 27 26 23 Q26 20 29 20 Q32 20 32 24 Z', C)}
    </G>
  ),
  medicine: (
    <G blob="wide">
      {FL('M8 22 H56 V52 H8 Z', P)}
      {L('M24 22 V16 H40 V22')}
      <rect x="28" y="28" width="8" height="18" fill={C} />
      <rect x="23" y="33" width="18" height="8" fill={C} />
    </G>
  ),
  drug: (
    <G>
      <rect x="10" y="24" width="30" height="14" rx="7" fill={C} transform="rotate(-30 25 31)" />
      <rect x="10" y="24" width="15" height="14" rx="7" fill={P} stroke={GR} strokeWidth="2" transform="rotate(-30 25 31)" />
      <circle cx="44" cy="44" r="8" fill={I.gold} stroke={GR} strokeWidth="2" />
      {T('M38 44 H50')}
    </G>
  ),
  poison: (
    <G blob="tall">
      {FL('M26 6 H38 V16 Q48 22 48 34 V56 H16 V34 Q16 22 26 16 Z', '#7B5EA7')}
      <circle cx="32" cy="38" r="7" fill={P} />
      <circle cx="29" cy="37" r="1.6" fill={GR} />
      <circle cx="35" cy="37" r="1.6" fill={GR} />
      {T('M24 50 L40 46 M24 46 L40 50', { stroke: P, strokeWidth: 2.5 })}
    </G>
  ),
  prison: (
    <G>
      {Box(10, 10, 44, 44, P, 0)}
      {L('M20 10 V54 M32 10 V54 M44 10 V54')}
      <Person x={26} y={50} s={0.7} fill={C} />
      {L('M20 10 V54 M32 10 V54 M44 10 V54')}
    </G>
  ),
  gun: <G blob="wide">{F('M8 22 H52 V32 H30 L26 50 H16 L20 32 H8 Z', GR)}{L('M30 32 Q30 40 24 40', { stroke: C })}</G>,
  death: <G blob="ground">{FL('M18 54 V24 Q18 10 32 10 Q46 10 46 24 V54 Z', '#9A9893')}{L('M32 20 V40 M24 28 H40', { stroke: P })}{F('M10 54 H54 V58 H10 Z', GR)}{F('M48 50 Q50 44 54 46 Q54 52 48 50 Z', C)}</G>,
  sign: <G>{L('M32 30 V58')}{F('M32 6 L54 28 L32 50 L10 28 Z', C)}{F('M32 14 L46 28 L32 42 L18 28 Z', I.gold)}</G>,
};

const ART: Record<string, ReactNode> = {
  music: <G>{L('M24 46 V14 L48 8 V40')}{F('M14 46 Q14 40 20 40 Q26 40 26 46 Q26 52 20 52 Q14 52 14 46 Z M38 40 Q38 34 44 34 Q50 34 50 40 Q50 46 44 46 Q38 46 38 40 Z', C)}{L('M24 20 L48 14')}</G>,
  song: <G><Person x={22} s={1.1} />{L('M44 36 V16 L54 14')}{F('M38 36 Q38 32 42 32 Q46 32 46 36 Q46 40 42 40 Q38 40 38 36 Z', C)}{T('M32 26 Q36 28 34 32', { stroke: C })}</G>,
  band: (
    <G blob="wide">
      {[12, 32, 52].map((x, i) => <Person key={x} x={x} s={0.8} fill={i === 1 ? C : GR} />)}
      {L('M20 40 L26 32 M44 32 L40 42')}
    </G>
  ),
  instrument: (
    <G>
      {FL('M16 44 Q10 36 18 30 Q14 22 24 20 Q32 22 30 30 Q38 36 32 44 Q24 54 16 44 Z', '#B9875A')}
      <circle cx="23" cy="36" r="4" fill={GR} />
      {L('M28 26 L52 6', { strokeWidth: 4 })}
      {F('M50 4 L58 6 L56 12 L52 10 Z', C)}
    </G>
  ),
  movie: (
    <G blob="wide">
      {FL('M8 26 H56 V54 H8 Z', GR)}
      {F('M8 16 L54 8 L56 18 L10 26 Z', P, { stroke: GR, strokeWidth: 2.5 })}
      {T('M18 15 L22 23 M30 13 L34 21 M42 11 L46 19')}
      <path d="M26 34 L40 40 L26 46 Z" fill={C} />
    </G>
  ),
  art: (
    <G>
      {Box(10, 10, 44, 44, '#B9875A', 0)}
      {F('M16 16 H48 V48 H16 Z', P)}
      {F('M16 44 L28 30 L36 38 L42 32 L48 40 V48 H16 Z', GR)}
      <circle cx="40" cy="22" r="4" fill={C} />
    </G>
  ),
};

const MISC: Record<string, ReactNode> = {
  yes: <G><circle cx="32" cy="32" r="20" fill={GR} />{L('M22 32 L29 40 L43 24', { stroke: P, strokeWidth: 5 })}</G>,
  no: <G><circle cx="32" cy="32" r="20" fill={C} />{L('M24 24 L40 40 M40 24 L24 40', { stroke: P, strokeWidth: 5 })}</G>,
  dot: <G><circle cx="32" cy="32" r="8" fill={C} /></G>,
  hole: <G blob="wide"><ellipse cx="32" cy="36" rx="22" ry="11" fill={GR} /><ellipse cx="32" cy="36" rx="16" ry="7" fill={BLACKISH} /></G>,
  image: (
    <G>
      {Box(10, 14, 44, 36, P, 2)}
      {F('M14 46 L26 30 L34 40 L40 34 L50 46 Z', GR)}
      <circle cx="42" cy="24" r="4" fill={C} />
    </G>
  ),
  sound: <G>{F('M10 26 H20 L32 14 V50 L20 38 H10 Z', GR)}{L('M40 24 Q46 32 40 40 M46 18 Q56 32 46 46', { stroke: C })}</G>,
  map: (
    <G blob="wide">
      {FL('M6 16 L22 10 L42 16 L58 10 V48 L42 54 L22 48 L6 54 Z', P)}
      {T('M22 10 V48 M42 16 V54')}
      {L('M12 40 Q20 30 30 34 Q38 38 46 24', { stroke: C, strokeDasharray: '1 5', strokeWidth: 3 })}
      {F('M48 18 Q44 24 48 28 Q52 24 48 18 Z', C)}
    </G>
  ),
  pattern: (
    <G>
      {[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={12 + c * 10} y={12 + r * 10} width="10" height="10" fill={(r + c) % 2 ? P : (r === 1 && c === 2 ? C : GR)} />))}
      {Box(12, 12, 40, 40, 'none', 0)}
    </G>
  ),
  piece: <G>{FL('M12 22 H24 Q22 12 30 12 Q38 12 36 22 H48 V34 Q58 32 58 40 Q58 48 48 46 V56 H12 Z', C)}</G>,
  pain: <G><Figure2 />{F('M44 18 L38 30 H46 L40 42', 'none', { stroke: C, strokeWidth: 3.5, strokeLinecap: 'round', strokeLinejoin: 'round' })}</G>,
  injury: (
    <G>
      <rect x="10" y="24" width="44" height="16" rx="8" fill="#F2C9A8" stroke={GR} strokeWidth="2.5" transform="rotate(-30 32 32)" />
      <rect x="24" y="24" width="16" height="16" fill={P} stroke={GR} strokeWidth="2" transform="rotate(-30 32 32)" />
      <circle cx="32" cy="32" r="2.5" fill={C} />
    </G>
  ),
};

function Figure2() {
  return <Person x={28} s={1.1} />;
}


// ─── Verbs (the ones a picture can say) ─────────────────────────────────────
const Bubble = ({ x = 40, y = 18, think = false, children }: { x?: number; y?: number; think?: boolean; children?: ReactNode }) => (
  <>
    {think ? (
      <>
        <circle cx={x - 8} cy={y + 18} r="2" fill={GR} />
        <circle cx={x - 4} cy={y + 12} r="3" fill={GR} />
        {FL(`M${x - 8} ${y} Q${x - 8} ${y - 10} ${x + 2} ${y - 10} Q${x + 14} ${y - 10} ${x + 14} ${y} Q${x + 14} ${y + 8} ${x + 2} ${y + 8} Q${x - 8} ${y + 8} ${x - 8} ${y} Z`, P)}
      </>
    ) : (
      FL(`M${x - 10} ${y} Q${x - 10} ${y - 10} ${x + 2} ${y - 10} Q${x + 14} ${y - 10} ${x + 14} ${y} Q${x + 14} ${y + 9} ${x + 2} ${y + 9} H${x - 2} L${x - 10} ${y + 15} L${x - 6} ${y + 8} Q${x - 10} ${y + 6} ${x - 10} ${y} Z`, P)
    )}
    {children}
  </>
);

const VERBS: Record<string, ReactNode> = {
  'to-eat': <G blob="wide"><ellipse cx="30" cy="42" rx="22" ry="10" fill={P} stroke={GR} strokeWidth="2.5" /><circle cx="30" cy="40" r="6" fill={C} />{L('M54 16 V54 M50 16 V26 Q50 30 54 30 Q58 30 58 26 V16')}</G>,
  'to-drink': <G blob="tall">{FL('M18 14 H40 L36 54 H22 Z', '#D8E8EE')}{F('M19 24 H39 L36 54 H22 Z', C)}{L('M34 14 L42 2')}</G>,
  'to-sleep': <G blob="wide">{F('M6 46 H58 V52 H6 Z', GR)}<circle cx="14" cy="40" r="6" fill={GR} />{F('M20 40 H56 V46 H20 Z', C)}<text x="40" y="26" fontFamily="var(--font-inter), sans-serif" fontWeight="700" fontSize="14" fill={GR}>z</text><text x="48" y="16" fontFamily="var(--font-inter), sans-serif" fontWeight="700" fontSize="10" fill={GR}>z</text></G>,
  'to-read': <G blob="wide">{FL('M6 26 Q18 20 32 26 Q46 20 58 26 V52 Q46 46 32 52 Q18 46 6 52 Z', P)}{L('M32 26 V52')}{T('M12 32 H26 M12 38 H26 M38 32 H52 M38 38 H52')}{F('M24 8 Q32 2 40 8 Q32 14 24 8 Z', C)}<circle cx="32" cy="8" r="2" fill={P} /></G>,
  'to-write': <G>{FL('M8 14 H40 V54 H8 Z', P)}{L('M14 26 Q18 22 22 26 T30 26', { stroke: C, strokeWidth: 2.5 })}{T('M14 34 H34 M14 40 H30')}{F('M34 46 L54 18 L58 22 L38 50 Z', GR)}{F('M34 46 L38 50 L32 52 Z', C)}</G>,
  'to-swim': <G blob="wide"><circle cx="18" cy="26" r="5" fill={C} />{L('M24 30 L40 26 L52 18', { stroke: C, strokeWidth: 4 })}{L('M4 38 Q12 32 20 38 T36 38 T52 38 T64 38 M4 48 Q12 42 20 48 T36 48 T52 48 T64 48')}</G>,
  'to-fly': <G>{F('M6 30 L28 32 L40 12 L46 12 L40 33 L54 34 Q60 35 60 38 Q60 41 54 41 L40 42 L46 60 L40 60 L28 43 L6 45 L10 38 Z', GR)}{T('M4 20 H18 M2 26 H12', { stroke: C, strokeWidth: 3 })}</G>,
  'to-run': (
    <G>
      <circle cx="38" cy="12" r="6" fill={C} />
      {L('M36 20 L30 36 L18 40 M30 36 L38 46 L34 58 M34 24 L46 30 M34 24 L22 26', { stroke: C, strokeWidth: 4.5 })}
      {T('M6 30 H14 M4 38 H12 M8 46 H16', { opacity: 0.7 })}
    </G>
  ),
  'to-walk': <G>{[[20, 46, -10], [34, 34, 10], [24, 20, -10], [38, 8, 10]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx="5" ry="8" fill={i === 3 ? C : GR} transform={`rotate(${r} ${x} ${y})`} />)}</G>,
  'to-drive': <G><circle cx="32" cy="32" r="20" fill="none" stroke={GR} strokeWidth="5" /><circle cx="32" cy="32" r="5" fill={C} />{L('M14 32 H27 M37 32 H50 M32 37 V52', { strokeWidth: 4 })}</G>,
  'to-cook': <G blob="wide">{FL('M10 26 H54 V44 Q54 50 48 50 H16 Q10 50 10 44 Z', GR)}{L('M4 30 H10 M54 30 H60')}{F('M18 56 Q22 50 26 56 Q30 50 34 56 Q38 50 42 56 Q46 50 48 56 Z', C)}{T('M24 18 Q20 12 24 6 M36 18 Q32 12 36 6')}</G>,
  'to-wash': <G>{FL('M8 36 H56 L50 54 H14 Z', '#9FD3E6')}{[[20, 24, 5], [32, 18, 6], [44, 26, 4], [26, 10, 3]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="none" stroke={i === 1 ? C : GR} strokeWidth="2.5" />)}</G>,
  'to-open': <G>{L('M14 10 V56 M14 10 H38 M38 10 V56 M8 56 H44')}{F('M14 10 L30 16 V60 L14 56 Z', C)}{F('M38 20 L50 24 L38 28 Z', GR)}</G>,
  'to-close': <G>{F('M18 8 H44 V56 H18 Z', GR)}<circle cx="38" cy="34" r="2.5" fill={P} />{L('M10 56 H52')}{F('M52 30 L44 34 L52 38 Z', C)}</G>,
  'to-cut': <G>{Ring(18, 44, 7, { stroke: C })}{Ring(18, 20, 7, { stroke: C })}{L('M24 40 L56 14 M24 24 L56 50')}</G>,
  'to-buy': <G blob="wide">{L('M4 14 H12 L20 42 H50 L56 22 H16')}<circle cx="24" cy="52" r="4" fill={GR} /><circle cx="46" cy="52" r="4" fill={GR} />{F('M24 24 H50 L46 38 H28 Z', C)}</G>,
  'to-pay': <G blob="wide">{FL('M6 20 H44 V44 H6 Z', '#9FCB9F')}<circle cx="44" cy="40" r="12" fill={C} stroke={GR} strokeWidth="2.5" />{L('M44 34 V46', { stroke: P })}</G>,
  'to-sell': <G>{FL('M10 30 L28 12 H52 V36 L34 54 Z', C)}<circle cx="44" cy="20" r="3.5" fill={P} />{F('M2 44 Q12 40 18 46 L26 54 H2 Z', GR)}</G>,
  'to-call': <G blob="tall">{FL('M20 6 H44 Q48 6 48 10 V54 Q48 58 44 58 H20 Q16 58 16 54 V10 Q16 6 20 6 Z', GR)}<rect x="20" y="12" width="24" height="36" fill={P} />{L('M26 30 Q32 22 38 30', { stroke: C })}{T('M52 14 Q58 20 52 26 M56 8 Q66 20 56 32', { stroke: C })}</G>,
  'to-watch-to-look': <G blob="wide">{F('M4 32 Q32 6 60 32 Q32 58 4 32 Z', P, { stroke: GR, strokeWidth: 3 })}<circle cx="32" cy="32" r="11" fill={C} /><circle cx="32" cy="32" r="5" fill={GR} /></G>,
  'to-see': <G blob="wide">{F('M4 32 Q32 6 60 32 Q32 58 4 32 Z', P, { stroke: GR, strokeWidth: 3 })}<circle cx="32" cy="32" r="10" fill={GR} /><circle cx="32" cy="32" r="4" fill={C} /></G>,
  'to-hear': <G>{F('M22 50 Q22 40 28 36 Q34 32 34 24 Q34 14 26 14 Q16 14 16 26', 'none', { stroke: GR, strokeWidth: 5, strokeLinecap: 'round' })}{T('M24 26 Q24 20 28 22', { strokeWidth: 3 })}{L('M42 22 Q48 30 42 38 M48 16 Q58 30 48 44', { stroke: C })}</G>,
  'to-listen': <G>{L('M14 38 V30 Q14 12 32 12 Q50 12 50 30 V38', { strokeWidth: 4 })}{F('M8 34 H18 V52 H8 Z M46 34 H56 V52 H46 Z', C)}{F('M28 30 V44 Q24 42 24 46 Q24 50 28 50 Q32 50 32 46 V34 L38 32', 'none', { stroke: GR, strokeWidth: 2.5 })}</G>,
  'to-sing': <G><Person x={22} s={1.1} />{F('M40 30 Q40 26 44 26 Q48 26 48 30 Q48 34 44 34 Q40 34 40 30 Z', C)}{L('M48 30 V12 L56 10')}</G>,
  'to-dance': <G><Person x={26} s={1.05} fill={C} />{L('M18 36 L8 24 M34 36 L46 30', { stroke: C, strokeWidth: 4 })}{F('M46 10 Q46 6 50 6 V18 Q46 18 46 14', GR)}{L('M50 6 V18 L56 16')}</G>,
  'to-laugh': <G><circle cx="32" cy="32" r="20" fill={I.gold} stroke={GR} strokeWidth="3" />{T('M22 26 Q25 22 28 26 M36 26 Q39 22 42 26', { strokeWidth: 2.5 })}{F('M20 34 H44 Q42 48 32 48 Q22 48 20 34 Z', C)}</G>,
  'to-smile': <G><circle cx="32" cy="32" r="20" fill={I.gold} stroke={GR} strokeWidth="3" /><circle cx="25" cy="27" r="2.2" fill={GR} /><circle cx="39" cy="27" r="2.2" fill={GR} />{L('M22 36 Q32 46 42 36', { stroke: C, strokeWidth: 3.5 })}</G>,
  'to-cry': <G><circle cx="32" cy="32" r="20" fill={I.gold} stroke={GR} strokeWidth="3" />{T('M22 27 Q25 30 28 27 M36 27 Q39 30 42 27', { strokeWidth: 2.5 })}{L('M24 42 Q32 36 40 42')}{F('M22 32 Q18 40 22 44 Q26 40 22 32 Z', C)}</G>,
  'to-kiss': <G>{F('M12 32 Q20 22 32 28 Q44 22 52 32 Q44 44 32 44 Q20 44 12 32 Z', C)}{T('M14 32 Q32 34 50 32', { stroke: GR })}{F('M48 10 Q48 7 50.5 7 Q53 7 53 10 Q53 13 48 16 Q43 13 43 10 Q43 7 45.5 7 Q48 7 48 10 Z', C)}</G>,
  'to-love': <G>{F('M32 54 Q8 38 10 22 Q12 12 22 12 Q30 12 32 20 Q34 12 42 12 Q52 12 54 22 Q56 38 32 54 Z', C)}</G>,
  'to-sit': <G>{L('M40 14 V56 M20 38 H40 M24 38 V56')}<circle cx="26" cy="14" r="5" fill={C} />{L('M26 20 L28 34 H16 L14 50', { stroke: C, strokeWidth: 4.5 })}</G>,
  'to-lie-down': <G blob="wide">{F('M6 44 H58 V50 H6 Z', GR)}<circle cx="14" cy="36" r="5.5" fill={C} />{L('M20 38 H52', { stroke: C, strokeWidth: 6 })}</G>,
  'to-jump': <G blob="ground"><circle cx="32" cy="10" r="5.5" fill={C} />{L('M32 16 V30 M32 20 L22 12 M32 20 L42 12 M32 30 L24 38 M32 30 L40 38', { stroke: C, strokeWidth: 4 })}{T('M22 48 H42', { opacity: 0.7 })}{L('M32 42 V54 M26 48 L32 54 L38 48', { strokeWidth: 2 })}</G>,
  'to-fall': <G><g transform="rotate(35 32 30)"><circle cx="32" cy="10" r="5.5" fill={C} />{L('M32 16 V32 M32 22 L22 16 M32 22 L42 18 M32 32 L26 42 M32 32 L40 40', { stroke: C, strokeWidth: 4 })}</g>{T('M12 14 V24 M18 8 V16', { opacity: 0.7 })}{L('M6 56 H58')}</G>,
  'to-throw': <G><Person x={20} s={1.05} />{L('M24 34 L32 22')}{L('M34 20 Q44 8 56 20', { strokeDasharray: '2 5', strokeWidth: 2.5 })}<circle cx="56" cy="22" r="5" fill={C} /></G>,
  'to-catch': <G>{L('M14 52 L24 36 Q22 30 28 30 M50 52 L40 36 Q42 30 36 30', { strokeWidth: 4 })}<circle cx="32" cy="22" r="8" fill={C} /></G>,
  'to-push': <G><Person x={18} s={1.05} />{FL('M34 28 H58 V56 H34 Z', C)}{L('M24 38 L34 38')}{F('M40 40 L50 42 L40 44 Z', P)}</G>,
  'to-pull': <G><Person x={46} s={1.05} />{FL('M6 28 H28 V56 H6 Z', C)}{L('M28 40 L40 38')}{F('M24 40 L14 42 L24 44 Z', P)}</G>,
  'to-break': <G blob="wide"><path d="M8 34 H28 L24 40 L30 44 L26 50 H8 Z" fill={C} stroke={GR} strokeWidth="2.5" strokeLinejoin="round" /><path d="M56 30 H36 L32 36 L38 40 L34 46 H56 Z" fill={C} stroke={GR} strokeWidth="2.5" strokeLinejoin="round" />{T('M30 20 L34 26 M24 22 L22 28 M38 20 L42 24')}</G>,
  'to-build': <G blob="wide">{[0, 1, 2].map((r) => [0, 1, 2].slice(0, 3 - r).map((c) => <rect key={`${r}${c}`} x={10 + c * 14 + r * 7} y={46 - r * 10} width="13" height="9" fill={r === 2 ? C : '#B86B3E'} stroke={GR} strokeWidth="1.5" />))}{L('M50 56 V10 H30 M50 14 L42 10', { strokeWidth: 2.5 })}{T('M34 10 V18')}</G>,
  'to-dig': <G blob="ground">{F('M4 46 Q32 38 60 46 V58 H4 Z', '#8A5A3B')}{L('M42 8 L30 40', { strokeWidth: 4 })}{F('M24 36 L36 42 L30 52 Q20 50 24 36 Z', '#C9CCCF', { stroke: GR, strokeWidth: 2 })}{F('M38 6 H48 L46 10 H40 Z', C)}</G>,
  'to-burn': <G blob="tall">{L('M32 58 V30', { stroke: '#B9875A', strokeWidth: 5 })}{F('M32 6 Q42 18 40 26 Q38 32 32 32 Q26 32 24 26 Q22 18 32 6 Z', C)}{F('M32 16 Q36 22 34 28 H30 Q28 22 32 16 Z', I.gold)}</G>,
  'to-melt': <G>{FL('M20 12 H44 V34 Q40 40 36 34 Q32 44 28 34 Q24 40 20 34 Z', '#D8E8EE')}{F('M8 50 Q20 44 32 48 Q46 44 56 50 Q46 56 32 54 Q18 56 8 50 Z', '#9FD3E6')}{F('M30 40 Q26 46 30 48 Q34 46 30 40 Z', C)}</G>,
  'to-explode': <G>{F('M32 4 L37 22 L54 12 L44 28 L60 34 L42 38 L50 56 L34 44 L28 60 L24 42 L6 50 L18 34 L4 24 L22 24 L16 8 L30 20 Z', C)}{F('M32 22 L35 30 L44 30 L37 35 L40 44 L32 38 L24 44 L27 35 L20 30 L29 30 Z', I.gold)}</G>,
  'to-draw': <G>{FL('M6 12 H44 V52 H6 Z', P)}{T('M12 44 V32 L22 24 L32 32 V44 Z', { stroke: C, strokeWidth: 2.5 })}{F('M40 46 L58 18 L62 22 L44 50 Z', I.gold)}{F('M40 46 L44 50 L38 52 Z', GR)}</G>,
  'to-play': <G>{FL('M10 24 L28 16 L42 24 V44 L24 52 L10 44 Z', C)}<circle cx="18" cy="34" r="2.2" fill={P} /><circle cx="24" cy="40" r="2.2" fill={P} /><circle cx="48" cy="44" r="8" fill={GR} /></G>,
  'to-work': <G blob="wide"><rect x="10" y="22" width="44" height="30" rx="3" fill={C} /><path d="M24 22 V16 Q24 13 27 13 H37 Q40 13 40 16 V22" stroke={GR} strokeWidth="3.5" fill="none" /></G>,
  'to-learn': <G blob="wide">{FL('M6 38 Q18 32 32 38 Q46 32 58 38 V54 Q46 48 32 54 Q18 48 6 54 Z', P)}{L('M32 38 V54')}{F('M32 6 Q42 6 42 16 Q42 22 37 25 V30 H27 V25 Q22 22 22 16 Q22 6 32 6 Z', C)}{L('M28 33 H36', { strokeWidth: 2.5 })}</G>,
  'to-teach': <G blob="wide"><rect x="22" y="10" width="36" height="24" rx="1.5" fill={GR} />{T('M28 18 H44 M28 25 H50', { stroke: C, strokeWidth: 2.5 })}<Person x={14} s={0.95} />{L('M20 36 L28 26')}</G>,
  'to-count': <G>{['1', '2', '3'].map((n, i) => <text key={n} x={12 + i * 18} y={42} fontFamily="var(--font-eb-garamond), Georgia, serif" fontWeight="700" fontSize="24" fill={i === 2 ? C : GR}>{n}</text>)}</G>,
  'to-win': <G>{FL('M18 10 H46 V22 Q46 38 32 38 Q18 38 18 22 Z', I.gold)}{L('M18 14 H10 Q10 26 20 28 M46 14 H54 Q54 26 44 28')}{F('M28 38 H36 V46 H28 Z M20 46 H44 V54 H20 Z', GR)}{F('M32 16 l2 4 4.5 .5 -3.4 3 1 4.5 -4.1 -2.4 -4.1 2.4 1 -4.5 -3.4 -3 4.5 -.5 z', C)}</G>,
  'to-lose': <G>{FL('M18 10 H46 V22 Q46 38 32 38 Q18 38 18 22 Z', '#C9CCCF')}{F('M28 38 H36 V46 H28 Z M20 46 H44 V54 H20 Z', GR)}{L('M12 8 L52 56', { stroke: C, strokeWidth: 4 })}</G>,
  'to-fight': <G>{FL('M10 26 Q10 14 22 14 H30 Q38 14 38 24 V34 Q38 40 30 40 H16 Q10 40 10 34 Z', C)}{FL('M26 40 H38 V48 H26 Z', P)}{T('M46 20 L56 14 M48 30 H58 M46 40 L56 46', { stroke: GR, strokeWidth: 3 })}</G>,
  'to-smell': <G><Face2 />{T('M44 30 Q50 26 48 20 Q46 14 52 10 M50 36 Q56 32 54 26', { stroke: C, strokeWidth: 2.5 })}</G>,
  'to-taste': <G>{F('M8 30 Q20 20 32 26 Q44 20 56 30 Q44 42 32 42 Q20 42 8 30 Z', GR)}{F('M24 32 Q24 50 32 50 Q40 50 40 32 Z', C)}{L('M48 8 L36 26', { strokeWidth: 3.5 })}</G>,
  'to-touch': <G>{F('M26 58 V26 Q26 22 30 22 Q34 22 34 26 V40 L38 38 Q44 38 46 44 V58 Z', '#F2C9A8', { stroke: GR, strokeWidth: 2.5 })}<circle cx="30" cy="12" r="5" fill={C} />{T('M20 12 H14 M30 4 V2 M40 12 H46', { stroke: C })}</G>,
  'to-grow': <G blob="ground">{L('M4 56 H60')}{F('M10 56 V50 Q14 46 18 50 V56 Z', GR)}{L('M32 56 V40')}{F('M32 46 Q24 44 22 38 Q30 38 32 46 Z', GR)}{L('M52 56 V24')}{F('M52 34 Q42 30 40 22 Q50 22 52 34 Z M52 28 Q60 24 62 16 Q54 16 52 28 Z', C)}</G>,
  'to-feed': <G blob="wide">{FL('M30 36 H58 Q56 52 44 52 Q32 52 30 36 Z', P)}{F('M34 36 H54 Q50 32 44 32 Q38 32 34 36 Z', C)}{L('M6 20 L26 30')}{F('M26 30 Q34 28 34 34 Q28 38 24 34 Z', '#C9CCCF', { stroke: GR, strokeWidth: 2 })}</G>,
  'to-clean': <G>{L('M44 6 L26 40', { strokeWidth: 4 })}{F('M18 36 L34 44 L28 58 L10 54 Z', I.gold, { stroke: GR, strokeWidth: 2 })}{F('M44 46 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z M52 30 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5 z', C)}</G>,
  'to-carry-to-wear': <G><Person x={30} s={1.1} />{FL('M36 30 H56 V48 H36 Z', C)}</G>,
  'to-hang': <G>{L('M32 12 Q32 6 36 6 Q40 6 40 10 Q40 14 32 18 L8 34 H56 L32 18')}{F('M14 34 H50 L46 56 H18 Z', C)}</G>,
  'to-shake': <G>{F('M18 22 H46 V50 H18 Z', C, { transform: 'rotate(-10 32 36)' })}{T('M8 22 L4 30 L8 38 M56 22 L60 30 L56 38')}{T('M12 14 L16 18 M52 14 L48 18')}</G>,
  'to-sign': <G blob="tall">{FL('M14 6 H46 V58 H14 Z', P)}{T('M20 14 H40 M20 20 H40 M20 26 H34')}{L('M20 46 Q24 38 28 46 T36 46 Q40 42 42 46', { stroke: C, strokeWidth: 2.5 })}{F('M40 36 L54 22 L58 26 L44 40 Z', GR)}</G>,
  'to-beat': <G blob="wide">{FL('M12 32 H52 V50 Q32 56 12 50 Z', C)}<ellipse cx="32" cy="32" rx="20" ry="6" fill={P} stroke={GR} strokeWidth="2.5" />{L('M20 8 L30 28 M46 6 L36 28', { strokeWidth: 3 })}</G>,
  'to-lift': <G><Person x={32} y={60} s={1} />{L('M24 32 L18 14 M40 32 L46 14')}{L('M10 14 H54', { strokeWidth: 3.5 })}{F('M6 6 H14 V22 H6 Z M50 6 H58 V22 H50 Z', C)}</G>,
  'to-turn': <G>{F('M32 10 A22 22 0 1 1 10 32', 'none', { stroke: C, strokeWidth: 5, strokeLinecap: 'round' })}{F('M24 4 L34 10 L26 18 Z', C)}</G>,
  'to-follow': <G>{[[14, 50], [24, 40], [34, 30]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="3.5" ry="5.5" fill={GR} transform={`rotate(45 ${x} ${y})`} />)}<circle cx="48" cy="16" r="8" fill={C} /></G>,
  'to-stop': <G>{F('M22 8 H42 L56 22 V42 L42 56 H22 L8 42 V22 Z', C)}{L('M20 32 H44', { stroke: P, strokeWidth: 5 })}</G>,
  'to-go': <G>{F('M8 22 H34 V12 L56 32 L34 52 V42 H8 Z', C)}</G>,
  'to-pass-by': <G blob="wide">{F('M14 42 V36 L20 28 H36 L44 36 Q50 36 50 40 V42 Z', C)}<circle cx="20" cy="44" r="4" fill={GR} /><circle cx="42" cy="44" r="4" fill={GR} />{T('M2 32 H10 M4 40 H10', { opacity: 0.7 })}<Person x={56} y={52} s={0.6} /></G>,
  'to-think': <G><Person x={20} y={60} s={1.05} /><Bubble x={44} y={16} think><circle cx="46" cy="16" r="3" fill={C} /></Bubble></G>,
  'to-speak': <G><Person x={20} y={60} s={1.05} /><Bubble x={44} y={16}>{T('M38 14 H50 M38 19 H46', { stroke: C })}</Bubble></G>,
  'to-say': <G><Person x={20} y={60} s={1.05} /><Bubble x={44} y={16}><text x="46" y="20" textAnchor="middle" fontFamily="var(--font-eb-garamond), Georgia, serif" fontWeight="700" fontSize="13" fill={C}>“ ”</text></Bubble></G>,
  'to-find': <G>{Ring(26, 26, 14, { strokeWidth: 4 })}{L('M36 36 L54 54', { strokeWidth: 6 })}{F('M26 18 l2 5 5 .5 -4 3.5 1.2 5 -4.2 -2.6 -4.2 2.6 1.2 -5 -4 -3.5 5 -.5 z', C)}</G>,
  'to-wake-up': <G><circle cx="32" cy="36" r="18" fill={P} stroke={GR} strokeWidth="3" />{L('M32 36 V26 M32 36 L40 40')}{F('M12 18 Q12 10 20 10 Z M52 18 Q52 10 44 10 Z', C)}{L('M20 54 L16 58 M44 54 L48 58')}{T('M6 30 L2 28 M58 30 L62 28', { stroke: C })}</G>,
  'to-marry': <G><circle cx="25" cy="36" r="13" fill="none" stroke={I.gold} strokeWidth="4.5" /><circle cx="39" cy="36" r="13" fill="none" stroke={C} strokeWidth="4.5" />{F('M32 10 Q32 6 35 6 Q38 6 38 9 Q38 13 32 17 Q26 13 26 9 Q26 6 29 6 Q32 6 32 10 Z', C)}</G>,
  'to-pray': <G>{F('M32 56 L22 48 Q20 30 26 14 Q30 10 32 14 Z', '#F2C9A8', { stroke: GR, strokeWidth: 2.5 })}{F('M32 56 L42 48 Q44 30 38 14 Q34 10 32 14 Z', '#F2C9A8', { stroke: GR, strokeWidth: 2.5 })}{T('M14 14 L18 18 M50 14 L46 18 M32 4 V8', { stroke: C, strokeWidth: 2.5 })}</G>,
  'to-mix': <G blob="wide">{FL('M8 30 H56 Q54 52 32 52 Q10 52 8 30 Z', P)}{L('M20 38 Q32 30 44 38 Q32 46 22 40', { stroke: C })}{L('M44 8 L34 36', { strokeWidth: 3.5 })}</G>,
  'to-bend': <G>{L('M10 50 Q32 50 34 30 Q36 12 54 12', { strokeWidth: 6, stroke: C })}{T('M8 56 H22 M46 6 H58', { opacity: 0.7 })}</G>,
  'to-die': <G blob="ground">{FL('M20 54 V26 Q20 12 32 12 Q44 12 44 26 V54 Z', '#9A9893')}{F('M12 54 H52 V58 H12 Z', GR)}{F('M46 48 Q48 40 54 44 Q52 50 46 48 Z', C)}</G>,
};

function Face2() {
  return (
    <>
      <ellipse cx="28" cy="32" rx="15" ry="18" fill={P} stroke={GR} strokeWidth="3" />
      <circle cx="22" cy="28" r="2" fill={GR} />
      <circle cx="34" cy="28" r="2" fill={GR} />
      <path d="M28 30 L25 38 H31" stroke={C} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23 43 Q28 46 33 43" stroke={GR} strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </>
  );
}

// ─── Adjectives as contrasts: the coral half is the word ────────────────────
type Shape = 'circle' | 'bar' | 'tallbar' | 'box';
function Pair({ a, b, target }: { a: ReactNode; b: ReactNode; target: 'a' | 'b' }) {
  return (
    <G blob="wide">
      <g opacity={target === 'a' ? 1 : 0.55}>{a}</g>
      <g opacity={target === 'b' ? 1 : 0.55}>{b}</g>
    </G>
  );
}
const col = (on: boolean) => (on ? C : GR);
const sizePair = (shape: Shape, big: boolean): ReactNode => {
  const draw = (x: number, s: number, on: boolean) =>
    shape === 'circle' ? <circle cx={x} cy={44 - s} r={s} fill={col(on)} /> : <rect x={x - s} y={50 - s * 2} width={s * 2} height={s * 2} fill={col(on)} />;
  return <Pair a={draw(20, 13, big)} b={draw(48, 5, !big)} target={big ? 'a' : 'b'} />;
};

const ADJ: Record<string, ReactNode> = {
  big: sizePair('circle', true),
  small: sizePair('circle', false),
  long: <Pair a={<rect x="6" y="20" width="52" height="8" rx="4" fill={C} />} b={<rect x="6" y="38" width="18" height="8" rx="4" fill={GR} />} target="a" />,
  'short-vs-long': <Pair a={<rect x="6" y="20" width="52" height="8" rx="4" fill={GR} />} b={<rect x="6" y="38" width="18" height="8" rx="4" fill={C} />} target="b" />,
  'tall-high': <Pair a={<Person x={20} s={1.3} y={60} fill={C} />} b={<Person x={46} s={0.75} y={60} />} target="a" />,
  'short-vs-tall-low': <Pair a={<Person x={20} s={1.3} y={60} />} b={<Person x={46} s={0.75} y={60} fill={C} />} target="b" />,
  wide: <Pair a={<rect x="6" y="14" width="34" height="38" fill={C} />} b={<rect x="46" y="14" width="10" height="38" fill={GR} />} target="a" />,
  narrow: <Pair a={<rect x="6" y="14" width="34" height="38" fill={GR} />} b={<rect x="46" y="14" width="10" height="38" fill={C} />} target="b" />,
  thick: <Pair a={<rect x="6" y="26" width="24" height="20" fill={C} />} b={<rect x="38" y="33" width="22" height="5" fill={GR} />} target="a" />,
  thin: <Pair a={<rect x="6" y="26" width="24" height="20" fill={GR} />} b={<rect x="38" y="33" width="22" height="5" fill={C} />} target="b" />,
  fast: <G>{F('M20 44 Q20 30 34 30 H44 L54 38 V46 H20 Z', C)}<circle cx="28" cy="48" r="4" fill={GR} /><circle cx="46" cy="48" r="4" fill={GR} />{T('M4 34 H14 M2 40 H12 M6 46 H14', { strokeWidth: 3 })}</G>,
  slow: <G blob="ground">{F('M14 50 Q14 30 30 30 Q46 30 46 46 H14 Z', C)}{L('M22 44 Q22 36 30 36 Q38 36 38 44', { stroke: P, strokeWidth: 2.5 })}{F('M46 50 Q52 50 54 40 L58 38 L56 50 Z', GR)}{L('M6 52 H60')}</G>,
  hot: <G>{L('M27 40 V14 Q27 9 32 9 Q37 9 37 14 V40')}<circle cx="32" cy="46" r="8" fill={C} /><rect x="30" y="14" width="4" height="30" fill={C} />{T('M44 18 Q48 14 46 10 M50 24 Q54 20 52 16', { stroke: C })}</G>,
  cold: <G>{L('M27 40 V14 Q27 9 32 9 Q37 9 37 14 V40')}<circle cx="32" cy="46" r="8" fill="#3C6E9E" /><rect x="30" y="38" width="4" height="6" fill="#3C6E9E" />{T('M46 14 V26 M41 17 L51 23 M51 17 L41 23', { stroke: '#3C6E9E' })}</G>,
  warm: <G>{FL('M12 26 H46 V40 Q46 52 29 52 Q12 52 12 40 Z', C)}{L('M46 30 Q56 30 56 36 Q56 42 46 42')}{T('M22 18 Q19 12 23 8 M32 18 Q29 12 33 8', { stroke: C })}</G>,
  cool: <G>{FL('M18 14 H46 L42 56 H22 Z', '#D8E8EE')}<rect x="24" y="26" width="9" height="9" fill={P} stroke="#3C6E9E" strokeWidth="2" transform="rotate(15 28 30)" /><rect x="32" y="38" width="8" height="8" fill={P} stroke="#3C6E9E" strokeWidth="2" transform="rotate(-10 36 42)" /></G>,
  new: <G>{FL('M18 20 H46 V52 H18 Z', C)}{F('M48 8 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z M12 10 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5 z', I.gold)}</G>,
  old: <G>{FL('M18 20 H46 V52 H18 Z', '#B9875A')}{T('M24 26 L30 34 L26 40 M40 30 L36 38 M30 46 L36 50')}</G>,
  young: <Pair a={<Person kind="child" x={20} s={0.8} fill={C} />} b={<Person kind="elder-man" x={44} s={1.1} />} target="a" />,
  good: <G>{F('M18 58 V30 L30 8 Q38 8 36 20 L34 28 H50 Q56 28 54 36 L48 54 Q46 58 40 58 Z', C)}<rect x="8" y="30" width="8" height="28" fill={GR} /></G>,
  bad: <G><g transform="rotate(180 32 33)">{F('M18 58 V30 L30 8 Q38 8 36 20 L34 28 H50 Q56 28 54 36 L48 54 Q46 58 40 58 Z', C)}<rect x="8" y="30" width="8" height="28" fill={GR} /></g></G>,
  wet: <G>{F('M32 6 Q50 30 50 40 Q50 54 32 54 Q14 54 14 40 Q14 30 32 6 Z', '#3C6E9E')}{T('M24 40 Q24 32 28 28', { stroke: P, strokeWidth: 2.5 })}<circle cx="50" cy="16" r="3" fill={C} /></G>,
  dry: <G blob="wide">{F('M4 40 H60 V56 H4 Z', I.gold)}{T('M10 46 L18 50 L14 56 M30 42 L34 48 L28 54 M46 44 L50 50 L56 48', { strokeWidth: 2 })}<circle cx="44" cy="16" r="9" fill={C} /></G>,
  sick: <G><circle cx="30" cy="32" r="20" fill="#C7D9A8" stroke={GR} strokeWidth="3" /><circle cx="23" cy="28" r="2" fill={GR} /><circle cx="37" cy="28" r="2" fill={GR} />{T('M23 40 Q30 36 37 40')}{L('M46 6 V30', { strokeWidth: 0 })}<rect x="44" y="12" width="5" height="20" rx="2.5" fill={P} stroke={GR} strokeWidth="1.8" /><circle cx="46.5" cy="34" r="4" fill={C} /></G>,
  healthy: <G><circle cx="32" cy="32" r="20" fill={I.gold} stroke={GR} strokeWidth="3" /><circle cx="25" cy="27" r="2.2" fill={GR} /><circle cx="39" cy="27" r="2.2" fill={GR} />{L('M22 36 Q32 46 42 36')}{F('M48 6 Q48 2 51 2 Q54 2 54 5 Q54 9 48 13 Q42 9 42 5 Q42 2 45 2 Q48 2 48 6 Z', C)}</G>,
  loud: <G>{F('M8 24 H18 L32 12 V52 L18 40 H8 Z', GR)}{L('M38 22 Q44 32 38 42 M44 16 Q54 32 44 48 M50 10 Q64 32 50 54', { stroke: C })}</G>,
  quiet: <G>{F('M8 24 H18 L32 12 V52 L18 40 H8 Z', GR)}{L('M40 24 L56 40 M56 24 L40 40', { stroke: C, strokeWidth: 4 })}</G>,
  happy: <G><circle cx="32" cy="32" r="20" fill={C} /><circle cx="25" cy="27" r="2.4" fill={GR} /><circle cx="39" cy="27" r="2.4" fill={GR} />{L('M22 36 Q32 46 42 36')}</G>,
  sad: <G><circle cx="32" cy="32" r="20" fill="#9FB6D3" /><circle cx="25" cy="27" r="2.4" fill={GR} /><circle cx="39" cy="27" r="2.4" fill={GR} />{L('M22 44 Q32 34 42 44')}</G>,
  beautiful: <G>{L('M32 56 V30')}{[0, 72, 144, 216, 288].map((d) => <ellipse key={d} cx="32" cy="14" rx="5.5" ry="8" fill={C} transform={`rotate(${d} 32 22)`} />)}<circle cx="32" cy="22" r="4.5" fill={I.gold} />{F('M50 8 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5 z', I.gold)}</G>,
  ugly: <G>{L('M32 56 V36 Q32 30 40 28')}{F('M40 28 Q48 30 50 38 Q42 40 40 28 Z M36 34 Q30 40 22 38 Q26 30 36 34 Z', '#8A7A5A')}{T('M12 12 L16 16 M50 10 L46 16', { stroke: C })}</G>,
  deaf: <G>{F('M22 50 Q22 40 28 36 Q34 32 34 24 Q34 14 26 14 Q16 14 16 26', 'none', { stroke: GR, strokeWidth: 5, strokeLinecap: 'round' })}{L('M8 8 L52 56', { stroke: C, strokeWidth: 4 })}</G>,
  blind: <G blob="wide">{F('M4 32 Q32 6 60 32 Q32 58 4 32 Z', P, { stroke: GR, strokeWidth: 3 })}<circle cx="32" cy="32" r="10" fill={GR} />{L('M8 8 L56 56', { stroke: C, strokeWidth: 4 })}</G>,
  nice: <G blob="wide"><Person x={22} s={1} />{F('M30 30 Q36 26 40 32 L46 30 L44 36 Q38 40 30 36 Z', C)}<Person x={50} s={0.8} /></G>,
  mean: <G><circle cx="32" cy="32" r="20" fill={C} />{L('M20 22 L28 26 M44 22 L36 26', { strokeWidth: 3 })}<circle cx="25" cy="30" r="2.2" fill={GR} /><circle cx="39" cy="30" r="2.2" fill={GR} />{L('M24 42 H40')}</G>,
  rich: <G>{FL('M18 26 Q12 34 14 46 Q16 56 32 56 Q48 56 50 46 Q52 34 46 26 Z', I.gold)}{L('M24 26 L20 12 H44 L40 26')}<text x="32" y="47" textAnchor="middle" fontFamily="var(--font-eb-garamond), Georgia, serif" fontWeight="700" fontSize="16" fill={C}>$</text></G>,
  poor: <G>{FL('M14 12 H50 V56 H14 Z', '#3C6E9E')}{FL('M22 26 Q32 46 42 26', P)}<circle cx="32" cy="50" r="2.5" fill={C} /></G>,
  expensive: <G>{FL('M10 30 L28 12 H52 V36 L34 54 Z', C)}<circle cx="44" cy="20" r="3.5" fill={P} /><text x="31" y="40" textAnchor="middle" fontFamily="var(--font-eb-garamond), Georgia, serif" fontWeight="700" fontSize="14" fill={P} transform="rotate(-45 31 36)">$$$</text></G>,
  cheap: <G>{FL('M10 30 L28 12 H52 V36 L34 54 Z', '#9FCB9F')}<circle cx="44" cy="20" r="3.5" fill={P} /><text x="31" y="40" textAnchor="middle" fontFamily="var(--font-eb-garamond), Georgia, serif" fontWeight="700" fontSize="16" fill={C} transform="rotate(-45 31 36)">$</text></G>,
  flat: <G blob="wide">{L('M6 34 H58', { stroke: C, strokeWidth: 5 })}</G>,
  curved: <G blob="wide">{L('M6 46 Q32 4 58 46', { stroke: C, strokeWidth: 5 })}</G>,
  male: <G>{Ring(26, 38, 14, { stroke: C, strokeWidth: 5 })}{L('M36 28 L52 12 M40 12 H52 V24', { stroke: C, strokeWidth: 5 })}</G>,
  female: <G>{Ring(32, 24, 14, { stroke: C, strokeWidth: 5 })}{L('M32 38 V58 M24 50 H40', { stroke: C, strokeWidth: 5 })}</G>,
  tight: <G>{L('M10 12 V54 M54 12 V54', { strokeWidth: 4 })}{F('M14 20 H50 V46 H14 Z', C)}{F('M8 30 L14 33 L8 36 Z M56 30 L50 33 L56 36 Z', GR)}</G>,
  loose: <G>{L('M6 12 V54 M58 12 V54', { strokeWidth: 4 })}{F('M24 22 H40 V44 H24 Z', C)}{T('M10 33 H20 M44 33 H54', { strokeDasharray: '2 3' })}</G>,
  soft: <G blob="wide">{FL('M8 32 Q8 20 20 20 H44 Q56 20 56 32 Q56 44 44 44 H20 Q8 44 8 32 Z', C)}{T('M18 32 Q32 28 46 32', { stroke: P })}</G>,
  hard: <G>{FL('M10 46 Q8 28 26 22 Q46 18 54 34 Q58 50 38 52 H18 Q10 52 10 46 Z', '#9A9893')}{L('M46 8 L40 20 M52 12 L44 22', { stroke: C, strokeWidth: 3 })}</G>,
  deep: <G blob="tall">{L('M10 14 H54')}{F('M14 14 H50 V58 H14 Z', '#3C6E9E')}{L('M32 18 V52 M26 46 L32 52 L38 46', { stroke: C, strokeWidth: 3.5 })}</G>,
  clean: <G>{FL('M18 10 L32 16 L46 10 L56 20 L50 28 V56 H14 V28 L8 20 Z', P)}{F('M48 36 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z M22 34 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5 z', C)}</G>,
  dirty: <G>{FL('M18 10 L32 16 L46 10 L56 20 L50 28 V56 H14 V28 L8 20 Z', '#C9B79A')}{F('M22 34 Q18 30 22 28 Q26 30 28 28 Q32 32 28 36 Z M38 44 Q34 40 38 38 Q42 40 44 38 Q46 44 40 46 Z', C)}</G>,
  strong: <G>{F('M10 40 Q10 24 22 22 Q26 14 34 16 Q38 22 32 26 Q44 24 50 34 Q54 46 40 50 H18 Q10 48 10 40 Z', C)}{T('M22 30 Q28 34 30 28', { stroke: P })}</G>,
  weak: <G blob="ground">{L('M32 56 V36 Q32 30 40 28', { strokeWidth: 2 })}{F('M40 28 Q48 30 48 40 Q40 38 40 28 Z', '#C7D9A8')}{L('M22 56 Q22 46 30 46', { stroke: C, strokeWidth: 2.5 })}</G>,
  dead: <G blob="ground">{L('M32 56 V28', { stroke: '#8A7A5A' })}{F('M32 30 Q20 34 18 44 Q28 42 32 30 Z M32 26 Q40 34 50 32 Q44 24 32 26 Z', '#8A7A5A')}{T('M10 56 H54')}<circle cx="16" cy="54" r="2" fill={C} /></G>,
  alive: <G blob="ground">{L('M32 56 V28')}{F('M32 36 Q18 36 16 24 Q30 24 32 36 Z M32 30 Q44 28 48 16 Q34 16 32 30 Z', GR)}<circle cx="32" cy="22" r="5" fill={C} /></G>,
  heavy: <G>{F('M14 54 L18 26 H46 L50 54 Z', GR)}{L('M24 26 Q24 16 32 16 Q40 16 40 26', { strokeWidth: 3.5 })}<text x="32" y="46" textAnchor="middle" fontFamily="var(--font-inter), sans-serif" fontWeight="700" fontSize="12" fill={C}>100</text></G>,
  'light-weight': <G>{F('M26 8 Q42 16 40 34 Q34 50 22 56 Q30 40 28 26 Q26 16 26 8 Z', C)}{T('M26 10 Q34 30 22 56', { stroke: P })}</G>,
  dark: <G><rect x="8" y="8" width="48" height="48" rx="4" fill="#2B3A38" /><circle cx="40" cy="22" r="6" fill={I.gold} /><circle cx="43" cy="20" r="5" fill="#2B3A38" />{F('M16 18 l1 2.5 2.5 1 -2.5 1 -1 2.5 -1 -2.5 -2.5 -1 2.5 -1 z', C)}</G>,
  'light-color': <G><rect x="8" y="8" width="48" height="48" rx="4" fill="#F7EFD6" stroke={GR} strokeWidth="2" /><circle cx="32" cy="32" r="10" fill={C} /></G>,
  nuclear: <G>{[0, 60, 120].map((d) => <ellipse key={d} cx="32" cy="32" rx="22" ry="8" fill="none" stroke={GR} strokeWidth="2.5" transform={`rotate(${d} 32 32)`} />)}<circle cx="32" cy="32" r="5" fill={C} /></G>,
  famous: <G><Person x={32} s={1.1} />{F('M14 10 l2 4.5 5 .5 -3.8 3.3 1.2 5 -4.4 -2.6 -4.4 2.6 1.2 -5 -3.8 -3.3 5 -.5 z M50 8 l2 4.5 5 .5 -3.8 3.3 1.2 5 -4.4 -2.6 -4.4 2.6 1.2 -5 -3.8 -3.3 5 -.5 z', C)}</G>,
};

// ─── Pronouns: pointing figures ─────────────────────────────────────────────
const PRONOUNS: Record<string, ReactNode> = {
  'i-we': <G><Person x={32} s={1.2} y={60} fill={C} />{L('M40 30 L32 36', { stroke: GR, strokeWidth: 3 })}</G>,
  'you-singular': <G blob="wide"><Person x={18} s={1} />{L('M24 34 L40 30')}<Person x={48} s={1} fill={C} /></G>,
  'you-formal': <G blob="wide"><Person x={18} s={1} />{L('M24 34 L40 30')}<Person kind="man" x={48} s={1.05} fill={C} /><rect x="45" y="40" width="6" height="8" fill={P} /></G>,
  'you-plural': <G blob="wide"><Person x={12} s={0.9} />{L('M18 36 L28 32')}{[34, 46, 58].map((x) => <Person key={x} x={x} s={0.75} fill={C} />)}</G>,
  'he-she-they': <G blob="wide"><Person x={12} s={0.9} />{L('M18 36 L26 34')}<Person kind="man" x={36} s={0.9} fill={C} /><Person kind="woman" x={54} s={0.9} fill={C} /></G>,
};

// ─── Grammar words a picture CAN say: space, time, contrast ─────────────────
// (The rest, such as "because", "if" or "already", keep the typographic card.)
const BallIn = ({ x, y }: { x: number; y: number }) => <circle cx={x} cy={y} r="6" fill={C} />;
const GRAMMAR: Record<string, ReactNode> = {
  'in-on': (
    <G>
      {FL('M10 30 H34 V54 H10 Z', P)}
      <BallIn x={22} y={44} />
      {FL('M38 40 H58 V54 H38 Z', P)}
      <BallIn x={48} y={33} />
    </G>
  ),
  behind: <G>{FL('M18 22 H42 V54 H18 Z', GR)}<circle cx="46" cy="22" r="8" fill={C} />{FL('M18 22 H42 V54 H18 Z', GR)}</G>,
  'between-among': <G blob="wide">{FL('M4 26 H20 V50 H4 Z', P)}{FL('M44 26 H60 V50 H44 Z', P)}<circle cx="32" cy="40" r="8" fill={C} /></G>,
  here: <G blob="ground">{L('M32 8 V40 M24 32 L32 42 L40 32', { stroke: C, strokeWidth: 4.5 })}<ellipse cx="32" cy="52" rx="16" ry="5" fill={GR} /></G>,
  there: <G blob="wide"><Person x={14} s={0.9} />{L('M20 34 L30 30')}{L('M34 30 H48', { strokeDasharray: '2 5', strokeWidth: 2.5 })}<circle cx="54" cy="30" r="6" fill={C} /></G>,
  today: (
    <G blob="wide">
      {[0, 1, 2].map((i) => <rect key={i} x={8 + i * 17} y="20" width="14" height="24" rx="2" fill={i === 1 ? C : P} stroke={GR} strokeWidth="2.2" />)}
      {L('M32 10 V16 M28 13 L32 17 L36 13', { strokeWidth: 2.5 })}
    </G>
  ),
  yesterday: (
    <G blob="wide">
      {[0, 1, 2].map((i) => <rect key={i} x={8 + i * 17} y="20" width="14" height="24" rx="2" fill={i === 0 ? C : P} stroke={GR} strokeWidth="2.2" />)}
      {L('M15 10 V16 M11 13 L15 17 L19 13', { strokeWidth: 2.5 })}
    </G>
  ),
  with: <G blob="wide"><Person x={22} s={1} /><Person x={42} s={1} fill={C} />{L('M28 40 H36')}</G>,
  without: <G blob="wide"><Person x={22} s={1} />{L('M36 18 L58 48 M58 18 L36 48', { stroke: C, strokeWidth: 3.5 })}</G>,
  more: <G>{[[18, 44], [30, 44], [42, 44], [24, 32], [36, 32], [30, 20]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5.5" fill={i === 5 ? C : GR} />)}{L('M50 14 V26 M44 20 H56', { stroke: C, strokeWidth: 3.5 })}</G>,
  less: <G>{[[24, 44], [36, 44]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5.5" fill={GR} />)}<circle cx="30" cy="32" r="5.5" fill="none" stroke={GR} strokeWidth="2" strokeDasharray="2 2" />{L('M44 20 H56', { stroke: C, strokeWidth: 3.5 })}</G>,
  // An open, empty box: the coral outline marks the emptiness.
  nothing: <G>{FL('M10 30 L32 40 L54 30 V50 L32 60 L10 50 Z', P)}{FL('M10 30 L32 20 L54 30 L32 40 Z', I.desk)}{L('M10 30 L32 20 L54 30 L32 40 Z', { stroke: C, strokeWidth: 2.5 })}{L('M10 30 L2 22 M54 30 L62 22')}</G>,
  something: <G>{FL('M10 26 L32 16 L54 26 V48 L32 58 L10 48 Z', P)}{T('M10 26 L32 36 L54 26 M32 36 V58')}<text x="32" y="12" textAnchor="middle" fontFamily="var(--font-eb-garamond), Georgia, serif" fontWeight="700" fontSize="16" fill={C}>?</text></G>,
  'to-come': <G blob="wide"><Person x={14} s={0.9} />{L('M56 32 H30 M38 24 L30 32 L38 40', { stroke: C, strokeWidth: 4.5 })}</G>,
  'to-come-back': <G blob="wide">{L('M12 30 H44 Q54 30 54 40 Q54 50 44 50 H26', { stroke: C, strokeWidth: 4.5 })}{L('M32 44 L26 50 L32 56', { stroke: C, strokeWidth: 4.5 })}{F('M4 22 L12 14 L20 22 V36 H4 Z', GR)}</G>,
  'to-go-in': <G>{L('M30 10 V56 M30 10 H52 V56')}{F('M30 10 L42 14 V58 L30 56 Z', GR)}{L('M6 34 H24 M18 28 L24 34 L18 40', { stroke: C, strokeWidth: 4.5 })}</G>,
  'to-give': <G blob="wide"><Person x={12} s={0.9} />{FL('M24 32 H40 V44 H24 Z', C)}{L('M32 32 V44 M24 36 H40', { stroke: I.gold, strokeWidth: 2 })}<Person x={52} s={0.9} />{L('M18 36 L24 38 M46 36 L40 38')}</G>,
  vowel: <G>{['a', 'e', 'i', 'o', 'u'].map((ch, i) => <text key={ch} x={10 + i * 11} y={40} fontFamily="var(--font-eb-garamond), Georgia, serif" fontWeight="700" fontSize="20" fill={i === 0 ? C : GR}>{ch}</text>)}</G>,
  consonant: <G>{['b', 'c', 'd', 'f', 'g'].map((ch, i) => <text key={ch} x={10 + i * 10.5} y={40} fontFamily="var(--font-eb-garamond), Georgia, serif" fontWeight="700" fontSize="20" fill={i === 0 ? C : GR}>{ch}</text>)}</G>,
};

export const ACTION_GLYPHS: Record<string, ReactNode> = {
  ...GRAMMAR,
  ...SOCIETY,
  ...ART,
  ...MISC,
  ...VERBS,
  ...ADJ,
  ...PRONOUNS,
};

