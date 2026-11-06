'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import type { ClientOnboardingContent } from '@/lib/onboarding/types';
import type { BandSelection } from '@/lib/onboarding/placement';

export interface PickerResult {
  bands: BandSelection[];
  decoys: { shown: number; picked: number };
  ticked: string[];
  shownUnticked: string[];
}

interface Chip {
  lemma: string;
  gloss: string | null; // null = decoy
}

/**
 * "Tap every word you know." Six looping rows, common words at the top and
 * rare ones at the bottom (no level labels). A tapped chip flips to its
 * English meaning, which helps catch false friends, and a second tap flips it
 * back. Decoy pseudo-words are mixed in to detect over-ticking.
 */
export function WordPicker({
  content,
  onChange,
}: {
  content: ClientOnboardingContent;
  onChange: (result: PickerResult) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  // Shuffle once per mount; deal decoys round-robin starting at the top rows.
  const rows = useMemo<Chip[][]>(() => {
    const r = content.bands.map((b) => b.words.map((w): Chip => ({ lemma: w.lemma, gloss: w.gloss })));
    content.decoys.forEach((d, i) => r[i % r.length].push({ lemma: d, gloss: null }));
    return r.map(shuffle);
  }, [content]);

  const decoySet = useMemo(() => new Set(content.decoys), [content.decoys]);

  const toggle = useCallback((lemma: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(lemma)) next.delete(lemma);
      else next.add(lemma);
      return next;
    });
  }, []);

  useEffect(() => {
    const bands: BandSelection[] = content.bands.map((b) => ({
      shown: b.words.length,
      picked: b.words.filter((w) => selected.has(w.lemma)).length,
    }));
    const all = content.bands.flatMap((b) => b.words.map((w) => w.lemma));
    onChange({
      bands,
      decoys: { shown: content.decoys.length, picked: content.decoys.filter((d) => selected.has(d)).length },
      ticked: all.filter((l) => selected.has(l)),
      shownUnticked: all.filter((l) => !selected.has(l)),
    });
  }, [selected, content, onChange]);

  return (
    <div className="space-y-2.5 md:space-y-3 -mx-4 md:-mx-8" role="group" aria-label="Words to pick from, common at the top and rarer below">
      {rows.map((chips, i) => (
        <LoopingRow
          key={i}
          chips={chips}
          selected={selected}
          decoys={decoySet}
          onToggle={toggle}
          speed={i % 2 === 0 ? 0.22 : -0.18}
          label={`Row ${i + 1} of ${rows.length}`}
        />
      ))}
    </div>
  );
}

function LoopingRow({
  chips,
  selected,
  decoys,
  onToggle,
  speed,
  label,
}: {
  chips: Chip[];
  selected: Set<string>;
  decoys: Set<string>;
  onToggle: (lemma: string) => void;
  speed: number;
  label: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const firstCopy = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start in the middle copy so both directions have room before the wrap.
  useEffect(() => {
    const el = scroller.current;
    const w = firstCopy.current?.offsetWidth ?? 0;
    if (el && w) el.scrollLeft = w;
  }, [chips]);

  // Seamless loop: past either edge, jump back by exactly one copy's width.
  const onScroll = useCallback(() => {
    const el = scroller.current;
    const w = firstCopy.current?.offsetWidth ?? 0;
    if (!el || !w) return;
    if (el.scrollLeft < w * 0.25) el.scrollLeft += w;
    else if (el.scrollLeft > w * 1.75) el.scrollLeft -= w;
  }, []);

  // Slow auto-drift on the compositor-friendly scroll position (no layout work
  // per frame). Off under prefers-reduced-motion; pauses while interacting.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let carry = 0;
    const tick = () => {
      const el = scroller.current;
      if (el && !paused.current) {
        carry += speed;
        const whole = Math.trunc(carry);
        if (whole !== 0) {
          el.scrollLeft += whole;
          carry -= whole;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speed]);

  const pause = () => {
    paused.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  };
  const resumeSoon = () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => (paused.current = false), 2500);
  };
  useEffect(() => () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);

  // Arrow keys move focus along the row (only the first copy is focusable).
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const buttons = Array.from(firstCopy.current?.querySelectorAll('button') ?? []);
    const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (idx === -1) return;
    e.preventDefault();
    const next = buttons[(idx + (e.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length];
    next.focus();
    next.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  };

  const renderCopy = (copy: number) => (
    <div ref={copy === 0 ? firstCopy : undefined} className="flex gap-2 pr-2 shrink-0" aria-hidden={copy !== 0 || undefined}>
      {chips.map((chip) => (
        <WordChip
          key={`${copy}-${chip.lemma}`}
          chip={chip}
          isDecoy={decoys.has(chip.lemma)}
          on={selected.has(chip.lemma)}
          onToggle={onToggle}
          focusable={copy === 0}
        />
      ))}
    </div>
  );

  return (
    <div
      ref={scroller}
      onScroll={onScroll}
      onPointerDown={pause}
      onPointerUp={resumeSoon}
      onPointerCancel={resumeSoon}
      onMouseEnter={pause}
      onMouseLeave={resumeSoon}
      onFocus={pause}
      onBlur={resumeSoon}
      onKeyDown={onKeyDown}
      className="flex overflow-x-auto overscroll-x-contain py-1 px-4 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)]"
      role="group"
      aria-label={label}
    >
      {renderCopy(0)}
      {renderCopy(1)}
      {renderCopy(2)}
    </div>
  );
}

function WordChip({
  chip,
  isDecoy,
  on,
  onToggle,
  focusable,
}: {
  chip: Chip;
  isDecoy: boolean;
  on: boolean;
  onToggle: (lemma: string) => void;
  focusable: boolean;
}) {
  const back = isDecoy ? '¿?' : chip.gloss;
  return (
    <button
      type="button"
      tabIndex={focusable ? 0 : -1}
      aria-pressed={on}
      aria-label={on ? `${chip.lemma}, known${back ? `, means ${back}` : ''}` : chip.lemma}
      onClick={() => onToggle(chip.lemma)}
      className={cn(
        'shrink-0 min-h-[44px] px-4 rounded-full border font-sans text-ui-base md:text-ui-md transition-all duration-200 cursor-pointer select-none whitespace-nowrap',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-desk',
        on
          ? 'bg-primary text-white border-primary shadow-raised-hover'
          : 'bg-paper text-ink border-border hover:border-primary/40 shadow-raised active:translate-y-px'
      )}
    >
      {/* Flip: the target-language word, then its meaning once known. */}
      <span className={cn('inline-block transition-transform duration-200', on && 'italic')} lang={on ? 'en' : undefined}>
        {on ? back : chip.lemma}
      </span>
    </button>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
