'use client';

import { Word, WordData, VocabularyStatus } from './Word';
import { useReaderSettings } from '@/lib/contexts/ReaderSettingsContext';
import { cn } from '@/lib/utils';

// ============================================================================
// ReaderContent Component
// Parses text into words and renders interactive Word components
// Now uses real NLP data from Transformers.js API
// ============================================================================

interface ReaderContentProps {
  content: string;
  onWordClick: (data: WordData, anchorRect: DOMRect) => void;
  selectedWordId?: string | null;
  processedWords?: Array<{
    surface: string;
    lemma: string;
    pos: string;
    inflectionData: Record<string, unknown>;
    position: number;
    sentenceIndex: number;
    tokenIndex: number;
  }> | null;
  isProcessingNLP?: boolean;
  nlpError?: string | null;
}

export function ReaderContent({
  content,
  onWordClick,
  selectedWordId,
  processedWords,
  isProcessingNLP,
  nlpError
}: ReaderContentProps) {
  // Get reader settings from context
  const { settings } = useReaderSettings();

  /**
   * Generate deterministic hash from string for consistent status assignment
   * This ensures server and client render the same status
   */
  const hashString = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  /**
   * Generate deterministic vocabulary status based on word text
   * Weighted distribution:
   * - 25% NEWLY_SEEN
   * - 30% FAMILIAR
   * - 25% KNOWN
   * - 15% WELL_KNOWN
   * - 5% IGNORE
   */
  const getDeterministicStatus = (word: string): VocabularyStatus => {
    const hash = hashString(word);
    const normalized = (hash % 100) / 100; // Normalize to 0-1

    if (normalized < 0.25) return VocabularyStatus.NEWLY_SEEN;
    if (normalized < 0.55) return VocabularyStatus.FAMILIAR;
    if (normalized < 0.80) return VocabularyStatus.KNOWN;
    if (normalized < 0.95) return VocabularyStatus.WELL_KNOWN;
    return VocabularyStatus.IGNORE;
  };

  /**
   * Format inflection data for display
   */
  const formatInflection = (inflectionData: Record<string, unknown>): string => {
    const parts: string[] = [];

    // Order matters: tense, mood, person, number, gender, case
    if (inflectionData.tense) parts.push(String(inflectionData.tense));
    if (inflectionData.mood) parts.push(String(inflectionData.mood));
    if (inflectionData.person) parts.push(`${inflectionData.person}p`);
    if (inflectionData.number) parts.push(String(inflectionData.number));
    if (inflectionData.gender) parts.push(String(inflectionData.gender));
    if (inflectionData.case) parts.push(String(inflectionData.case));
    if (inflectionData.voice) parts.push(String(inflectionData.voice));
    if (inflectionData.aspect) parts.push(String(inflectionData.aspect));

    return parts.length > 0 ? parts.join(', ') : 'base form';
  };

  /**
   * Parse text into paragraphs and words with WordData
   *
   * Uses real NLP data if available, otherwise falls back to simple tokenization
   */
  const parsedContent = content.split('\n\n').filter(p => p.trim()).map((paragraph, paraIndex) => {
    // Split paragraph into tokens (words + punctuation)
    const tokens = paragraph.match(/\S+/g) || [];

    const words = tokens.map((token, wordIndex) => {
      const id = `${paraIndex}-${wordIndex}`;
      const cleanToken = token.replace(/[.,!?;:«»„"]/g, '');

      // Try to find this word in NLP processed words
      // Match by position or by cleaned token text
      let nlpWord = null;
      if (processedWords) {
        // Find the word by approximate position
        // (This is a simplified approach - in production, use exact position matching)
        nlpWord = processedWords.find(
          (w) => w.surface.toLowerCase() === cleanToken.toLowerCase()
        );
      }

      // Build WordData from NLP result or fallback to placeholder
      const wordData: WordData = {
        id,
        surface: token,
        lemma: nlpWord?.lemma || cleanToken.toLowerCase(),
        pos: nlpWord?.pos || 'UNKNOWN',
        inflection: nlpWord ? formatInflection(nlpWord.inflectionData) : 'unknown',
        translation: '—', // TODO: Translation service
        dictionaryFrequency: (hashString(cleanToken) % 100) + 1,
        userFrequency: (hashString(cleanToken) % 50) + 1,
        status: getDeterministicStatus(cleanToken),
      };

      return wordData;
    });

    return {
      id: `paragraph-${paraIndex}`,
      words,
    };
  });

  // Map font size setting to CSS class
  const fontSizeClass = {
    small: 'text-content-sm',   // 14px
    medium: 'text-content-base', // 18px (default)
    large: 'text-content-lg',    // 20px
  }[settings.fontSize];

  // Show NLP processing indicator with shimmer
  if (isProcessingNLP) {
    return (
      <article className={cn(
        "w-full max-w-[45rem] space-y-6 transition-all duration-200",
        fontSizeClass
      )}>
        {/* Shimmer paragraph blocks */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3">
            <div className="animate-shimmer h-5 rounded w-full" />
            <div className="animate-shimmer h-5 rounded w-11/12" />
            <div className="animate-shimmer h-5 rounded w-full" />
            <div className="animate-shimmer h-5 rounded w-5/6" />
          </div>
        ))}
        <p className="font-sans text-ui-sm text-center text-muted mt-6">
          Processing text with NLP engine...
        </p>
      </article>
    );
  }

  // Show NLP error if present
  if (nlpError) {
    return (
      <article className={cn(
        "w-full max-w-[45rem] space-y-6 transition-all duration-200",
        fontSizeClass
      )}>
        <div className="p-4 bg-paper rounded-lg border border-border">
          <p className="font-sans text-ui-sm text-ink font-medium mb-2">
            NLP Processing Error
          </p>
          <p className="font-sans text-ui-xs text-muted">
            {nlpError}
          </p>
          <p className="font-sans text-ui-xs text-muted mt-2">
            Displaying text with placeholder data.
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className={cn(
      "w-full max-w-[45rem] space-y-6 transition-all duration-200",
      fontSizeClass
    )}>
      {/* Show NLP status badge */}
      {processedWords && (
        <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <p className="font-sans text-ui-xs text-primary font-medium">
            ✓ Text processed with NLP engine
          </p>
          <p className="font-sans text-ui-xs text-muted mt-1">
            {processedWords.length} words lemmatized
          </p>
        </div>
      )}

      {parsedContent.map((paragraph) => (
        <p
          key={paragraph.id}
          className="font-serif text-ink leading-relaxed"
        >
          {paragraph.words.map((wordData, index) => (
            <span key={wordData.id}>
              <Word
                data={wordData}
                onClick={onWordClick}
                isSelected={selectedWordId === wordData.id}
                highlightIntensity={settings.highlightIntensity}
                showWellKnownWords={settings.showWellKnownWords}
              />
              {/* Add space after word unless it's followed by punctuation */}
              {index < paragraph.words.length - 1 &&
               !paragraph.words[index + 1].surface.match(/^[.,!?;:«»„"]/) &&
               ' '}
            </span>
          ))}
        </p>
      ))}
    </article>
  );
}
