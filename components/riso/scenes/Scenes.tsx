import { INK } from '@/components/riso/RisoDefs';
import { RisoScene, Misreg } from './RisoScene';

/*
 * Riso scenes for La Biblioteca del Olvido. Three inks only (green, ochre,
 * coral) on paper, flat shapes, offset second ink, shared grain. The boy is
 * always small and seen from behind, so the reader can stand in his place.
 */

/** The boy from behind: head, hair tuft, coat. Origin at his feet. */
function Boy({ x, y, scale = 1, book = false }: { x: number; y: number; scale?: number; book?: boolean }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <Misreg dx={-1.5} dy={1.2}>
        <path d="M-9 0 L-8 -24 Q0 -30 8 -24 L9 0 Z" fill={INK.ochre} opacity="0.55" />
      </Misreg>
      <path d="M-9 0 L-8 -24 Q0 -30 8 -24 L9 0 Z" fill={INK.green} />
      <circle cx="0" cy="-33" r="7.5" fill={INK.green} />
      <path d="M-6 -38 Q0 -45 6 -38" stroke={INK.green} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {book && <rect x="6" y="-20" width="9" height="11" rx="1" fill={INK.coral} transform="rotate(-12 10 -14)" />}
    </g>
  );
}

function Cat({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} fill={INK.green}>
      <path d="M-7 0 Q-8 -9 -2 -11 L4 -11 Q8 -9 7 0 Z" />
      <path d="M-3 -11 L-4 -16 L-1 -13 L2 -13 L4 -16 L4 -11 Z" />
      <path d="M7 -2 Q14 -4 12 -12" stroke={INK.green} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Landing, auth and the gate: the green door at night, light spilling out. */
export function DoorScene({ className }: { className?: string }) {
  return (
    <RisoScene label="A boy with a book stands at a green door in an old wall at night; warm light spills from inside." className={className}>
      <rect width="320" height="240" fill={INK.paper} />
      {/* night sky in green halftone */}
      <rect width="320" height="150" fill="url(#riso-halftone-green)" opacity="0.35" />
      <circle cx="252" cy="44" r="16" fill={INK.gold} opacity="0.85" />
      <circle cx="259" cy="40" r="14" fill={INK.paper} opacity="0.9" />
      {/* wall */}
      <Misreg>
        <rect x="40" y="70" width="240" height="140" fill={INK.ochre} opacity="0.35" />
      </Misreg>
      <rect x="40" y="70" width="240" height="140" fill={INK.paper} stroke={INK.green} strokeWidth="2.5" />
      {[90, 120, 150, 180].map((y) => (
        <line key={y} x1="40" x2="280" y1={y} y2={y} stroke={INK.green} strokeWidth="1" opacity="0.25" />
      ))}
      {/* doorway light */}
      <path d="M128 210 L192 210 L240 240 L80 240 Z" fill={INK.ochre} opacity="0.45" />
      <path d="M134 210 V128 Q160 100 186 128 V210 Z" fill={INK.gold} />
      {/* the open door leaf */}
      <Misreg dx={-2.5} dy={2}>
        <path d="M134 210 V128 Q140 118 146 115 L118 124 V214 Z" fill={INK.green} opacity="0.4" />
      </Misreg>
      <path d="M134 210 V128 Q140 118 146 115 L118 124 V214 Z" fill={INK.green} />
      <circle cx="124" cy="170" r="2.2" fill={INK.gold} />
      {/* shelves glimpsed inside */}
      {[150, 168, 186].map((y) => (
        <line key={y} x1="148" x2="182" y1={y} y2={y} stroke={INK.ochre} strokeWidth="2" />
      ))}
      <Boy x={168} y={226} scale={1.15} book />
      <Cat x={204} y={226} />
      {/* ground */}
      <rect x="0" y="226" width="320" height="14" fill={INK.green} opacity="0.85" />
    </RisoScene>
  );
}

/** Word picker: rows of book spines, a few glowing (words you know). */
export function ShelvesScene({ className, lit = 0.35 }: { className?: string; lit?: number }) {
  const rows = [52, 104, 156, 208];
  const spine = (row: number, i: number) => {
    const seed = Math.sin(row * 13.7 + i * 7.3) * 10000;
    const r = seed - Math.floor(seed);
    return { w: 8 + Math.round(r * 7), h: 30 + Math.round(r * 14), glow: r < lit };
  };
  return (
    <RisoScene label="Tall library shelves; some book spines glow where words have been understood." className={className}>
      <rect width="320" height="240" fill={INK.paper} />
      {rows.map((y) => {
        let x = 16;
        const books = [];
        for (let i = 0; x < 300; i++) {
          const s = spine(y, i);
          books.push(
            <g key={i}>
              {s.glow && <rect x={x - 3} y={y - s.h - 6} width={s.w + 6} height={s.h + 6} fill={INK.gold} opacity="0.45" />}
              <rect x={x} y={y - s.h} width={s.w} height={s.h} fill={s.glow ? INK.coral : INK.green} opacity={s.glow ? 0.95 : 0.85} />
              <line x1={x + 2} x2={x + s.w - 2} y1={y - s.h + 6} y2={y - s.h + 6} stroke={INK.paper} strokeWidth="1" opacity="0.6" />
            </g>
          );
          x += s.w + 2;
        }
        return (
          <g key={y}>
            {books}
            <Misreg>
              <rect x="10" y={y} width="300" height="5" fill={INK.ochre} opacity="0.6" />
            </Misreg>
            <rect x="10" y={y} width="300" height="5" fill={INK.green} />
          </g>
        );
      })}
    </RisoScene>
  );
}

/** Comprehension check: the boy reading under a lantern. */
export function LanternScene({ className }: { className?: string }) {
  return (
    <RisoScene label="The boy sits reading an open book under a hanging lantern." className={className}>
      <rect width="320" height="240" fill={INK.paper} />
      {/* light pool */}
      <ellipse cx="160" cy="150" rx="120" ry="80" fill="url(#riso-halftone-ochre)" opacity="0.7" />
      <ellipse cx="160" cy="150" rx="70" ry="48" fill={INK.gold} opacity="0.35" />
      {/* lantern */}
      <line x1="160" y1="0" x2="160" y2="40" stroke={INK.green} strokeWidth="2.5" />
      <Misreg>
        <path d="M146 40 H174 L182 70 H138 Z" fill={INK.ochre} opacity="0.6" />
      </Misreg>
      <path d="M146 40 H174 L182 70 H138 Z" fill={INK.paper} stroke={INK.green} strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="160" cy="58" rx="7" ry="8" fill={INK.coral} />
      {/* table + book */}
      <rect x="92" y="176" width="136" height="8" fill={INK.green} />
      <path d="M126 176 Q143 166 160 174 Q177 166 194 176 Z" fill={INK.paper} stroke={INK.green} strokeWidth="2" />
      <Boy x={160} y={240} scale={1.6} />
      <Cat x={236} y={176} scale={0.9} />
    </RisoScene>
  );
}

const ROOM_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

/**
 * The library map: five rooms climbing to the tower (A1 → C1). `litRooms`
 * rooms glow; `currentRoom` (0-based) gets the coral marker. Used on the
 * reveal and the Today hero.
 */
export function LibraryMapScene({
  litRooms,
  currentRoom,
  className,
}: {
  litRooms: number;
  currentRoom: number | null;
  className?: string;
}) {
  const rooms = [
    { x: 24, y: 168, w: 74, h: 46 },
    { x: 104, y: 150, w: 64, h: 64 },
    { x: 174, y: 128, w: 56, h: 86 },
    { x: 236, y: 104, w: 46, h: 110 },
    { x: 288, y: 36, w: 24, h: 178 }, // the tower
  ];
  return (
    <RisoScene
      label={`Map of the library: ${litRooms} of 5 rooms lit, climbing toward the tower.`}
      className={className}
    >
      <rect width="320" height="240" fill={INK.paper} />
      <rect width="320" height="240" fill="url(#riso-halftone-green)" opacity="0.12" />
      {rooms.map((r, i) => {
        const lit = i < litRooms;
        return (
          <g key={i}>
            <Misreg>
              <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={INK.ochre} opacity={lit ? 0.6 : 0.2} />
            </Misreg>
            <rect
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              fill={lit ? INK.gold : INK.paper}
              fillOpacity={lit ? 0.75 : 1}
              stroke={INK.green}
              strokeWidth="2.5"
              style={{ transition: 'fill 600ms ease, fill-opacity 600ms ease' }}
            />
            {/* windows */}
            <rect x={r.x + r.w / 2 - 5} y={r.y + 10} width="10" height="14" rx="5" fill={lit ? INK.coral : INK.green} opacity={lit ? 0.9 : 0.35} />
            <text x={r.x + r.w / 2} y={r.y + r.h - 8} textAnchor="middle" fontFamily="var(--font-inter)" fontSize="10" fontWeight="600" fill={INK.green}>
              {ROOM_LEVELS[i]}
            </text>
            {currentRoom === i && (
              <g transform={`translate(${r.x + r.w / 2},${r.y - 8})`}>
                <path d="M0 0 L-6 -10 A7 7 0 1 1 6 -10 Z" fill={INK.coral} />
                <circle cx="0" cy="-14" r="2.6" fill={INK.paper} />
              </g>
            )}
          </g>
        );
      })}
      {/* tower cap */}
      <path d="M284 36 L300 14 L316 36 Z" fill={INK.green} />
      <rect x="0" y="214" width="320" height="26" fill={INK.green} opacity="0.85" />
    </RisoScene>
  );
}

/** Save your library: the boy hands a key over (or locks the door). */
export function KeyScene({ className }: { className?: string }) {
  return (
    <RisoScene label="An old key resting on an open book, glowing softly." className={className}>
      <rect width="320" height="240" fill={INK.paper} />
      <ellipse cx="160" cy="140" rx="110" ry="70" fill="url(#riso-halftone-ochre)" opacity="0.6" />
      <Misreg>
        <path d="M70 170 Q115 140 160 162 Q205 140 250 170 L250 186 Q205 158 160 180 Q115 158 70 186 Z" fill={INK.ochre} opacity="0.55" />
      </Misreg>
      <path d="M70 170 Q115 140 160 162 Q205 140 250 170 L250 186 Q205 158 160 180 Q115 158 70 186 Z" fill={INK.paper} stroke={INK.green} strokeWidth="2.5" strokeLinejoin="round" />
      <line x1="160" y1="162" x2="160" y2="180" stroke={INK.green} strokeWidth="2" />
      <g transform="rotate(-18 160 120)">
        <circle cx="128" cy="120" r="16" fill="none" stroke={INK.coral} strokeWidth="7" />
        <rect x="142" y="116" width="62" height="8" rx="2" fill={INK.coral} />
        <rect x="186" y="124" width="7" height="12" fill={INK.coral} />
        <rect x="197" y="124" width="7" height="8" fill={INK.coral} />
      </g>
    </RisoScene>
  );
}
