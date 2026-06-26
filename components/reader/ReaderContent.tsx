'use client';

import Link from 'next/link';
import { Word, WordData } from './Word';
import { useReaderSettings } from '@/lib/contexts/ReaderSettingsContext';
import { cn } from '@/lib/utils';
import type { WordInstanceItem } from '@/lib/types/api';

// ============================================================================
// ReaderContent Component
// Renders text by walking pre-computed wordInstances as position-ordered
// boundaries. Gap characters between word positions are emitted as plain text.
// No second tokenizer — positions come exclusively from the NLP pipeline that
// ran at import time.
// ============================================================================

type RenderToken =
  | { type: 'text'; content: string }
  | { type: 'word'; data: WordData; key: string };

interface ReaderContentProps {
  content: string;
  onWordClick: (data: WordData, anchorRect: DOMRect) => void;
  selectedWordId?: string | null;
  wordInstances?: WordInstanceItem[] | null;
  isLoading?: boolean;
  loadError?: string | null;
  seriesId?: string;
}

export function ReaderContent({
  content,
  onWordClick,
  selectedWordId,
  wordInstances,
  isLoading,
  loadError,
  seriesId,
}: ReaderContentProps) {
  const { settings } = useReaderSettings();

  const formatInflection = (inflectionData: Record<string, unknown>): string => {
    const d = Object.fromEntries(Object.entries(inflectionData).map(([k, v]) => [k.toLowerCase(), v]));
    const parts: string[] = [];
    if (d.tense) parts.push(String(d.tense));
    if (d.mood) parts.push(String(d.mood));
    if (d.person) parts.push(`${d.person}p`);
    if (d.number) parts.push(String(d.number));
    if (d.gender) parts.push(String(d.gender));
    if (d.case) parts.push(String(d.case));
    if (d.voice) parts.push(String(d.voice));
    if (d.aspect) parts.push(String(d.aspect));
    return parts.length > 0 ? parts.join(', ') : 'base form';
  };

  // Compute paragraph start positions in the full content string
  const rawParagraphs = content.split('\n\n');
  let charOffset = 0;
  const paragraphStarts: number[] = [];

  for (let i = 0; i < rawParagraphs.length; i++) {
    const para = rawParagraphs[i];
    if (para.trim()) {
      paragraphStarts.push(charOffset);
    }
    charOffset += para.length + (i < rawParagraphs.length - 1 ? 2 : 0);
  }

  const paragraphs = rawParagraphs.filter((p) => p.trim());

  // Gap-filling: walk wordInstances (already sorted by position ASC from the API)
  // as an ordered oracle. Emit gap text for everything between word boundaries.
  const parsedContent = paragraphs.map((paragraph, paraIndex) => {
    const paraStart = paragraphStarts[paraIndex];
    const paraEnd = paraStart + paragraph.length;
    const tokens: RenderToken[] = [];
    let cursor = paraStart;

    const paraInstances =
      wordInstances?.filter(
        (inst) => inst.position >= paraStart && inst.position < paraEnd
      ) ?? [];

    for (const inst of paraInstances) {
      // Defensive: existing DB records may have positions pointing one char before the
      // word (into inter-sentence whitespace) due to a tokenizer trim bug now fixed.
      // Advance past any non-letter characters to find the actual word start.
      let wordStart = inst.position;
      while (
        wordStart - paraStart < paragraph.length &&
        !/\p{L}/u.test(paragraph[wordStart - paraStart])
      ) {
        wordStart++;
      }

      if (wordStart > cursor) {
        tokens.push({
          type: 'text',
          content: paragraph.slice(cursor - paraStart, wordStart - paraStart),
        });
      }

      const wordData: WordData = {
        id: inst.instanceId,
        wordId: inst.wordId,
        surface: inst.surface,
        lemma: inst.lemma,
        pos: inst.pos ?? 'UNKNOWN',
        inflection: inst.inflectionData
          ? formatInflection(inst.inflectionData as Record<string, unknown>)
          : 'base form',
        translation: inst.translation ?? '—',
        dictionaryFrequency: inst.dictionaryFrequency,
        userFrequency: inst.userFrequency,
        status: inst.status,
        inflectionData: inst.inflectionData ?? null,
        meanings: inst.meanings ?? null,
        exampleSentence: inst.exampleSentence ?? null,
        exampleSentenceTranslation: inst.exampleSentenceTranslation ?? null,
      };

      tokens.push({ type: 'word', data: wordData, key: inst.instanceId });
      cursor = wordStart + inst.surface.length;
    }

    if (cursor - paraStart < paragraph.length) {
      tokens.push({ type: 'text', content: paragraph.slice(cursor - paraStart) });
    }

    return { id: `paragraph-${paraIndex}`, tokens };
  });

  const fontSizeClass = {
    small: 'text-content-sm',
    medium: 'text-content-base',
    large: 'text-content-lg',
  }[settings.fontSize];

  if (isLoading) {
    return (
      <article translate="no" className={cn('w-full max-w-180 space-y-6 transition-all duration-200', fontSizeClass)}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3">
            <div className="animate-shimmer h-5 rounded w-full" />
            <div className="animate-shimmer h-5 rounded w-11/12" />
            <div className="animate-shimmer h-5 rounded w-full" />
            <div className="animate-shimmer h-5 rounded w-5/6" />
          </div>
        ))}
        <p className="font-sans text-ui-sm text-center text-muted mt-6">
          Loading word data...
        </p>
      </article>
    );
  }

  if (loadError) {
    return (
      <article translate="no" className={cn('w-full max-w-180 space-y-6 transition-all duration-200', fontSizeClass)}>
        <div className="p-4 bg-paper rounded-lg border border-border">
          <p className="font-sans text-ui-sm text-ink font-medium mb-2">Failed to load word data</p>
          <p className="font-sans text-ui-xs text-muted">{loadError}</p>
          <p className="font-sans text-ui-xs text-muted mt-2">
            Displaying text with placeholder data.
          </p>
        </div>
      </article>
    );
  }

  return (
    <article translate="no" className={cn('w-full max-w-180 space-y-6 transition-all duration-200', fontSizeClass)}>
      {parsedContent.map((paragraph) => (
        <p
          key={paragraph.id}
          className="font-serif text-ink leading-relaxed whitespace-pre-line"
        >
          {paragraph.tokens.map((token, i) =>
            token.type === 'text' ? (
              <span key={`t-${i}`}>{token.content}</span>
            ) : (
              <Word
                key={token.key}
                data={token.data}
                onClick={onWordClick}
                isSelected={selectedWordId === token.data.id}
                highlightIntensity={settings.highlightIntensity}
                showWellKnownWords={settings.showWellKnownWords}
              />
            )
          )}
        </p>
      ))}

      {/* End-of-text marker */}
      <div className="flex flex-col items-center gap-4 pt-12 pb-8 border-t border-border mt-8">
        <img
          src="/illustrations/mountain.svg"
          width={72}
          height={72}
          alt=""
          className="opacity-60"
        />
        <p className="font-serif italic text-content-base text-muted">— End —</p>
        {seriesId && (
          <Link
            href={`/series/${seriesId}`}
            className="font-sans text-ui-sm text-primary hover:underline"
          >
            Back to series →
          </Link>
        )}
      </div>
    </article>
  );
}
