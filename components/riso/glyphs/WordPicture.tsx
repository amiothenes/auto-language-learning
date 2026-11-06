import { cn } from '@/lib/utils';
import { Glyph, hasGlyph } from './Glyphs';

/**
 * A picture always travels with its words. The glyph confirms the meaning;
 * the text (word, article, gloss) says it. Words without a glyph get a
 * typographic plate in the same frame and inks, so cards with and without
 * pictures still read as one family.
 *
 *  - variant="card":   picture with the word and meaning set underneath
 *                      (Review card backs, onboarding first words)
 *  - variant="inline": a small framed picture with the meaning beside it
 *                      (the reader's word tooltip, sheet and panel)
 */
export function WordPicture({
  conceptId,
  word,
  gloss,
  article,
  lang,
  variant = 'card',
  size,
  className,
}: {
  conceptId: string | null | undefined;
  word: string;
  gloss?: string | null;
  /** el / la, shown muted before the word (cards only). */
  article?: string | null;
  /** BCP-47 code of the word's language, for screen readers and hyphenation. */
  lang?: string;
  variant?: 'card' | 'inline';
  size?: number;
  className?: string;
}) {
  const pictured = hasGlyph(conceptId);
  const label = gloss ? `${word}: ${gloss}` : word;

  if (variant === 'inline') {
    if (!pictured) return null; // inline is a bonus: no plate next to an existing text block
    return (
      <figure className={cn('flex items-center gap-3', className)}>
        <span className="shrink-0 rounded-card bg-desk border border-border p-1">
          <Glyph conceptId={conceptId!} size={size ?? 44} label={label} />
        </span>
        {gloss && (
          <figcaption className="font-serif italic text-ui-sm text-ink/70 leading-snug min-w-0">{gloss}</figcaption>
        )}
      </figure>
    );
  }

  const px = size ?? 96;
  return (
    <figure className={cn('flex flex-col items-center text-center', className)}>
      <div
        className="flex items-center justify-center rounded-card bg-desk border border-border"
        style={{ width: px + 16, height: px + 16 }}
      >
        {pictured ? (
          <Glyph conceptId={conceptId!} size={px} label={label} />
        ) : (
          // Typographic plate: the word itself, set in the reading serif on an ochre blob.
          <span className="relative flex items-center justify-center" style={{ width: px, height: px }} aria-hidden="true">
            <span className="absolute inset-[12%] rounded-full bg-riso-ochre/35 translate-x-[-3%] translate-y-[3%]" />
            <span
              lang={lang}
              className="relative font-serif font-bold text-primary leading-none break-words px-1"
              style={{ fontSize: Math.max(14, Math.min(px * 0.34, (px * 1.6) / Math.max(word.length, 3))) }}
            >
              {word}
            </span>
          </span>
        )}
      </div>
      <figcaption className="mt-2 leading-tight">
        <span lang={lang} className="block font-serif text-ui-lg text-ink">
          {article && <span className="text-muted">{article} </span>}
          {word}
        </span>
        {gloss && <span className="block font-sans text-ui-sm text-primary">{gloss}</span>}
      </figcaption>
    </figure>
  );
}
