import type { ReactNode } from 'react';
import { G, L, T, F, FL, Ring, Box, INKS as I } from '../kit';

const C = I.coral;
const GR = I.green;
const P = I.paper;

const HOME: Record<string, ReactNode> = {
  chair: (
    <G>
      {FL('M18 8 H28 V36 H18 Z', I.paper)}
      {F('M16 34 H46 V40 H16 Z', C)}
      {L('M19 40 V58 M43 40 V58 M19 50 H43')}
      {T('M18 16 H28 M18 24 H28')}
    </G>
  ),
  bed: (
    <G blob="wide">
      {L('M6 30 V54 M58 40 V54 M6 46 H58')}
      <rect x="6" y="38" width="52" height="8" fill={GR} />
      <rect x="10" y="32" width="14" height="6" rx="2" fill={P} stroke={GR} strokeWidth="2" />
      {F('M26 30 H58 V38 H26 Z', C)}
    </G>
  ),
  dream: (
    <G>
      {F('M8 50 H40 Q34 46 34 40 H8 Z', GR)}
      <circle cx="14" cy="36" r="5" fill={GR} />
      {FL('M30 20 Q30 10 40 10 Q44 4 50 8 Q58 8 58 16 Q60 24 52 26 H36 Q30 26 30 20 Z', P)}
      {F('M46 12 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5 z', C)}
      <circle cx="28" cy="32" r="2" fill={GR} />
      <circle cx="24" cy="38" r="1.4" fill={GR} />
    </G>
  ),
  window: (
    <G>
      {Box(14, 10, 36, 44, '#D8E8EE')}
      {L('M32 10 V54 M14 32 H50')}
      {F('M17 13 H29 V29 H17 Z', C, { opacity: 0.5 })}
    </G>
  ),
  bedroom: (
    <G blob="wide">
      {L('M4 14 H60 M4 14 V56 M60 14 V56')}
      {Box(40, 20, 12, 12, '#D8E8EE')}
      <rect x="8" y="42" width="34" height="8" fill={GR} />
      {F('M18 38 H42 V42 H18 Z', C)}
      {L('M8 36 V56 M42 46 V56')}
    </G>
  ),
  kitchen: (
    <G>
      {Box(10, 28, 44, 26, P)}
      {L('M32 28 V54 M10 38 H54')}
      {Ring(20, 22, 6)}
      {Ring(40, 22, 6, { stroke: C })}
      {L('M8 22 H56', { strokeWidth: 0 })}
    </G>
  ),
  bathroom: (
    <G blob="wide">
      {FL('M6 32 H58 V38 Q58 52 44 52 H20 Q6 52 6 38 Z', P)}
      {L('M14 52 L12 58 M50 52 L52 58 M10 32 V14 Q10 8 16 8 Q20 8 20 14')}
      {[[30, 26], [38, 22], [44, 28]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="3.5" fill="none" stroke={C} strokeWidth="2" />
      ))}
    </G>
  ),
  soap: <G>{FL('M12 34 Q12 24 22 24 H42 Q52 24 52 34 V40 Q52 48 42 48 H22 Q12 48 12 40 Z', C)}{[[22, 18], [34, 14], [44, 18]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="3" fill="none" stroke={GR} strokeWidth="2" />)}</G>,
  pencil: <G>{F('M10 46 L40 16 L48 24 L18 54 Z', I.gold)}{F('M10 46 L18 54 L8 56 Z', '#D9AE7E')}{F('M7 55 L9 52 L11 54 Z', GR)}{F('M40 16 L44 12 L52 20 L48 24 Z', C)}</G>,
  pen: <G>{F('M12 48 L44 16 L50 22 L18 54 Z', GR)}{F('M12 48 L18 54 L8 58 Z', C)}{T('M44 16 L36 10', { strokeWidth: 3 })}</G>,
  notebook: (
    <G blob="tall">
      {Box(16, 8, 34, 48, P)}
      {L('M22 8 V56', { stroke: C })}
      {T('M28 20 H44 M28 28 H44 M28 36 H40', { opacity: 0.7 })}
    </G>
  ),
  photograph: (
    <G>
      <rect x="10" y="12" width="44" height="40" rx="2" fill={P} stroke={GR} strokeWidth="3" transform="rotate(-6 32 32)" />
      <g transform="rotate(-6 32 32)">
        {F('M15 44 L26 30 L34 38 L40 32 L49 44 Z', GR)}
        <circle cx="42" cy="22" r="4" fill={C} />
      </g>
    </G>
  ),
  page: (
    <G blob="tall">
      {FL('M16 8 H40 L50 18 V56 H16 Z', P)}
      {T('M40 8 V18 H50')}
      {T('M22 28 H44 M22 35 H44 M22 42 H36')}
      {T('M22 21 H34', { stroke: C, strokeWidth: 3 })}
    </G>
  ),
  paper: <G>{FL('M14 12 H50 V52 H14 Z', P)}{F('M40 52 L50 42 V52 Z', C)}</G>,
  letter: (
    <G blob="wide">
      {Box(8, 16, 48, 32, P)}
      {L('M8 18 L32 36 L56 18')}
      <rect x="44" y="20" width="8" height="9" fill={C} />
    </G>
  ),
  note: <G>{FL('M14 12 H50 V40 L38 52 H14 Z', I.gold)}{T('M38 52 V40 H50')}{T('M20 22 H42 M20 30 H36', { stroke: C, strokeWidth: 2.5 })}</G>,
  wall: (
    <G blob="wide">
      {[0, 1, 2, 3].map((r) => (
        <g key={r}>
          {[0, 1, 2].map((c) => (
            <rect key={c} x={6 + c * 18 + (r % 2) * 9 - (r % 2 && c === 2 ? 0 : 0)} y={14 + r * 10} width="16" height="8" fill={r === 1 && c === 1 ? C : '#B86B3E'} stroke={GR} strokeWidth="1.5" />
          ))}
        </g>
      ))}
    </G>
  ),
  'ceiling-roof': (
    <G blob="wide">
      {F('M4 34 L32 10 L60 34 Z', C)}
      {L('M10 34 V56 H54 V34')}
      {Box(26, 40, 12, 16, P, 0)}
    </G>
  ),
  pool: (
    <G blob="wide">
      {FL('M6 26 H58 V50 H6 Z', '#9FD3E6')}
      {T('M12 34 Q18 30 24 34 T36 34 T48 34 M12 42 Q18 38 24 42 T36 42 T48 42', { stroke: P })}
      {L('M44 26 V12 Q44 8 48 8 M52 26 V12 Q52 8 56 8', { stroke: C })}
    </G>
  ),
  lock: (
    <G>
      {L('M22 30 V22 Q22 12 32 12 Q42 12 42 22 V30')}
      {FL('M16 30 H48 V54 H16 Z', I.gold)}
      <circle cx="32" cy="40" r="3.5" fill={GR} />
      {L('M32 42 V48')}
    </G>
  ),
  telephone: (
    <G>
      {FL('M14 30 Q14 22 22 22 H42 Q50 22 50 30 L54 50 H10 Z', C)}
      {F('M10 18 Q32 6 54 18 V24 H44 V20 H20 V24 H10 Z', GR)}
      {Ring(32, 40, 6, { stroke: P })}
    </G>
  ),
  garden: (
    <G blob="ground">
      {L('M4 56 H60')}
      {[12, 26, 40, 52].map((x, i) => (
        <g key={x}>
          {L(`M${x} 56 V${i % 2 ? 40 : 44}`)}
          <circle cx={x} cy={i % 2 ? 36 : 40} r="5" fill={i % 2 ? C : I.gold} />
        </g>
      ))}
      {T('M4 50 H60', { opacity: 0.4 })}
    </G>
  ),
  yard: (
    <G blob="wide">
      {F('M8 32 L20 22 L32 32 V46 H8 Z', P, { stroke: GR, strokeWidth: 2.5 })}
      {F('M4 46 H60 V56 H4 Z', GR)}
      {[38, 44, 50, 56].map((x) => (
        <path key={x} d={`M${x} 46 V32 L${x + 2} 29 L${x + 4} 32 V46`} stroke={C} strokeWidth="2" fill="none" />
      ))}
    </G>
  ),
  needle: <G>{L('M12 52 L50 14', { strokeWidth: 3.5 })}{Ring(47, 17, 3, { strokeWidth: 2 })}{T('M47 17 Q60 30 40 44 Q24 54 30 60', { stroke: C, strokeWidth: 2.5 })}</G>,
  bag: (
    <G>
      {FL('M12 26 H52 L48 56 H16 Z', C)}
      {L('M22 26 V20 Q22 10 32 10 Q42 10 42 20 V26')}
    </G>
  ),
  box: (
    <G>
      {FL('M10 24 L32 14 L54 24 V46 L32 56 L10 46 Z', '#D9AE7E')}
      {T('M10 24 L32 34 L54 24 M32 34 V56')}
      {L('M21 19 L43 29', { stroke: C })}
    </G>
  ),
  gift: (
    <G>
      {FL('M12 28 H52 V54 H12 Z', C)}
      {FL('M10 22 H54 V30 H10 Z', C)}
      {L('M32 22 V54', { stroke: I.gold, strokeWidth: 4 })}
      {L('M32 22 Q22 8 18 18 Q20 22 32 22 Q42 8 46 18 Q44 22 32 22', { stroke: I.gold })}
    </G>
  ),
  card: (
    <G blob="wide">
      {Box(8, 18, 48, 30, P, 3)}
      <rect x="14" y="24" width="10" height="8" rx="1.5" fill={I.gold} />
      {T('M14 40 H40')}
      <circle cx="46" cy="40" r="4" fill={C} />
    </G>
  ),
  ring: (
    <G>
      <ellipse cx="32" cy="40" rx="16" ry="12" fill="none" stroke={I.gold} strokeWidth="5" />
      {FL('M26 26 L32 16 L38 26 L32 30 Z', C)}
    </G>
  ),
  tool: (
    <G>
      {L('M16 50 L40 26', { strokeWidth: 5 })}
      {F('M36 18 Q38 8 50 10 L44 16 L48 20 L54 14 Q56 26 46 28 Z', C)}
      {L('M44 50 L22 28', { strokeWidth: 0 })}
    </G>
  ),
  paint: (
    <G>
      {FL('M14 26 H44 V54 H14 Z', P)}
      {F('M14 26 H44 V34 Q36 38 30 34 Q22 40 14 34 Z', C)}
      {L('M44 30 Q56 30 54 20 L46 14')}
      {F('M42 10 L50 18 L46 22 L38 14 Z', GR)}
    </G>
  ),
};

const FOOD: Record<string, ReactNode> = {
  food: (
    <G blob="wide">
      {FL('M6 40 H58 Q56 54 32 54 Q8 54 6 40 Z', P)}
      <circle cx="24" cy="34" r="7" fill={C} />
      <circle cx="38" cy="32" r="8" fill={I.gold} />
      {F('M44 36 Q46 24 54 26 Q52 36 44 36 Z', GR)}
    </G>
  ),
  bread: <G blob="wide">{FL('M8 40 Q8 22 32 22 Q56 22 56 40 V48 H8 Z', '#D9AE7E')}{T('M20 28 L24 38 M30 26 L34 36 M40 28 L44 38', { stroke: C, strokeWidth: 2.5 })}</G>,
  egg: <G>{FL('M32 8 Q48 8 50 32 Q50 54 32 54 Q14 54 14 32 Q16 8 32 8 Z', P)}<circle cx="32" cy="36" r="9" fill={I.gold} /></G>,
  cheese: <G blob="wide">{FL('M6 46 L52 22 L58 34 V46 Z', I.gold)}{F('M52 22 L58 34 H6 Z', '#F2D272')}<circle cx="24" cy="40" r="3" fill={C} /><circle cx="40" cy="38" r="2.5" fill={C} /><circle cx="48" cy="42" r="2" fill={C} /></G>,
  soup: <G blob="wide">{FL('M8 30 H56 Q54 52 32 52 Q10 52 8 30 Z', C)}{T('M24 22 Q20 16 24 10 M32 22 Q28 16 32 10 M40 22 Q36 16 40 10')}{L('M4 30 H60')}</G>,
  cake: (
    <G blob="wide">
      {FL('M10 32 H54 V54 H10 Z', '#F2D7DC')}
      {F('M10 32 H54 V38 Q48 42 42 38 Q36 42 30 38 Q24 42 18 38 Q14 40 10 38 Z', C)}
      {L('M32 32 V20')}
      {F('M32 12 Q36 16 32 20 Q28 16 32 12 Z', I.gold)}
    </G>
  ),
  chicken: <G>{FL('M18 46 Q8 38 14 26 Q22 14 36 18 Q46 22 44 34 L50 42 Q46 48 38 46 Q28 52 18 46 Z', '#D9AE7E')}{L('M46 42 L56 52 M52 52 L58 48', { stroke: GR })}<circle cx="57" cy="52" r="3" fill={P} stroke={GR} strokeWidth="2" /></G>,
  'beef-meat': <G blob="wide">{FL('M10 38 Q8 22 26 20 Q46 18 54 30 Q58 44 40 48 Q20 54 10 38 Z', C)}{FL('M30 32 Q30 28 34 28 Q38 28 38 32 Q38 36 34 36 Q30 36 30 32 Z', P)}{T('M16 36 Q24 30 26 40', { stroke: P })}</G>,
  apple: (
    <G>
      {F('M32 20 Q18 12 12 28 Q8 48 22 54 Q28 56 32 52 Q36 56 42 54 Q56 48 52 28 Q46 12 32 20 Z', C)}
      {L('M32 20 Q32 12 36 8')}
      {F('M34 14 Q42 6 48 12 Q40 18 34 14 Z', GR)}
    </G>
  ),
  banana: <G blob="wide">{F('M8 22 Q12 50 40 52 Q54 52 58 44 Q42 46 30 38 Q18 30 14 18 Z', I.gold)}{F('M8 22 L14 18 L12 14 L6 16 Z', GR)}</G>,
  orange: <G>{F('M32 12 Q52 12 52 34 Q52 54 32 54 Q12 54 12 34 Q12 12 32 12 Z', '#E38B3A')}{F('M32 12 Q38 4 44 8 Q38 14 32 12 Z', GR)}<circle cx="24" cy="28" r="1.4" fill={P} /><circle cx="40" cy="38" r="1.4" fill={P} /></G>,
  lemon: <G>{F('M8 34 Q10 18 32 16 Q54 18 56 34 Q54 50 32 52 Q10 50 8 34 Z', '#E3D341')}{T('M6 34 L10 34 M54 34 L58 34')}{T('M24 26 Q32 22 40 26', { stroke: P })}</G>,
  corn: <G blob="tall">{F('M24 14 Q32 4 40 14 V44 Q32 50 24 44 Z', I.gold)}{[18, 24, 30, 36].map((y) => <path key={y} d={`M25 ${y} H39`} stroke={'#C29A2A'} strokeWidth="1.5" />)}{F('M24 44 Q12 40 16 24 Q22 40 30 48 Z M40 44 Q52 40 48 24 Q42 40 34 48 Z', GR)}</G>,
  rice: <G blob="wide">{FL('M8 34 H56 Q54 52 32 52 Q10 52 8 34 Z', C)}{F('M14 34 Q20 22 32 22 Q44 22 50 34 Z', P, { stroke: GR, strokeWidth: 2 })}{L('M40 14 L28 30 M48 16 L34 30', { strokeWidth: 2.5 })}</G>,
  oil: <G blob="tall">{FL('M26 8 H38 V16 L44 24 V56 H20 V24 L26 16 Z', I.gold)}{F('M30 32 Q36 40 30 46 Q24 40 30 32 Z', C)}</G>,
  seed: <G>{[[22, 30], [38, 24], [30, 42], [44, 40]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="6" ry="8" fill={i === 1 ? C : '#B9875A'} transform={`rotate(${i * 35} ${x} ${y})`} />)}</G>,
  knife: <G>{F('M10 50 L40 20 Q50 12 54 14 Q52 22 44 30 L20 54 Z', '#C9CCCF', { stroke: GR, strokeWidth: 2.5, strokeLinejoin: 'round' })}{F('M10 50 L20 54 L14 60 L6 56 Z', C)}</G>,
  spoon: <G>{F('M40 8 Q54 8 52 20 Q50 30 40 28 Q32 28 34 18 Q36 8 40 8 Z', '#C9CCCF', { stroke: GR, strokeWidth: 2.5 })}{L('M38 28 L14 54', { strokeWidth: 4.5, stroke: C })}</G>,
  fork: <G>{L('M34 8 V22 M40 8 V22 M46 8 V22 M34 22 Q40 30 46 22', { strokeWidth: 2.5 })}{L('M40 28 V58', { strokeWidth: 4.5, stroke: C })}</G>,
  plate: <G blob="wide"><ellipse cx="32" cy="36" rx="26" ry="15" fill={P} stroke={GR} strokeWidth="3" /><ellipse cx="32" cy="36" rx="15" ry="8" fill="none" stroke={C} strokeWidth="2.5" /></G>,
  cup: <G>{FL('M12 22 H44 V40 Q44 52 28 52 Q12 52 12 40 Z', C)}{L('M44 28 Q54 28 54 34 Q54 42 44 42')}{T('M22 16 Q20 10 24 6 M32 16 Q30 10 34 6', { opacity: 0.7 })}</G>,
  breakfast: (
    <G blob="wide">
      <path d="M6 26 A10 10 0 0 1 26 26 Z" fill={C} opacity="0.75" />
      {L('M4 26 H28', { strokeWidth: 2 })}
      <ellipse cx="24" cy="44" rx="19" ry="10" fill={P} stroke={GR} strokeWidth="2.5" />
      <circle cx="24" cy="44" r="5" fill={I.gold} />
      {FL('M44 30 H56 V46 Q56 52 50 52 Q44 52 44 46 Z', C)}
      {L('M56 34 Q61 34 61 39 Q61 44 56 44')}
    </G>
  ),
  lunch: <G blob="wide"><ellipse cx="32" cy="42" rx="24" ry="12" fill={P} stroke={GR} strokeWidth="2.5" />{F('M20 40 Q22 30 32 30 Q42 30 44 40 Z', '#D9AE7E')}{F('M20 40 H44 V43 H20 Z', C)}<circle cx="50" cy="14" r="6" fill={C} /></G>,
  dinner: (
    <G blob="wide">
      <ellipse cx="32" cy="44" rx="20" ry="10" fill={P} stroke={GR} strokeWidth="2.5" />
      <circle cx="32" cy="42" r="6" fill={C} />
      {L('M6 32 V56 M3 32 V38 Q3 41 6 41 Q9 41 9 38 V32')}
      {L('M58 32 Q53 40 58 44 V56')}
      {F('M40 6 A9 9 0 1 0 49 15 A7 7 0 1 1 40 6 Z', GR)}
    </G>
  ),
  sugar: <G>{FL('M14 24 L32 14 L50 24 V44 L32 54 L14 44 Z', P)}{T('M14 24 L32 34 L50 24 M32 34 V54')}{F('M40 6 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5 z', C)}</G>,
  salt: <G blob="tall">{FL('M20 24 Q20 12 32 12 Q44 12 44 24 L46 54 H18 Z', P)}<circle cx="28" cy="18" r="1.4" fill={GR} /><circle cx="32" cy="16" r="1.4" fill={GR} /><circle cx="36" cy="18" r="1.4" fill={GR} />{F('M20 34 H44 V40 H20 Z', C)}</G>,
  bottle: <G blob="tall">{FL('M27 8 H37 V18 Q44 22 44 30 V56 H20 V30 Q20 22 27 18 Z', '#9FD3E6')}{F('M20 34 H44 V44 H20 Z', C)}</G>,
};

const DRINKS: Record<string, ReactNode> = {
  water: <G blob="tall">{FL('M18 14 H46 L42 56 H22 Z', '#D8E8EE')}{F('M20 28 H44 L42 56 H22 Z', '#3C6E9E', { opacity: 0.8 })}{F('M32 2 Q38 10 32 14 Q26 10 32 2 Z', C)}</G>,
  milk: <G blob="tall">{FL('M20 18 L26 8 H38 L44 18 V56 H20 Z', P)}{F('M20 30 H44 V40 H20 Z', '#3C6E9E')}{T('M26 8 L32 18 L38 8')}</G>,
  coffee: <G>{FL('M12 24 H46 V38 Q46 52 29 52 Q12 52 12 38 Z', '#8A5A3B')}{L('M46 28 Q56 28 56 35 Q56 42 46 42')}{L('M22 16 Q19 10 23 5 M32 16 Q29 10 33 5', { stroke: C })}</G>,
  tea: <G>{FL('M12 26 H46 V38 Q46 52 29 52 Q12 52 12 38 Z', P)}{F('M14 30 H44 V38 Q44 48 29 48 Q14 48 14 38 Z', '#C29A2A')}{L('M46 30 Q56 30 56 36 Q56 42 46 42')}{L('M34 26 L40 10')}<rect x="36" y="6" width="9" height="8" fill={C} /></G>,
  wine: <G blob="tall">{FL('M18 8 H46 Q46 34 32 36 Q18 34 18 8 Z', P)}{F('M19 18 H45 Q44 32 32 34 Q20 32 19 18 Z', '#8E2B3E')}{L('M32 36 V52 M22 54 H42')}</G>,
  beer: <G blob="tall">{FL('M14 18 H42 V56 H14 Z', I.gold)}{F('M12 12 Q16 6 22 10 Q28 4 34 10 Q40 6 44 12 V20 H12 Z', P, { stroke: GR, strokeWidth: 2 })}{L('M42 26 H50 V44 H42')}</G>,
  juice: <G blob="tall">{FL('M18 18 H46 L42 56 H22 Z', '#E38B3A')}{L('M36 18 L42 4 H48')}{F('M44 22 Q54 16 56 26 Q48 30 44 22 Z', C)}</G>,
  drink: <G blob="tall">{FL('M16 14 H48 L44 56 H20 Z', C)}{L('M38 14 L44 2')}{T('M20 30 H44', { stroke: P })}</G>,
};

const CLOTHING: Record<string, ReactNode> = {
  clothing: <G blob="wide">{L('M32 12 Q36 12 36 16 Q36 20 32 22 L8 38 H56 L32 22')}{F('M14 38 H50 V44 H14 Z', C)}</G>,
  hat: <G blob="wide"><ellipse cx="32" cy="44" rx="26" ry="7" fill={GR} />{F('M18 44 V26 Q18 16 32 16 Q46 16 46 26 V44 Z', GR)}{F('M18 34 H46 V40 H18 Z', C)}</G>,
  dress: <G blob="tall">{FL('M24 8 H40 L38 22 L52 56 H12 L26 22 Z', C)}{L('M26 22 H38')}</G>,
  suit: <G blob="tall">{FL('M14 14 L24 8 H40 L50 14 L46 56 H18 Z', GR)}{F('M24 8 L32 30 L40 8 Z', P)}{F('M30 14 L32 30 L34 14 Z', C)}</G>,
  skirt: <G>{FL('M20 14 H44 L54 52 H10 Z', C)}{L('M20 18 H44')}{T('M26 24 L22 50 M38 24 L42 50', { stroke: P })}</G>,
  shirt: <G>{FL('M22 10 L32 16 L42 10 L56 20 L50 30 L46 28 V56 H18 V28 L14 30 L8 20 Z', P)}{L('M32 16 V54')}{F('M26 10 L32 18 L38 10 Z', C)}</G>,
  't-shirt': <G>{FL('M22 10 Q32 18 42 10 L56 20 L50 30 L46 28 V56 H18 V28 L14 30 L8 20 Z', C)}</G>,
  pants: <G blob="tall">{FL('M18 8 H46 L48 56 H36 L32 24 L28 56 H16 Z', '#3C6E9E')}{L('M18 14 H46')}</G>,
  shoe: <G blob="wide">{FL('M8 46 V30 Q8 24 16 26 L26 30 Q40 34 52 38 Q58 40 58 46 V50 H8 Z', C)}{F('M8 46 H58 V50 H8 Z', GR)}{T('M20 32 L24 30 M24 36 L28 33')}</G>,
  pocket: <G>{FL('M12 10 H52 V56 H12 Z', '#3C6E9E')}{FL('M20 26 H44 V44 Q32 50 20 44 Z', '#5A8BB8')}{L('M20 26 H44', { stroke: C, strokeWidth: 4 })}</G>,
  coat: <G blob="tall">{FL('M14 14 L26 8 H38 L50 14 L54 56 H10 Z', '#8A5A3B')}{L('M32 12 V56')}<circle cx="36" cy="28" r="2" fill={C} /><circle cx="36" cy="38" r="2" fill={C} /><circle cx="36" cy="48" r="2" fill={C} /></G>,
  stain: <G>{FL('M18 10 L32 16 L46 10 L56 20 L50 28 V56 H14 V28 L8 20 Z', P)}{F('M30 34 Q24 30 28 26 Q34 28 36 24 Q42 28 38 34 Q42 40 34 40 Q30 46 26 40 Q22 36 30 34 Z', C)}</G>,
};

const ELECTRONICS: Record<string, ReactNode> = {
  clock: (
    <G>
      <circle cx="32" cy="34" r="20" fill={P} stroke={GR} strokeWidth="3" />
      {L('M32 34 V22 M32 34 L41 39')}
      {L('M16 12 L10 18 M48 12 L54 18', { stroke: C, strokeWidth: 4 })}
    </G>
  ),
  'fan-device': (
    <G>
      <circle cx="32" cy="26" r="18" fill="none" stroke={GR} strokeWidth="2.5" />
      {[0, 120, 240].map((d) => (
        <ellipse key={d} cx="32" cy="16" rx="5" ry="10" fill={d === 0 ? C : GR} transform={`rotate(${d} 32 26)`} />
      ))}
      {L('M32 44 V56 M22 56 H42')}
    </G>
  ),
  'cell-phone': <G blob="tall">{FL('M20 6 H44 Q48 6 48 10 V54 Q48 58 44 58 H20 Q16 58 16 54 V10 Q16 6 20 6 Z', GR)}<rect x="20" y="12" width="24" height="36" fill={C} /><circle cx="32" cy="53" r="2" fill={P} /></G>,
  network: (
    <G>
      {L('M32 32 L14 16 M32 32 L50 16 M32 32 L14 50 M32 32 L50 50 M14 16 L50 16', { strokeWidth: 2.2 })}
      {[[14, 16], [50, 16], [14, 50], [50, 50]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="5" fill={GR} />)}
      <circle cx="32" cy="32" r="7" fill={C} />
    </G>
  ),
  computer: <G blob="wide">{FL('M8 12 H56 V42 H8 Z', GR)}<rect x="12" y="16" width="40" height="22" fill={C} />{L('M32 42 V50 M20 52 H44')}</G>,
  program: <G blob="wide">{Box(8, 12, 48, 40, GR, 3)}{T('M16 24 L22 30 L16 36', { stroke: P, strokeWidth: 3 })}{T('M26 36 H36', { stroke: C, strokeWidth: 3 })}<circle cx="14" cy="17" r="1.4" fill={P} /></G>,
  laptop: <G blob="wide">{FL('M14 14 H50 V40 H14 Z', GR)}<rect x="18" y="18" width="28" height="18" fill={C} />{FL('M6 40 H58 L54 48 H10 Z', '#C9CCCF')}</G>,
  screen: <G blob="wide">{FL('M6 12 H58 V46 H6 Z', P)}{F('M10 16 H54 V42 H10 Z', '#9FD3E6')}{F('M14 38 L26 26 L34 32 L40 26 L50 38 Z', GR)}<circle cx="44" cy="22" r="3" fill={C} />{L('M26 46 L22 56 M38 46 L42 56')}</G>,
  camera: <G blob="wide">{FL('M6 22 H22 L26 14 H38 L42 22 H58 V52 H6 Z', GR)}<circle cx="32" cy="36" r="11" fill={P} /><circle cx="32" cy="36" r="6" fill={C} /><rect x="48" y="26" width="5" height="4" fill={I.gold} /></G>,
  television: <G blob="wide">{FL('M6 18 H58 V50 H6 Z', GR)}<rect x="10" y="22" width="44" height="24" fill={C} />{L('M24 6 L32 18 L40 6')}</G>,
  radio: <G blob="wide">{FL('M6 22 H58 V52 H6 Z', '#B9875A')}<circle cx="22" cy="37" r="9" fill={GR} />{T('M36 30 H52 M36 37 H52 M36 44 H52')}<circle cx="22" cy="37" r="3" fill={C} />{L('M14 22 L44 8')}</G>,
};

export const HOME_GLYPHS: Record<string, ReactNode> = { ...HOME, ...FOOD, ...DRINKS, ...CLOTHING, ...ELECTRONICS };

