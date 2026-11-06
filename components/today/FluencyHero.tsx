'use client';

import Link from 'next/link';
import { Info } from 'lucide-react';
import { LibraryMapScene } from '@/components/riso/scenes/Scenes';
import { useCountUp } from '@/components/onboarding/Steps';
import type { CefrBand } from '@/lib/types/api';

/** How many of the map's five rooms (A1 to C1/tower) are lit for a Fluency band. */
const LIT_BY_BAND: Record<CefrBand, number> = {
  'A1-A2': 1,
  'A2-B1': 2,
  'B1-B2': 3,
  C1: 4,
  C2: 5,
};

/**
 * The north-star number. Fluency is the share of everyday text you can read
 * (Zipf-weighted reading coverage from /api/stats). The library map lights
 * up as it grows. Responsive: stacked on phones, map beside the number on
 * tablets and up.
 */
export function FluencyHero({
  fluency,
  band,
  languageName,
  streak,
}: {
  fluency: number;
  band: CefrBand;
  languageName: string;
  streak: number;
}) {
  const shown = useCountUp(fluency, 900);
  const lit = LIT_BY_BAND[band] ?? 1;

  return (
    <section
      aria-labelledby="fluency-heading"
      className="bg-paper border border-border rounded-card shadow-raised overflow-hidden md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] xl:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]"
    >
      <div className="p-5 md:p-6 xl:p-8 flex flex-col justify-center gap-3">
        <div className="flex items-center gap-2">
          <h2 id="fluency-heading" className="font-sans text-ui-sm uppercase tracking-wide text-muted">
            Your Fluency
          </h2>
          <Link href="/guide#fluency" className="text-muted hover:text-ink" aria-label="What is Fluency?">
            <Info size={14} strokeWidth={1.75} />
          </Link>
        </div>
        <p className="font-sans font-bold text-primary tabular-nums leading-none text-6xl md:text-7xl">
          {shown.toFixed(0)}
          <span className="text-3xl md:text-4xl text-riso-coral">%</span>
        </p>
        <p className="font-sans text-ui-base text-ink max-w-prose">
          of everyday {languageName} you can read. <span className="text-muted">Around {band}.</span>
        </p>
        {streak > 0 && (
          <p className="inline-flex items-center gap-1.5 self-start font-sans text-ui-xs font-medium text-ink bg-riso-gold/25 border border-riso-gold/40 rounded-full px-2.5 py-1">
            <span aria-hidden="true">●</span> {streak}-day streak
          </p>
        )}
      </div>
      <div className="bg-desk border-t md:border-t-0 md:border-l border-border flex items-end">
        <LibraryMapScene litRooms={lit} currentRoom={Math.min(4, lit - 1)} />
      </div>
    </section>
  );
}
