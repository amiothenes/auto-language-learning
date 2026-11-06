import type { ReactNode } from 'react';
import { G, L, T, F, FL, Ring, Box, Person, INKS as I } from '../kit';

const C = I.coral;
const GR = I.green;
const P = I.paper;

/** A building front with a roof style and an identifying sign. */
function Building({
  roof = 'gable',
  sign,
  wide = false,
  fill = P,
}: {
  roof?: 'gable' | 'flat' | 'dome' | 'columns' | 'tower';
  sign?: ReactNode;
  wide?: boolean;
  fill?: string;
}) {
  const x0 = wide ? 8 : 14;
  const x1 = wide ? 56 : 50;
  return (
    <G blob={wide ? 'wide' : 'circle'}>
      {roof === 'gable' && F(`M${x0 - 4} 28 L32 10 L${x1 + 4} 28 Z`, GR)}
      {roof === 'flat' && F(`M${x0 - 2} 18 H${x1 + 2} V24 H${x0 - 2} Z`, GR)}
      {roof === 'dome' && F(`M${x0 + 4} 26 Q${x0 + 4} 10 32 10 Q${x1 - 4} 10 ${x1 - 4} 26 Z`, GR)}
      {roof === 'columns' && F(`M${x0 - 4} 24 L32 12 L${x1 + 4} 24 Z`, GR)}
      {roof === 'tower' && F('M26 24 V10 L32 4 L38 10 V24 Z', GR)}
      {FL(`M${x0} ${roof === 'flat' ? 24 : 26} H${x1} V54 H${x0} Z`, fill)}
      {roof === 'columns' && T(`M${x0 + 6} 28 V52 M${x0 + 14} 28 V52 M${x1 - 14} 28 V52 M${x1 - 6} 28 V52`)}
      {sign}
      {L(`M${x0 - 6} 55 H${x1 + 6}`)}
    </G>
  );
}

const Door = (x = 28, w = 8) => <rect x={x} y="42" width={w} height="12" fill={GR} />;

const PLACES: Record<string, ReactNode> = {
  'place-location': (
    <G>
      {F('M32 56 Q14 34 14 24 Q14 8 32 8 Q50 8 50 24 Q50 34 32 56 Z', C)}
      <circle cx="32" cy="24" r="7" fill={P} />
    </G>
  ),
  country: (
    <G>
      {FL('M14 16 Q24 10 30 16 Q40 12 48 20 Q54 30 46 38 Q48 48 38 52 Q26 56 20 46 Q10 40 14 30 Q8 22 14 16 Z', P)}
      {F('M30 30 l2 4.5 5 .5 -3.8 3.3 1.2 5 -4.4 -2.6 -4.4 2.6 1.2 -5 -3.8 -3.3 5 -.5 z', C)}
    </G>
  ),
  city: (
    <G blob="wide">
      {FL('M6 54 V30 H18 V54', P)}
      {FL('M18 54 V14 H32 V54', C)}
      {FL('M32 54 V24 H44 V54', P)}
      {FL('M44 54 V34 H58 V54', P)}
      {[[22, 20], [27, 20], [22, 28], [27, 28], [22, 36], [27, 36]].map(([x, y]) => <rect key={`${x}${y}`} x={x} y={y} width="3" height="4" fill={P} />)}
      {L('M2 54 H62')}
    </G>
  ),
  town: (
    <G blob="wide">
      {FL('M6 54 V38 L14 30 L22 38 V54', P)}
      {FL('M22 54 V30 L32 20 L42 30 V54', C)}
      {FL('M42 54 V38 L50 30 L58 38 V54', P)}
      {L('M2 54 H62')}
    </G>
  ),
  university: <Building roof="columns" wide sign={<>{F('M24 38 L32 33 L40 38 L32 43 Z', C)}{T('M39 38.5 V43')}</>} />,
  street: (
    <G blob="tall">
      {F('M18 58 L28 6 H36 L46 58 Z', GR)}
      {[50, 38, 28, 20, 13].map((y, i) => <rect key={y} x={31.4 - i * 0.1} y={y} width={1.6 + (4 - i) * 0.5} height={3 + (4 - i) * 0.6} fill={i === 0 ? C : P} />)}
    </G>
  ),
  school: <Building roof="gable" sign={<>{Door()}<circle cx="32" cy="22" r="3" fill={C} />{Box(18, 32, 8, 6, '#D8E8EE', 0)}{Box(38, 32, 8, 6, '#D8E8EE', 0)}</>} />,
  market: (
    <G blob="wide">
      {[0, 1, 2, 3].map((i) => <g key={i}>{F(`M${8 + i * 12} 18 H${20 + i * 12} V26 Q${14 + i * 12} 32 ${8 + i * 12} 26 Z`, i % 2 ? P : C, { stroke: GR, strokeWidth: 1.5 })}</g>)}
      {L('M8 26 V54 M56 26 V54 M8 54 H56 M8 42 H56')}
      <circle cx="18" cy="38" r="3.5" fill={C} />
      <circle cx="26" cy="38" r="3.5" fill={I.gold} />
      <circle cx="40" cy="38" r="3.5" fill={GR} />
    </G>
  ),
  space: (
    <G>
      <circle cx="32" cy="32" r="24" fill={GR} />
      <circle cx="26" cy="36" r="9" fill={C} />
      <ellipse cx="26" cy="36" rx="15" ry="4" fill="none" stroke={I.gold} strokeWidth="2" transform="rotate(-20 26 36)" />
      {[[44, 18], [48, 40], [18, 18], [40, 50]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" fill={P} />)}
    </G>
  ),
  church: <Building roof="tower" sign={<>{L('M32 4 V-2', { strokeWidth: 0 })}{F('M14 26 L32 16 L50 26 Z', GR)}{Door(28, 8)}{L('M32 30 V40 M28 34 H36', { stroke: C })}</>} />,
  bank: <Building roof="columns" wide sign={<circle cx="32" cy="18" r="3.5" fill={C} />} />,
  office: <Building roof="flat" sign={<>{[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={18 + c * 7.5} y={29 + r * 8} width="4.5" height="5" fill={r === 1 && c === 2 ? C : '#D8E8EE'} stroke={GR} strokeWidth="1" />))}</>} />,
  club: <Building roof="flat" sign={<>{Door()}{F('M18 30 H46 V38 H18 Z', C)}<circle cx="24" cy="34" r="1.6" fill={P} /><circle cx="32" cy="34" r="1.6" fill={P} /><circle cx="40" cy="34" r="1.6" fill={P} /></>} />,
  hospital: <Building roof="flat" sign={<>{Door()}<rect x="29" y="28" width="6" height="12" fill={C} /><rect x="26" y="31" width="12" height="6" fill={C} /></>} />,
  'ground-floor': (
    <G blob="ground">
      {F('M4 42 H60 V56 H4 Z', '#B9875A')}
      {T('M4 49 H60 M18 42 V56 M34 42 V56 M50 42 V56', { stroke: GR })}
      <Person x={32} y={42} s={0.75} fill={C} />
    </G>
  ),
  building: <Building roof="flat" sign={<>{[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={18 + c * 7.5} y={29 + r * 8} width="4.5" height="5" fill="#D8E8EE" stroke={GR} strokeWidth="1" />))}<rect x="28" y="52" width="8" height="2" fill={C} /></>} />,
  court: <Building roof="columns" wide sign={<>{L('M32 14 V22 M26 16 H38', { stroke: C, strokeWidth: 2.5 })}</>} />,
  park: (
    <G blob="wide">
      {F('M4 48 H60 V56 H4 Z', GR)}
      {F('M14 48 V38 H18 V48 Z M12 36 Q4 30 10 22 Q16 14 22 22 Q28 30 20 36 Z', GR)}
      {L('M30 44 H54 M32 44 V50 M52 44 V50 M30 38 H54')}
      {F('M42 10 A6 6 0 1 0 42 22 A6 6 0 1 0 42 10 Z', C)}
    </G>
  ),
  theater: (
    <G blob="wide">
      {L('M6 10 H58')}
      {F('M6 10 H28 Q22 30 26 54 H6 Z', C)}
      {F('M58 10 H36 Q42 30 38 54 H58 Z', C)}
      {L('M4 54 H60')}
      <circle cx="32" cy="34" r="3" fill={I.gold} />
    </G>
  ),
  station: (
    <G blob="wide">
      {F('M6 22 H58 V26 H6 Z', GR)}
      {L('M12 26 V52 M52 26 V52 M4 56 H60')}
      {FL('M20 34 H44 Q48 34 48 38 V50 H16 V38 Q16 34 20 34 Z', C)}
      <rect x="20" y="38" width="8" height="5" fill={P} />
      <rect x="32" y="38" width="8" height="5" fill={P} />
      {Ring(32, 14, 5, { strokeWidth: 2 })}
    </G>
  ),
  hotel: <Building roof="flat" sign={<>{Door()}{F('M20 28 H44 V35 H20 Z', C)}{[0, 1].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={19 + c * 10} y={38 + r * 8} width="5" height="4" fill="#D8E8EE" stroke={GR} strokeWidth="1" />))}</>} />,
  airport: (
    <G blob="wide">
      {F('M6 54 V44 H36 V54 Z', GR)}
      {L('M48 54 V30')}
      {FL('M42 22 H54 V30 H42 Z', '#D8E8EE')}
      {L('M2 56 H62')}
      <g transform="rotate(-20 24 22)">
        {F('M8 22 Q8 19 12 19 H38 Q42 19 42 22 Q42 25 38 25 H12 Q8 25 8 22 Z', C)}
        {F('M22 19 L28 9 H32 L30 19 Z M22 25 L28 35 H32 L30 25 Z M10 19 L8 14 H12 L14 19 Z', C)}
      </g>
    </G>
  ),
  'store-shop': (
    <G>
      {[0, 1, 2, 3].map((i) => <g key={i}>{F(`M${12 + i * 10} 16 H${22 + i * 10} V24 Q${17 + i * 10} 30 ${12 + i * 10} 24 Z`, i % 2 ? P : C, { stroke: GR, strokeWidth: 1.5 })}</g>)}
      {FL('M14 26 H50 V54 H14 Z', P)}
      {Door(36, 10)}
      {Box(18, 32, 12, 10, '#D8E8EE', 0)}
    </G>
  ),
  bridge: (
    <G blob="wide">
      {L('M4 30 H60')}
      {F('M4 30 H60 V36 H4 Z', GR)}
      {L('M10 36 Q32 14 54 36', { strokeWidth: 0 })}
      {F('M12 36 Q32 56 52 36 Z', C)}
      {T('M4 50 Q12 46 20 50 T36 50 T52 50 T64 50', { opacity: 0.7 })}
    </G>
  ),
  library: <Building roof="columns" wide sign={<>{[20, 25, 30, 35, 40].map((x, i) => <rect key={x} x={x} y={34 + (i % 2)} width="4" height={16 - (i % 2)} fill={i === 2 ? C : GR} />)}</>} />,
  room: (
    <G>
      {F('M8 44 H56 V56 H8 Z', '#B9875A')}
      {FL('M8 10 H56 V44 H8 Z', P)}
      {Box(36, 16, 14, 14, '#D8E8EE', 0)}
      {L('M43 16 V30 M36 23 H50', { strokeWidth: 1.8 })}
      {F('M14 34 H30 V44 H14 Z', C)}
      {L('M8 44 H56')}
    </G>
  ),
  bar: (
    <G blob="wide">
      {F('M4 40 H60 V46 H4 Z', GR)}
      {L('M10 46 V58 M54 46 V58')}
      {FL('M14 24 H26 L24 40 H16 Z', I.gold)}
      {FL('M36 18 H48 Q48 30 42 31 Q36 30 36 18 Z', '#8E2B3E')}
      {L('M42 31 V40')}
    </G>
  ),
  restaurant: (
    <G blob="wide">
      <ellipse cx="32" cy="38" rx="16" ry="10" fill={P} stroke={GR} strokeWidth="3" />
      <ellipse cx="32" cy="38" rx="8" ry="5" fill={C} />
      {L('M8 22 V34 M5 22 V28 Q5 32 8 32 Q11 32 11 28 V22 M8 34 V56')}
      {L('M56 22 Q50 30 56 36 V56')}
    </G>
  ),
  camp: (
    <G blob="wide">
      {F('M8 52 L28 14 L48 52 Z', C)}
      {F('M28 14 L22 52 H34 Z', GR)}
      {L('M24 12 L28 14 L32 12')}
      {F('M50 52 Q46 44 52 40 Q54 46 56 44 Q60 48 54 52 Z', I.gold)}
      {L('M4 52 H60')}
    </G>
  ),
  apartment: <Building roof="flat" sign={<>{[0, 1, 2].map((r) => [0, 1].map((c) => <g key={`${r}${c}`}><rect x={19 + c * 16} y={29 + r * 8} width="10" height="5" fill={r === 1 && c === 0 ? C : '#D8E8EE'} stroke={GR} strokeWidth="1" />{T(`M${18 + c * 16} ${35 + r * 8} H${30 + c * 16}`, { strokeWidth: 1.5 })}</g>))}</>} />,
  farm: (
    <G blob="wide">
      {FL('M8 54 V30 L22 20 L36 30 V54 Z', C)}
      {T('M14 54 V40 H30 V54 M14 40 L30 54 M30 40 L14 54', { stroke: P })}
      {FL('M40 54 V24 Q40 16 47 16 Q54 16 54 24 V54 Z', P)}
      {L('M2 54 H62')}
    </G>
  ),
};

const TRANSPORT: Record<string, ReactNode> = {
  car: (
    <G blob="wide">
      {F('M6 42 V34 Q6 30 10 30 L16 20 Q18 18 22 18 H40 Q44 18 46 20 L52 30 Q58 30 58 36 V42 Z', C)}
      {F('M20 22 H30 V30 H15 Z M34 22 H42 L48 30 H34 Z', '#D8E8EE')}
      <circle cx="18" cy="44" r="6" fill={GR} />
      <circle cx="46" cy="44" r="6" fill={GR} />
      <circle cx="18" cy="44" r="2" fill={P} />
      <circle cx="46" cy="44" r="2" fill={P} />
    </G>
  ),
  bus: (
    <G blob="wide">
      {FL('M6 16 H52 Q58 16 58 22 V46 H6 Z', I.gold)}
      {[10, 20, 30, 40].map((x) => <rect key={x} x={x} y="21" width="7" height="9" fill="#D8E8EE" stroke={GR} strokeWidth="1.2" />)}
      {F('M50 21 H56 V34 H50 Z', '#D8E8EE')}
      <circle cx="16" cy="48" r="5" fill={GR} />
      <circle cx="46" cy="48" r="5" fill={GR} />
      {T('M6 36 H58', { stroke: C, strokeWidth: 3 })}
    </G>
  ),
  truck: (
    <G blob="wide">
      {FL('M4 18 H38 V44 H4 Z', P)}
      {F('M38 26 H50 L58 34 V44 H38 Z', C)}
      {F('M42 29 H49 L54 34 H42 Z', '#D8E8EE')}
      <circle cx="14" cy="46" r="5" fill={GR} />
      <circle cx="48" cy="46" r="5" fill={GR} />
    </G>
  ),
  train: (
    <G blob="wide">
      {FL('M10 14 H46 Q54 14 54 22 V46 H10 Z', C)}
      <rect x="16" y="20" width="12" height="10" fill="#D8E8EE" />
      <rect x="34" y="20" width="12" height="10" fill="#D8E8EE" />
      <circle cx="20" cy="48" r="4.5" fill={GR} />
      <circle cx="44" cy="48" r="4.5" fill={GR} />
      {L('M4 56 H60')}
      {T('M10 38 H54', { stroke: P })}
    </G>
  ),
  plane: <G>{F('M6 30 L28 32 L40 12 L46 12 L40 33 L54 34 Q60 35 60 38 Q60 41 54 41 L40 42 L46 60 L40 60 L28 43 L6 45 L10 38 Z', C)}{F('M6 30 L12 26 L16 31 Z M6 45 L12 49 L16 44 Z', GR)}</G>,
  boat: (
    <G blob="wide">
      {F('M8 40 H56 L48 52 H16 Z', GR)}
      {L('M32 40 V10')}
      {F('M34 12 L50 36 H34 Z', C)}
      {F('M30 18 L16 36 H30 Z', P, { stroke: GR, strokeWidth: 2 })}
      {T('M4 56 Q12 52 20 56 T36 56 T52 56 T64 56', { opacity: 0.7 })}
    </G>
  ),
  ship: (
    <G blob="wide">
      {F('M4 38 H60 L52 52 H12 Z', GR)}
      {FL('M16 26 H46 V38 H16 Z', P)}
      {F('M24 14 H32 V26 H24 Z M36 18 H42 V26 H36 Z', C)}
      {T('M4 58 Q12 54 20 58 T36 58 T52 58 T64 58', { opacity: 0.7 })}
    </G>
  ),
  bicycle: (
    <G blob="wide">
      {Ring(16, 40, 10)}
      {Ring(48, 40, 10)}
      {L('M16 40 L26 24 H42 L48 40 M26 24 L32 40 L42 24 M32 40 H16', { strokeWidth: 2.6, stroke: C })}
      {L('M24 20 H30 M42 24 L40 18 H46')}
    </G>
  ),
  engine: (
    <G blob="wide">
      {FL('M14 22 H44 V48 H14 Z', '#C9CCCF')}
      {F('M44 30 H54 V40 H44 Z', GR)}
      {F('M8 30 H14 V40 H8 Z', GR)}
      {L('M22 22 V14 H36 V22')}
      {T('M20 30 H38 M20 36 H38 M20 42 H38', { stroke: C })}
    </G>
  ),
  gasoline: (
    <G blob="tall">
      {FL('M14 12 H38 V56 H14 Z', C)}
      <rect x="18" y="16" width="16" height="12" fill={P} />
      {L('M38 20 H44 Q48 20 48 24 V46 Q48 50 52 50 Q54 50 54 46 V28 L50 24')}
      {F('M26 36 Q32 44 26 48 Q20 44 26 36 Z', P)}
    </G>
  ),
  ticket: (
    <G blob="wide">
      {FL('M6 20 H58 V28 Q54 32 58 36 V44 H6 V36 Q10 32 6 28 Z', C)}
      {T('M44 20 V44', { stroke: P, strokeDasharray: '3 3' })}
      {T('M14 28 H36 M14 36 H30', { stroke: P })}
    </G>
  ),
  tire: (
    <G>
      <circle cx="32" cy="32" r="22" fill={GR} />
      <circle cx="32" cy="32" r="10" fill={P} />
      <circle cx="32" cy="32" r="4" fill={C} />
      {T('M32 10 V14 M32 50 V54 M10 32 H14 M50 32 H54 M16 16 L19 19 M45 45 L48 48 M48 16 L45 19 M19 45 L16 48', { stroke: P })}
    </G>
  ),
  transportation: (
    <G blob="wide">
      {F('M4 36 V30 L10 22 H24 L30 30 V36 Z', C)}
      <circle cx="10" cy="38" r="3.5" fill={GR} />
      <circle cx="24" cy="38" r="3.5" fill={GR} />
      {F('M34 30 L46 31 L52 20 L55 20 L52 31 L60 32 Q62 33 60 34 L52 35 L55 46 L52 46 L46 36 L34 37 Z', GR)}
      {F('M14 50 H44 L40 56 H18 Z', GR)}
      {L('M29 50 V42 L38 48 H29', { strokeWidth: 2 })}
    </G>
  ),
};

export const PLACES_GLYPHS: Record<string, ReactNode> = { ...PLACES, ...TRANSPORT };
