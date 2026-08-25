'use client';

import Link from 'next/link';
import { Play, Square } from 'lucide-react';
import { Word, WordData } from './Word';
import { useReaderSettings } from '@/lib/contexts/ReaderSettingsContext';
import { cn } from '@/lib/utils';
import type { WordInstanceItem } from '@/lib/types/api';
import { buildWordDataFromInstance } from '@/lib/utils/wordData';
import { extractWordRuns, gapTargetId } from '@/lib/utils/wordRuns';

// ============================================================================
// ReaderContent Component
// Renders text by walking pre-computed wordInstances as position-ordered
// boundaries. Gap characters between word positions are emitted as plain
// text, except for letter/digit runs within them (numbers, or words in a
// script that doesn't match the text's language — both excluded from
// wordInstances at import time, see textProcessor.ts's `is_word`/
// `matchesLanguageScript` filters). Those still get spoken by TTS, so they're
// tagged with a `data-tts-target-id` gap key for karaoke highlighting even
// though they're not real vocabulary (no click handler, no status styling).
// No second tokenizer for real words — positions come exclusively from the
// NLP pipeline that ran at import time.
// ============================================================================

type RenderToken =
  | { type: 'text'; content: string }
  | { type: 'gapWord'; content: string; targetId: string; key: string }
  | { type: 'word'; data: WordData; key: string };

/** Splits gap text (everything between two wordInstances) so its speakable
 * runs — numbers, off-script words, accented words the import pipeline
 * dropped — become individually targetable spans. `gapAbsStart` is the gap's
 * absolute offset in the text content, the same coordinate space
 * wordInstance positions use, so the ids computed here match the ones
 * lib/tts/alignment.ts derives server-side without any shared state. */
function emitGapTokens(
  gapText: string,
  gapAbsStart: number,
  tokens: RenderToken[],
  keyPrefix: string
) {
  const runs = extractWordRuns(gapText);
  if (runs.length === 0) {
    tokens.push({ type: 'text', content: gapText });
    return;
  }

  let cursor = 0;
  runs.forEach((run, i) => {
    if (run.start > cursor) {
      tokens.push({ type: 'text', content: gapText.slice(cursor, run.start) });
    }
    tokens.push({
      type: 'gapWord',
      content: run.text,
      targetId: gapTargetId(gapAbsStart + run.start),
      key: `${keyPrefix}-${i}`,
    });
    cursor = run.start + run.text.length;
  });
  if (cursor < gapText.length) {
    tokens.push({ type: 'text', content: gapText.slice(cursor) });
  }
}

interface ReaderContentProps {
  content: string;
  onWordClick: (data: WordData, anchorRect: DOMRect) => void;
  /** Ctrl/⌘-click on a word — move the narration cursor there. */
  onWordSeek?: (data: WordData) => void;
  /** Hover-revealed ▶ in each paragraph's left margin. */
  onPlayParagraph?: (paragraphIndex: number) => void;
  /** Invoked by the ■ that replaces ▶ on the narrating paragraph. */
  onStopParagraph?: () => void;
  /** Paragraph the narration is currently in — decides ▶ vs ■. */
  playingParagraphIndex?: number;
  selectedWordId?: string | null;
  wordInstances?: WordInstanceItem[] | null;
  isLoading?: boolean;
  loadError?: string | null;
  seriesId?: string;
}

export function ReaderContent({
  content,
  onWordClick,
  onWordSeek,
  onPlayParagraph,
  onStopParagraph,
  playingParagraphIndex = -1,
  selectedWordId,
  wordInstances,
  isLoading,
  loadError,
  seriesId,
}: ReaderContentProps) {
  const { settings } = useReaderSettings();

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
  // as an ordered oracle. Emit gap text for everything between word boundaries,
  // tagging speakable runs within it (numbers, off-script words, accented
  // words) as karaoke targets via emitGapTokens.
  const parsedContent = paragraphs.map((paragraph, paraIndex) => {
    const paraStart = paragraphStarts[paraIndex];
    const paraEnd = paraStart + paragraph.length;
    const tokens: RenderToken[] = [];
    let cursor = paraStart;

    const paraInstances =
      wordInstances?.filter(
        (inst) => inst.position >= paraStart && inst.position < paraEnd
      ) ?? [];

    for (let i = 0; i < paraInstances.length; i++) {
      const inst = paraInstances[i];
      const wordStart = inst.position;

      if (wordStart > cursor) {
        const gapText = paragraph.slice(cursor - paraStart, wordStart - paraStart);
        emitGapTokens(gapText, cursor, tokens, `p${paraIndex}-g${i}`);
      }

      const wordData: WordData = buildWordDataFromInstance(inst);

      tokens.push({ type: 'word', data: wordData, key: inst.instanceId });
      cursor = wordStart + inst.surface.length;
    }

    if (cursor - paraStart < paragraph.length) {
      const gapText = paragraph.slice(cursor - paraStart);
      emitGapTokens(gapText, cursor, tokens, `p${paraIndex}-tail`);
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
      {parsedContent.map((paragraph, paraIndex) => (
        <p
          key={paragraph.id}
          className="font-serif text-ink leading-relaxed whitespace-pre-line relative group"
        >
          {/* Play-from-here / stop, in the left margin so it never reflows the
              prose. Hover-only in every state — a permanently visible control
              on the narrating paragraph competes with the karaoke highlight
              for attention while adding nothing the highlight doesn't say.
              On the paragraph currently narrating it becomes ■ stop, which is
              also how you clear the highlight. */}
          {onPlayParagraph && (
            <button
              type="button"
              onClick={() =>
                paraIndex === playingParagraphIndex && onStopParagraph
                  ? onStopParagraph()
                  : onPlayParagraph(paraIndex)
              }
              className={cn(
                'absolute -left-7 top-1 hidden md:flex items-center justify-center w-5 h-5 rounded-full',
                'text-muted hover:text-primary hover:bg-primary/10 transition-all cursor-pointer',
                'opacity-0 group-hover:opacity-100 focus:opacity-100',
              )}
              aria-label={
                paraIndex === playingParagraphIndex
                  ? 'Stop narration'
                  : `Play narration from paragraph ${paraIndex + 1}`
              }
              title={paraIndex === playingParagraphIndex ? 'Stop' : 'Play from here'}
            >
              {paraIndex === playingParagraphIndex ? (
                <Square size={9} strokeWidth={2} fill="currentColor" />
              ) : (
                <Play size={11} strokeWidth={2} fill="currentColor" />
              )}
            </button>
          )}
          {paragraph.tokens.map((token, i) =>
            token.type === 'text' ? (
              <span key={`t-${i}`}>{token.content}</span>
            ) : token.type === 'gapWord' ? (
              <span key={token.key} data-tts-target-id={token.targetId}>
                {token.content}
              </span>
            ) : (
              <Word
                key={token.key}
                data={token.data}
                onClick={onWordClick}
                onSeekTo={onWordSeek}
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
        <p className="font-serif italic text-content-base text-muted">End</p>
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
