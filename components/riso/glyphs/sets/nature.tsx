import type { ReactNode } from 'react';
import { G, L, T, F, FL, Ring, INKS as I } from '../kit';
import { Sun } from './basics';

const C = I.coral;
const GR = I.green;
const P = I.paper;

const ANIMALS: Record<string, ReactNode> = {
  dog: (
    <G>
      {F('M14 46 Q14 34 26 34 H42 Q50 34 50 42 V54 H44 V46 H24 V54 H18 V48 Q14 48 14 46 Z', GR)}
      {F('M42 36 Q42 22 50 20 Q58 20 58 30 Q58 36 52 38 Z', GR)}
      {F('M48 20 Q44 16 46 28 Z', C)}
      {L('M14 40 Q8 34 10 28')}
      <circle cx="53" cy="27" r="1.6" fill={I.paper} />
    </G>
  ),
  fish: (
    <G blob="wide">
      {F('M10 32 Q24 16 44 26 L56 18 V46 L44 38 Q24 48 10 32 Z', GR)}
      <circle cx="20" cy="30" r="2.5" fill={I.paper} />
      {T('M30 24 Q34 32 30 40', { stroke: C, strokeWidth: 2.5 })}
    </G>
  ),
  bird: (
    <G>
      {F('M14 40 Q14 24 30 24 Q40 24 44 32 L56 30 L46 38 Q42 50 26 50 Q14 50 14 40 Z', GR)}
      {F('M22 36 Q32 28 40 38 Q30 44 22 36 Z', C)}
      {F('M14 28 L6 30 L14 33 Z', I.gold)}
      <circle cx="20" cy="30" r="1.8" fill={I.paper} />
      {T('M26 50 V56 M34 50 V56')}
    </G>
  ),
  cow: (
    <G blob="wide">
      {FL('M10 28 H44 Q48 28 48 34 V46 H10 Z', I.paper)}
      {F('M18 30 Q26 30 24 38 Q18 42 16 34 Z M34 36 Q42 34 40 44 H32 Z', GR)}
      {L('M14 46 V56 M22 46 V56 M36 46 V56 M44 46 V56')}
      {FL('M44 22 H58 V36 Q58 40 54 40 H48 Q44 40 44 36 Z', I.paper)}
      {F('M48 34 H56 V38 Q56 40 54 40 H50 Q48 40 48 38 Z', C)}
      {L('M46 22 L44 16 M56 22 L58 16')}
    </G>
  ),
  pig: (
    <G>
      {F('M12 38 Q12 22 32 22 Q50 22 50 38 Q50 52 32 52 Q12 52 12 38 Z', C)}
      {F('M48 32 H58 V42 H48 Z', C)}
      <circle cx="54" cy="36" r="1.4" fill={GR} />
      <circle cx="54" cy="40" r="1.4" fill={GR} />
      {L('M18 50 V58 M42 50 V58')}
      {F('M38 22 L44 14 L46 24 Z', C)}
      <circle cx="44" cy="30" r="1.8" fill={GR} />
      {L('M12 36 Q6 34 8 28')}
    </G>
  ),
  mouse: (
    <G blob="ground">
      {F('M14 48 Q14 32 32 30 Q46 30 50 42 L56 46 L48 50 H18 Q14 50 14 48 Z', GR)}
      <circle cx="40" cy="28" r="7" fill={C} />
      <circle cx="50" cy="44" r="1.6" fill={I.paper} />
      {L('M14 46 Q4 46 6 36')}
    </G>
  ),
  horse: (
    <G>
      {F('M10 30 H38 Q42 30 42 34 V42 H10 Z', GR)}
      {F('M36 32 L44 14 Q50 10 54 16 L50 22 L46 22 L42 34 Z', GR)}
      {F('M40 18 Q36 26 38 32 L42 24 Z', C)}
      {L('M14 42 V56 M22 42 V56 M32 42 V56 M40 42 V56 M10 32 Q4 38 6 46')}
    </G>
  ),
  wing: (
    <G blob="wide">
      {F('M8 44 Q16 18 54 14 Q48 22 50 24 Q40 26 44 30 Q34 32 38 36 Q26 38 30 42 Q18 44 8 44 Z', GR)}
      {T('M14 40 Q30 30 50 18', { stroke: C, strokeWidth: 2.5 })}
    </G>
  ),
  animal: (
    <G blob="wide">
      {F('M8 52 Q8 42 18 42 H26 Q32 42 32 48 V56 H8 Z', GR)}
      {F('M26 44 Q26 36 31 36 Q36 36 34 44 Z', GR)}
      {F('M38 50 Q38 30 48 30 Q58 30 58 50 V56 H38 Z', C)}
      {F('M42 32 L40 24 L46 30 M54 32 L56 24 L50 30 Z', C)}
      {F('M18 30 Q14 18 22 14 Q30 18 26 30 Z', I.gold)}
    </G>
  ),
};

const NATURE: Record<string, ReactNode> = {
  sun: <G><Sun r={11} /></G>,
  moon: (
    <G>
      {F('M38 10 A22 22 0 1 0 54 44 A18 18 0 1 1 38 10 Z', I.gold)}
      {F('M38 10 A22 22 0 1 0 54 44 A18 18 0 1 1 38 10 Z', 'none', { stroke: GR, strokeWidth: 2.5 })}
    </G>
  ),
  star: <G>{FL('M32 8 L38.5 24 L56 25 L42.5 36 L47 53 L32 43.5 L17 53 L21.5 36 L8 25 L25.5 24 Z', C)}</G>,
  world: (
    <G>
      <circle cx="32" cy="32" r="21" fill={I.paper} stroke={GR} strokeWidth="3" />
      {F('M16 22 Q24 16 30 22 Q28 30 20 32 Q14 30 16 22 Z M34 36 Q44 30 50 38 Q46 48 38 50 Q32 44 34 36 Z M38 14 Q46 14 48 20 Q42 22 38 14 Z', GR)}
      {T('M11 32 H53', { opacity: 0.5 })}
    </G>
  ),
  'earth-soil': (
    <G blob="ground">
      {F('M6 40 Q20 34 32 38 Q46 34 58 40 V56 H6 Z', '#8A5A3B')}
      <circle cx="16" cy="48" r="2" fill={GR} />
      <circle cx="40" cy="46" r="2.5" fill={GR} />
      <circle cx="50" cy="52" r="1.6" fill={GR} />
      {L('M30 40 V26')}
      {FL('M30 30 Q22 28 20 20 Q28 20 30 30 Z', GR)}
      {FL('M30 28 Q38 26 40 18 Q32 18 30 28 Z', C)}
    </G>
  ),
  sea: (
    <G blob="wide">
      {[22, 32, 42].map((y, i) => (
        <path key={y} d={`M6 ${y} Q13 ${y - 6} 20 ${y} T34 ${y} T48 ${y} T62 ${y}`} stroke={i === 1 ? C : GR} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      ))}
    </G>
  ),
  ocean: (
    <G blob="wide">
      {[18, 26, 34, 42, 50].map((y, i) => (
        <path key={y} d={`M4 ${y} Q11 ${y - 5} 18 ${y} T32 ${y} T46 ${y} T60 ${y}`} stroke={i === 2 ? C : GR} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      ))}
    </G>
  ),
  wave: (
    <G>
      {F('M6 50 Q10 22 34 18 Q52 16 56 30 Q46 24 40 32 Q48 34 46 40 Q36 36 34 50 Z', GR)}
      {T('M40 32 Q44 28 50 30', { stroke: C, strokeWidth: 3 })}
      {L('M4 54 H60')}
    </G>
  ),
  river: (
    <G blob="tall">
      {F('M20 6 Q36 18 26 30 Q16 42 30 58 H44 Q30 42 40 30 Q50 18 34 6 Z', C)}
      {T('M14 10 L8 20 M50 44 L56 54', { opacity: 0.7 })}
    </G>
  ),
  lake: (
    <G blob="wide">
      {FL('M6 40 Q8 30 32 30 Q56 30 58 40 Q56 52 32 52 Q8 52 6 40 Z', '#3C6E9E')}
      {T('M18 40 H30 M36 45 H46', { stroke: P })}
      {F('M12 30 L17 16 L22 30 Z M44 30 L50 12 L56 30 Z', GR)}
      {L('M17 30 V33 M50 30 V33', { strokeWidth: 2 })}
      <circle cx="32" cy="14" r="5" fill={C} />
    </G>
  ),
  mountain: (
    <G blob="wide">
      {F('M4 54 L26 16 L48 54 Z', GR)}
      {F('M26 16 L19 28 L23 26 L26 30 L30 26 L33 28 Z', I.paper)}
      {F('M34 54 L46 32 L60 54 Z', C)}
    </G>
  ),
  hill: (
    <G blob="wide">
      {F('M4 54 Q22 22 40 38 Q50 30 60 54 Z', GR)}
      {Ring(48, 18, 5, { stroke: C })}
    </G>
  ),
  valley: (
    <G blob="wide">
      {F('M2 54 L18 14 L32 46 Z', GR)}
      {F('M32 46 L46 14 L62 54 Z', GR)}
      {F('M24 54 Q30 48 32 46 Q34 48 40 54 Z', C)}
      {F('M2 54 H62 V58 H2 Z', GR)}
    </G>
  ),
  island: (
    <G blob="wide">
      {L('M4 48 Q12 44 20 48 T36 48 T52 48 T64 48')}
      {F('M18 46 Q32 34 46 46 Z', I.gold)}
      {L('M32 40 Q30 26 34 16')}
      {F('M34 16 Q24 12 18 20 Q26 16 34 18 Q40 10 50 14 Q42 14 34 18 Z', GR)}
      <circle cx="35" cy="20" r="2.5" fill={C} />
    </G>
  ),
  beach: (
    <G blob="wide">
      {F('M4 40 Q16 36 28 40 T52 40 L60 40 V56 H4 Z', I.gold)}
      {L('M4 34 Q12 30 20 34 T36 34 T52 34 T64 34')}
      {L('M40 52 L48 22')}
      {F('M32 28 Q48 10 62 26 Z', C)}
    </G>
  ),
  tree: (
    <G blob="tall">
      {F('M28 56 V38 H36 V56 Z', '#8A5A3B')}
      {F('M32 6 Q50 10 50 28 Q50 42 32 42 Q14 42 14 28 Q14 10 32 6 Z', GR)}
      <circle cx="40" cy="22" r="3" fill={C} />
      <circle cx="24" cy="30" r="3" fill={C} />
    </G>
  ),
  forest: (
    <G blob="wide">
      {[12, 30, 48].map((x, i) => (
        <g key={x}>
          {F(`M${x} ${i === 1 ? 8 : 16} L${x + 12} ${46} H${x - 12} Z`, i === 1 ? C : GR)}
          <rect x={x - 2} y="46" width="4" height="10" fill="#8A5A3B" />
        </g>
      ))}
    </G>
  ),
  plant: (
    <G>
      {FL('M20 42 H44 L40 58 H24 Z', C)}
      {L('M32 42 V22')}
      {F('M32 30 Q18 30 16 16 Q30 16 32 30 Z M32 26 Q44 24 48 12 Q34 12 32 26 Z', GR)}
    </G>
  ),
  flower: (
    <G>
      {L('M32 56 V30')}
      {F('M32 44 Q22 44 20 34 Q30 34 32 44 Z', GR)}
      {[0, 72, 144, 216, 288].map((d) => (
        <ellipse key={d} cx="32" cy="14" rx="5.5" ry="8" fill={C} transform={`rotate(${d} 32 22)`} />
      ))}
      <circle cx="32" cy="22" r="4.5" fill={I.gold} />
    </G>
  ),
  root: (
    <G>
      {L('M8 22 H56')}
      {F('M26 22 V8 Q32 4 38 8 V22 Z', GR)}
      {L('M32 22 V40 Q32 48 24 52 M32 32 Q42 36 44 50 M32 40 Q30 46 36 56', { stroke: C })}
    </G>
  ),
  grass: (
    <G blob="ground">
      {L('M8 56 Q10 40 6 30 M16 56 Q16 38 22 26 M26 56 Q24 40 28 22 M36 56 Q38 40 34 26 M44 56 Q44 40 50 30 M54 56 Q52 42 58 34')}
      {L('M28 22 Q30 18 28 16', { stroke: C })}
      {L('M4 56 H60')}
    </G>
  ),
  leaf: (
    <G>
      {F('M12 52 Q10 20 50 12 Q54 48 12 52 Z', GR)}
      {T('M12 52 Q28 34 46 18 M24 40 L24 30 M32 32 L40 34', { stroke: C, strokeWidth: 2.5 })}
    </G>
  ),
  rain: (
    <G>
      {F('M14 30 Q12 18 24 18 Q28 8 40 12 Q52 12 52 24 Q58 28 52 34 H18 Q12 34 14 30 Z', GR)}
      {[18, 30, 42].map((x) => (
        <path key={x} d={`M${x} 40 L${x - 3} 50`} stroke={C} strokeWidth="3.5" strokeLinecap="round" />
      ))}
      {[24, 36, 48].map((x) => (
        <path key={x} d={`M${x} 44 L${x - 3} 54`} stroke={C} strokeWidth="3.5" strokeLinecap="round" />
      ))}
    </G>
  ),
  snow: (
    <G>
      {[0, 60, 120].map((d) => (
        <g key={d} transform={`rotate(${d} 32 30)`}>{L('M32 12 V48')}</g>
      ))}
      <circle cx="32" cy="30" r="3.5" fill={C} />
      {F('M4 56 Q20 48 32 54 Q46 48 60 56 Z', I.paper, { stroke: GR, strokeWidth: 2 })}
    </G>
  ),
  wind: (
    <G blob="wide">
      {L('M6 24 H38 Q46 24 46 17 Q46 11 40 12 M6 34 H50 Q58 34 58 41 Q58 48 50 47 M6 44 H28')}
      {L('M6 24 H20', { stroke: C })}
    </G>
  ),
  air: (
    <G>
      {Ring(22, 28, 7, { strokeWidth: 2.5 })}
      {Ring(40, 22, 5, { strokeWidth: 2.5 })}
      {Ring(38, 42, 9, { stroke: C, strokeWidth: 3 })}
      {Ring(18, 48, 4, { strokeWidth: 2.5 })}
    </G>
  ),
  fire: (
    <G blob="tall">
      {F('M32 6 Q44 20 44 30 Q50 26 48 18 Q58 30 54 42 Q50 56 32 56 Q14 56 12 42 Q10 30 22 22 Q22 30 26 32 Q24 18 32 6 Z', C)}
      {F('M32 30 Q40 38 38 46 Q36 52 32 52 Q26 52 26 46 Q26 38 32 30 Z', I.gold)}
    </G>
  ),
  ice: (
    <G>
      {FL('M14 24 L32 14 L50 24 V44 L32 54 L14 44 Z', '#D8E8EE')}
      {T('M14 24 L32 34 L50 24 M32 34 V54')}
      {T('M22 30 L26 38', { stroke: C, strokeWidth: 2.5 })}
    </G>
  ),
  heat: (
    <G>
      {[18, 32, 46].map((x, i) => (
        <path key={x} d={`M${x} 54 Q${x - 6} 44 ${x} 34 Q${x + 6} 24 ${x} 12`} stroke={i === 1 ? C : GR} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      ))}
    </G>
  ),
  sand: (
    <G blob="ground">
      {F('M4 56 Q18 34 32 44 Q46 32 60 56 Z', I.gold)}
      {[14, 22, 30, 38, 46, 26, 34].map((x, i) => <circle key={i} cx={x} cy={50 - (i % 3) * 2} r="1.2" fill={GR} />)}
      {T('M40 28 L44 18 L48 28 Z', { stroke: C })}
    </G>
  ),
  nature: (
    <G blob="wide">
      {F('M2 54 L20 24 L38 54 Z', GR)}
      <circle cx="46" cy="18" r="7" fill={C} />
      {F('M44 54 V44 Q36 44 38 34 Q46 30 52 36 Q58 34 58 42 Q56 48 50 46 V54 Z', GR)}
    </G>
  ),
  'heaven-sky': (
    <G blob="wide">
      {F('M10 40 Q8 30 18 30 Q20 22 30 24 Q38 18 46 26 Q56 26 54 36 Q58 42 50 44 H16 Q8 44 10 40 Z', I.paper, { stroke: GR, strokeWidth: 2.5 })}
      {[[14, 14], [50, 12], [32, 10]].map(([x, y]) => (
        <path key={`${x}${y}`} d={`M${x} ${y - 4} V${y + 4} M${x - 4} ${y} H${x + 4}`} stroke={C} strokeWidth="2.5" strokeLinecap="round" />
      ))}
    </G>
  ),
};

const MATERIALS: Record<string, ReactNode> = {
  gold: <G>{FL('M8 46 L16 30 H48 L56 46 Z', I.gold)}{T('M16 30 L22 46 M48 30 L42 46')}{F('M44 18 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z', C)}</G>,
  silver: <G>{FL('M8 46 L16 30 H48 L56 46 Z', '#C9CCCF')}{T('M16 30 L22 46 M48 30 L42 46')}</G>,
  copper: <G>{FL('M8 46 L16 30 H48 L56 46 Z', '#B86B3E')}{T('M16 30 L22 46 M48 30 L42 46')}</G>,
  metal: (
    <G>
      {FL('M10 22 H54 V30 H38 V50 H26 V30 H10 Z', '#C9CCCF')}
      {Ring(32, 40, 3, { strokeWidth: 2 })}
    </G>
  ),
  wood: (
    <G blob="wide">
      {FL('M8 24 H52 Q58 32 52 40 H8 Z', '#B9875A')}
      <ellipse cx="52" cy="32" rx="5" ry="8" fill="#D9AE7E" stroke={GR} strokeWidth="2" />
      {Ring(52, 32, 3, { strokeWidth: 1.5 })}
      {T('M14 30 H40 M18 35 H46', { opacity: 0.6 })}
    </G>
  ),
  stone: <G>{FL('M10 46 Q8 28 26 22 Q46 18 54 34 Q58 50 38 52 H18 Q10 52 10 46 Z', '#9A9893')}{T('M22 34 Q28 30 34 34', { stroke: I.paper })}</G>,
  diamond: <G>{FL('M12 26 L22 14 H42 L52 26 L32 54 Z', '#D8E8EE')}{T('M12 26 H52 M22 14 L28 26 L32 54 L36 26 L42 14', { strokeWidth: 1.8 })}{F('M28 26 H36 L32 40 Z', C, { opacity: 0.8 })}</G>,
  glass: <G>{FL('M18 12 H46 L42 54 H22 Z', '#D8E8EE')}{T('M24 20 L26 44', { stroke: I.paper, strokeWidth: 3 })}{F('M20 30 H44 L42 54 H22 Z', C, { opacity: 0.35 })}</G>,
  plastic: <G>{FL('M24 10 H40 V16 Q48 20 48 30 V54 H16 V30 Q16 20 24 16 Z', '#9FD3E6')}{T('M24 32 H40', { stroke: C, strokeWidth: 3 })}</G>,
  clay: <G>{FL('M18 54 Q12 40 20 30 Q16 22 22 18 H42 Q48 22 44 30 Q52 40 46 54 Z', '#B86B3E')}{T('M20 30 H44', { stroke: I.paper })}</G>,
  dust: (
    <G>
      {[[18, 40, 3], [28, 34, 2], [36, 44, 3.5], [44, 30, 2], [24, 48, 2], [48, 46, 2.5], [32, 24, 1.8], [40, 54, 1.6]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={i === 2 ? C : '#9A9893'} />
      ))}
    </G>
  ),
  material: (
    <G blob="wide">
      {FL('M6 40 L12 28 H28 L34 40 Z', I.gold)}
      {FL('M34 40 H58 V28 Q54 34 50 28 Q46 34 42 28 Q38 34 34 28 Z', '#B9875A')}
      {FL('M14 52 Q12 44 22 42 Q34 42 34 50 Q32 56 24 56 Q16 56 14 52 Z', '#9A9893')}
      {FL('M38 44 L44 52 L50 44 L44 40 Z', C)}
    </G>
  ),
};

export const NATURE_GLYPHS: Record<string, ReactNode> = { ...ANIMALS, ...NATURE, ...MATERIALS };
