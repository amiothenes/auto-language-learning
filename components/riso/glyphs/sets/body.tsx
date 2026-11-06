import type { ReactNode } from 'react';
import { G, T, F, FL, INKS as I } from '../kit';

/* Body words: one face and one figure, with the named part in coral. */

const C = I.coral;
const GR = I.green;
const P = I.paper;

type FacePart = 'face' | 'head' | 'eye' | 'mouth' | 'lip' | 'nose' | 'ear' | 'hair' | 'beard' | 'tongue' | 'tooth' | 'tear' | 'neck' | 'sweat';

function Face({ part }: { part: FacePart }) {
  const on = (p: FacePart) => (part === p ? C : GR);
  return (
    <G>
      {/* neck */}
      <rect x="27" y="46" width="10" height="12" fill={part === 'neck' ? C : GR} />
      {/* head */}
      <ellipse cx="32" cy="30" rx="15" ry="18" fill={part === 'face' || part === 'head' ? C : P} stroke={GR} strokeWidth="3" />
      {/* hair */}
      <path d="M17 26 Q16 10 32 10 Q48 10 47 26 Q42 16 32 18 Q22 16 17 26 Z" fill={part === 'hair' ? C : GR} />
      {/* ears */}
      <ellipse cx="16" cy="31" rx="3" ry="5" fill={on('ear')} />
      <ellipse cx="48" cy="31" rx="3" ry="5" fill={part === 'ear' ? C : GR} />
      {/* eyes */}
      <circle cx="26" cy="29" r={part === 'eye' ? 3.6 : 2.2} fill={on('eye')} />
      <circle cx="38" cy="29" r={part === 'eye' ? 3.6 : 2.2} fill={on('eye')} />
      {/* nose */}
      <path d="M32 31 L29.5 38 H34" stroke={on('nose')} strokeWidth={part === 'nose' ? 3.5 : 2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* mouth / lips / teeth / tongue */}
      {part === 'lip' ? (
        <path d="M25 42 Q32 38 39 42 Q32 48 25 42 Z" fill={C} />
      ) : part === 'tooth' ? (
        <>
          <path d="M25 41 H39 Q32 49 25 41 Z" fill={GR} />
          <rect x="29" y="41" width="6" height="4" fill={C} />
        </>
      ) : part === 'tongue' ? (
        <>
          <path d="M25 41 H39 Q32 47 25 41 Z" fill={GR} />
          <path d="M28 42 Q28 52 32 52 Q36 52 36 42 Z" fill={C} />
        </>
      ) : (
        <path d="M26 42 Q32 47 38 42" stroke={on('mouth')} strokeWidth={part === 'mouth' ? 4 : 2.4} fill="none" strokeLinecap="round" />
      )}
      {part === 'beard' && <path d="M18 34 Q20 54 32 54 Q44 54 46 34 Q42 46 32 46 Q22 46 18 34 Z" fill={C} />}
      {part === 'tear' && <path d="M24 33 Q20 39 24 42 Q28 39 24 33 Z" fill={C} />}
      {part === 'sweat' && <path d="M44 14 Q38 22 44 25 Q50 22 44 14 Z" fill={C} />}
    </G>
  );
}

type BodyPart = 'body' | 'hand' | 'arm' | 'leg' | 'foot' | 'finger-toe' | 'shoulder' | 'knee' | 'back' | 'heart' | 'brain' | 'bone' | 'skin' | 'blood';

function Figure({ part }: { part: BodyPart }) {
  const on = (p: BodyPart) => (part === p ? C : GR);
  const w = 5.5;
  return (
    <G blob="tall">
      {/* head */}
      <circle cx="32" cy="10" r="6" fill={part === 'body' || part === 'skin' ? C : GR} />
      {/* torso */}
      <path d="M24 18 H40 L38 38 H26 Z" fill={part === 'body' || part === 'back' || part === 'skin' ? C : GR} />
      {/* shoulders */}
      {part === 'shoulder' && (
        <>
          <circle cx="24" cy="20" r="4.5" fill={C} />
          <circle cx="40" cy="20" r="4.5" fill={C} />
        </>
      )}
      {/* arms */}
      <path d="M24 20 L16 34 L14 42" stroke={on('arm')} strokeWidth={w} strokeLinecap="round" fill="none" />
      <path d="M40 20 L48 34 L50 42" stroke={on('arm')} strokeWidth={w} strokeLinecap="round" fill="none" />
      {/* hands */}
      <circle cx="14" cy="44" r={part === 'hand' || part === 'finger-toe' ? 4.5 : 3.2} fill={part === 'hand' ? C : GR} />
      <circle cx="50" cy="44" r={part === 'hand' || part === 'finger-toe' ? 4.5 : 3.2} fill={part === 'hand' ? C : GR} />
      {part === 'finger-toe' && <path d="M50 44 L56 36" stroke={C} strokeWidth="3" strokeLinecap="round" />}
      {/* legs */}
      <path d="M28 38 L27 50 L26 58" stroke={on('leg')} strokeWidth={w + 0.5} strokeLinecap="round" fill="none" />
      <path d="M36 38 L37 50 L38 58" stroke={on('leg')} strokeWidth={w + 0.5} strokeLinecap="round" fill="none" />
      {part === 'knee' && (
        <>
          <circle cx="27" cy="49" r="3.6" fill={C} />
          <circle cx="37" cy="49" r="3.6" fill={C} />
        </>
      )}
      {/* feet */}
      <path d="M26 59 H20" stroke={part === 'foot' ? C : GR} strokeWidth={part === 'foot' ? 5 : 4} strokeLinecap="round" />
      <path d="M38 59 H44" stroke={part === 'foot' ? C : GR} strokeWidth={part === 'foot' ? 5 : 4} strokeLinecap="round" />
      {/* inside the body */}
      {part === 'heart' && <path d="M35 24 Q35 21 37.5 21 Q40 21 40 24 Q40 27 35 31 Q30 27 30 24 Q30 21 32.5 21 Q35 21 35 24 Z" fill={C} transform="translate(-3 0)" />}
      {part === 'brain' && <path d="M27 9 Q27 4 32 4 Q37 4 37 9 Q37 13 32 13 Q27 13 27 9 Z" fill={C} />}
      {part === 'bone' && <path d="M32 22 V34" stroke={P} strokeWidth="3" strokeLinecap="round" />}
      {part === 'blood' && <path d="M50 26 Q45 34 50 38 Q55 34 50 26 Z" fill={C} />}
    </G>
  );
}

const STANDALONE: Record<string, ReactNode> = {
  heart: <G>{F('M32 54 Q8 38 10 22 Q12 12 22 12 Q30 12 32 20 Q34 12 42 12 Q52 12 54 22 Q56 38 32 54 Z', C)}{T('M18 24 Q20 18 24 18', { stroke: P, strokeWidth: 2.5 })}</G>,
  brain: (
    <G>
      {FL('M14 34 Q10 22 20 18 Q22 10 32 12 Q42 10 44 18 Q54 22 50 34 Q54 46 42 48 Q36 54 30 50 Q18 52 16 44 Q10 40 14 34 Z', C)}
      {T('M32 14 V48 M20 26 Q26 28 24 34 M44 26 Q38 28 40 34 M22 40 Q28 38 30 44', { stroke: P })}
    </G>
  ),
  bone: <G>{FL('M18 46 L44 20 Q42 12 48 12 Q50 6 56 10 Q58 16 52 18 Q54 24 46 22 L20 48 Q22 56 16 56 Q12 58 10 52 Q6 50 8 46 Q10 42 18 46 Z', P)}</G>,
  blood: <G>{F('M32 8 Q48 30 48 40 Q48 54 32 54 Q16 54 16 40 Q16 30 32 8 Z', C)}{T('M24 40 Q24 32 28 28', { stroke: P, strokeWidth: 2.5 })}</G>,
  skin: <G blob="wide">{FL('M8 24 Q20 18 32 24 Q44 30 56 24 V44 Q44 50 32 44 Q20 38 8 44 Z', '#F2C9A8')}{T('M16 32 L18 34 M28 34 L30 36 M42 36 L44 38', { stroke: C })}</G>,
  voice: (
    <G>
      <Face part="mouth" />
      {T('M50 30 Q56 36 50 42 M54 24 Q64 36 54 48', { stroke: C, strokeWidth: 2.5 })}
    </G>
  ),
  disease: (
    <G>
      <Face part="face" />
      {FL('M46 8 V30', 'none', { stroke: GR })}
      <circle cx="46" cy="32" r="4" fill={GR} />
      <rect x="44" y="12" width="4" height="16" fill={P} />
    </G>
  ),
};

const FACE_WORDS: FacePart[] = ['face', 'head', 'eye', 'mouth', 'lip', 'nose', 'ear', 'hair', 'beard', 'tooth', 'tear', 'neck', 'sweat'];
const BODY_WORDS: BodyPart[] = ['body', 'hand', 'arm', 'leg', 'foot', 'finger-toe', 'shoulder', 'knee', 'back'];

export const BODY_GLYPHS: Record<string, ReactNode> = {
  ...Object.fromEntries(FACE_WORDS.map((p) => [p === 'tooth' ? 'tooth' : p === 'tear' ? 'tear-drop' : p, <Face key={p} part={p} />])),
  'tongue-language': <Face part="tongue" />,
  ...Object.fromEntries(BODY_WORDS.map((p) => [p, <Figure key={p} part={p} />])),
  ...STANDALONE,
};

