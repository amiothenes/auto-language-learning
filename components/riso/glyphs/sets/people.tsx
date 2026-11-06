import type { ReactNode } from 'react';
import { G, L, T, F, FL, Person, INKS as I } from '../kit';

/* People and jobs. In relationship words the CORAL figure is the word itself. */

const C = I.coral;
const GR = I.green;

/** A small gold ring between two figures (marriage words). */
const WeddingRing = ({ x = 32, y = 22 }: { x?: number; y?: number }) => (
  <circle cx={x} cy={y} r="4" fill="none" stroke={I.gold} strokeWidth="2.5" />
);

const PEOPLE: Record<string, ReactNode> = {
  'boy-child': (
    <G>
      <Person kind="child" s={1.1} fill={GR} />
    </G>
  ),
  girl: <G><Person kind="girl" s={1.1} /></G>,
  man: <G><Person kind="man" s={1.25} y={60} /></G>,
  woman: <G><Person kind="woman" s={1.25} y={60} /></G>,
  person: <G><Person s={1.2} y={60} /></G>,
  human: (
    <G>
      <Person s={1.15} x={26} y={60} />
      {/* ≠ animal: a small dog, crossed out */}
      {F('M42 58 V50 Q42 46 46 46 H54 Q57 46 57 50 V58 Z', GR, { opacity: 0.35 })}
      {L('M40 44 L60 60', { stroke: C })}
    </G>
  ),
  adult: (
    <G blob="wide">
      <Person kind="man" x={22} s={1.1} fill={C} />
      <Person kind="woman" x={42} s={1.1} fill={C} />
    </G>
  ),
  baby: (
    <G>
      <ellipse cx="32" cy="42" rx="16" ry="11" fill={GR} />
      <circle cx="22" cy="32" r="8" fill={C} />
      {T('M36 36 Q42 32 48 36')}
    </G>
  ),
  family: (
    <G blob="wide">
      <Person kind="man" x={16} s={1} />
      <Person kind="woman" x={48} s={1} />
      <Person kind="child" x={32} s={0.7} fill={C} />
    </G>
  ),
  crowd: (
    <G blob="wide">
      {[10, 22, 34, 46, 56].map((x, i) => <Person key={x} x={x} y={60 - (i % 2) * 4} s={0.7} fill={i === 2 ? C : GR} />)}
      {[16, 28, 40, 52].map((x) => <Person key={x} x={x} y={50} s={0.6} fill={GR} />)}
    </G>
  ),
  mother: (
    <G blob="wide">
      <Person kind="woman" x={26} s={1.15} fill={C} />
      <Person kind="child" x={46} s={0.65} />
    </G>
  ),
  father: (
    <G blob="wide">
      <Person kind="man" x={26} s={1.15} fill={C} />
      <Person kind="child" x={46} s={0.65} />
    </G>
  ),
  son: (
    <G blob="wide">
      <Person kind="man" x={18} s={1} />
      <Person kind="woman" x={34} s={1} />
      <Person kind="child" x={50} s={0.7} fill={C} />
    </G>
  ),
  daughter: (
    <G blob="wide">
      <Person kind="man" x={18} s={1} />
      <Person kind="woman" x={34} s={1} />
      <Person kind="girl" x={50} s={0.7} fill={C} />
    </G>
  ),
  brother: (
    <G blob="wide">
      <Person kind="girl" x={22} s={0.85} />
      <Person kind="child" x={42} s={0.85} fill={C} />
    </G>
  ),
  sister: (
    <G blob="wide">
      <Person kind="child" x={22} s={0.85} />
      <Person kind="girl" x={42} s={0.85} fill={C} />
    </G>
  ),
  grandfather: (
    <G>
      <Person kind="elder-man" x={28} s={1.15} fill={C} />
      <Person kind="child" x={50} s={0.55} />
    </G>
  ),
  grandmother: (
    <G>
      <Person kind="elder-woman" x={28} s={1.15} fill={C} />
      <Person kind="child" x={50} s={0.55} />
    </G>
  ),
  husband: (
    <G blob="wide">
      <Person kind="woman" x={22} s={1.05} />
      <Person kind="man" x={42} s={1.05} fill={C} />
      <WeddingRing />
    </G>
  ),
  wife: (
    <G blob="wide">
      <Person kind="woman" x={22} s={1.05} fill={C} />
      <Person kind="man" x={42} s={1.05} />
      <WeddingRing />
    </G>
  ),
  king: <G><Person kind="man" s={1.15} y={60} crown /></G>,
  queen: <G><Person kind="woman" s={1.15} y={60} crown /></G>,
  president: (
    <G>
      <Person kind="man" x={32} y={44} s={0.9} />
      {FL('M18 40 H46 L42 58 H22 Z', C)}
      <circle cx="32" cy="48" r="3" fill={I.paper} />
    </G>
  ),
  neighbor: (
    <G blob="wide">
      {FL('M6 30 L16 20 L26 30 V56 H6 Z', I.paper)}
      {FL('M38 30 L48 20 L58 30 V56 H38 Z', I.paper)}
      <Person x={32} s={0.8} fill={C} />
    </G>
  ),
  friend: (
    <G blob="wide">
      <Person x={22} s={1.05} />
      <Person x={42} s={1.05} fill={C} />
      {L('M27 42 Q32 38 37 42')}
    </G>
  ),
  victim: (
    <G>
      <Person s={1.15} y={60} />
      {L('M24 26 L40 20', { stroke: I.paper, strokeWidth: 4 })}
      <rect x="22" y="22" width="20" height="5" rx="2" fill={I.paper} transform="rotate(-18 32 24)" />
      {F('M44 12 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1 z', C)}
    </G>
  ),
  player: (
    <G>
      <Person x={26} s={1.1} />
      <circle cx="47" cy="50" r="7" fill={C} />
      {T('M41 50 H53 M47 44 V56', { stroke: I.paper })}
    </G>
  ),
  fan: (
    <G>
      <Person x={26} s={1.1} />
      {L('M36 34 L42 10')}
      {F('M42 10 L58 14 L44 22 Z', C)}
    </G>
  ),
};

const JOBS: Record<string, ReactNode> = {
  'job-work': (
    <G blob="wide">
      <rect x="10" y="22" width="44" height="30" rx="3" fill={GR} />
      <path d="M24 22 V16 Q24 13 27 13 H37 Q40 13 40 16 V22" stroke={GR} strokeWidth="3.5" fill="none" />
      <rect x="28" y="32" width="8" height="6" rx="1" fill={C} />
    </G>
  ),
  teacher: (
    <G blob="wide">
      <rect x="22" y="10" width="36" height="24" rx="1.5" fill={GR} />
      {T('M28 18 H44 M28 25 H50', { stroke: I.paper })}
      <Person x={14} s={0.95} fill={C} />
      {T('M20 36 L28 28')}
    </G>
  ),
  student: (
    <G>
      <Person x={32} y={60} s={1.05} />
      {F('M18 22 L32 15 L46 22 L32 29 Z', C)}
      {T('M44 23 V31')}
      {FL('M20 46 H44 V56 H20 Z', I.paper)}
    </G>
  ),
  lawyer: (
    <G>
      {L('M32 12 V52 M16 20 H48 M22 54 H42')}
      {L('M16 20 L10 34 H22 Z M48 20 L42 34 H54 Z')}
      {F('M10 34 H22 Q16 40 10 34 Z M42 34 H54 Q48 40 42 34 Z', C)}
    </G>
  ),
  doctor: (
    <G>
      <Person x={32} y={60} s={1.15} fill={I.paper} />
      <path d="M24.5 60 L25.5 35 Q32 31 38.5 35 L39.5 60" stroke={GR} strokeWidth="2.5" fill="none" />
      <circle cx="32" cy="25.5" r="7.5" fill={GR} />
      <rect x="29" y="42" width="6" height="14" fill={C} />
      <rect x="25" y="46" width="14" height="6" fill={C} />
    </G>
  ),
  patient: (
    <G blob="wide">
      {L('M8 50 H56 M8 34 V56 M56 42 V56')}
      <rect x="14" y="40" width="42" height="10" rx="2" fill={GR} />
      <circle cx="16" cy="36" r="6" fill={C} />
      {FL('M50 14 V30 M42 22 H58', 'none', { stroke: C, strokeWidth: 4 })}
    </G>
  ),
  waiter: (
    <G>
      <Person x={28} y={60} s={1.1} />
      {L('M38 30 H58')}
      {F('M40 30 Q48 18 56 30 Z', C)}
      <circle cx="48" cy="20" r="1.8" fill={GR} />
    </G>
  ),
  secretary: (
    <G blob="wide">
      <Person x={22} y={44} s={0.85} />
      <rect x="6" y="42" width="52" height="5" fill={GR} />
      {L('M10 47 V58 M54 47 V58')}
      {FL('M38 30 H52 V40 H38 Z', I.paper)}
      <rect x="42" y="34" width="6" height="3" fill={C} />
    </G>
  ),
  priest: (
    <G>
      <Person x={32} y={60} s={1.2} kind="man" />
      <rect x="29" y="28" width="6" height="4" fill={I.paper} />
      {L('M32 40 V54 M27 45 H37', { stroke: I.gold, strokeWidth: 3 })}
    </G>
  ),
  police: (
    <G>
      <Person x={32} y={60} s={1.15} />
      {F('M22 22 Q32 14 42 22 L44 26 H20 Z', GR)}
      <rect x="20" y="24" width="24" height="3" fill={GR} />
      {F('M32 38 L36 40 V45 Q32 49 28 45 V40 Z', I.gold)}
    </G>
  ),
  army: (
    <G blob="wide">
      {[12, 24, 36, 48].map((x, i) => (
        <g key={x}>
          <Person x={x + 2} y={60 - (i % 2) * 2} s={0.75} />
          {F(`M${x - 4} ${33 - (i % 2) * 2} Q${x + 2} ${26 - (i % 2) * 2} ${x + 8} ${33 - (i % 2) * 2} Z`, i === 1 ? C : I.ochre)}
        </g>
      ))}
    </G>
  ),
  soldier: (
    <G>
      <Person x={30} y={60} s={1.2} />
      {F('M20 24 Q30 12 40 24 L42 26 H18 Z', C)}
      {L('M44 60 V22')}
    </G>
  ),
  artist: (
    <G blob="wide">
      {FL('M10 36 Q8 18 28 16 Q50 14 52 30 Q54 42 40 40 Q32 39 34 48 Q35 56 24 54 Q12 52 10 36 Z', I.paper)}
      <circle cx="20" cy="30" r="3.5" fill={C} />
      <circle cx="30" cy="24" r="3.5" fill={I.gold} />
      <circle cx="42" cy="27" r="3.5" fill={GR} />
      <circle cx="21" cy="42" r="4" fill={I.desk} stroke={GR} strokeWidth="1.5" />
      {L('M44 54 L58 36', { strokeWidth: 3.5 })}
    </G>
  ),
  author: (
    <G blob="wide">
      {FL('M8 44 Q20 38 32 44 Q44 38 56 44 V54 Q44 48 32 54 Q20 48 8 54 Z', I.paper)}
      {L('M32 44 V54')}
      {F('M52 8 Q38 12 34 32 Q50 28 52 8 Z', C)}
      {T('M34 32 L30 40')}
    </G>
  ),
  manager: (
    <G blob="wide">
      <Person x={20} y={60} s={1} />
      {F('M20 33 L18 38 L20 48 L22 38 Z', C)}
      {L('M34 54 V40 M42 54 V30 M50 54 V20 M30 54 H56')}
    </G>
  ),
  reporter: (
    <G>
      <Person x={26} y={60} s={1.1} />
      {L('M44 40 L38 30')}
      <circle cx="46" cy="44" r="6" fill={C} />
      {T('M50 22 Q56 28 50 34 M54 18 Q62 28 54 38', { opacity: 0.7 })}
    </G>
  ),
  actor: (
    <G>
      {FL('M14 16 H38 V30 Q38 46 26 46 Q14 46 14 30 Z', I.paper)}
      <circle cx="21" cy="26" r="2.5" fill={GR} />
      <circle cx="31" cy="26" r="2.5" fill={GR} />
      {T('M20 36 Q26 41 32 36')}
      {FL('M28 24 H50 V38 Q50 54 39 54 Q28 54 28 38 Z', C)}
      <circle cx="35" cy="34" r="2.2" fill={I.paper} />
      <circle cx="44" cy="34" r="2.2" fill={I.paper} />
      {T('M34 46 Q39 42 44 46', { stroke: I.paper })}
    </G>
  ),
};

export const PEOPLE_GLYPHS: Record<string, ReactNode> = { ...PEOPLE, ...JOBS };

