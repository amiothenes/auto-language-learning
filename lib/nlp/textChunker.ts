import { splitIntoSentences, quickTokenize } from './tokenizer';

const DEFAULT_SENTENCE_REGEX = '[.!?]+(?:\\s|$)';

/**
 * Split a long text into sentence-boundary-respecting chunks.
 *
 * Targets ~750 words per chunk. Never cuts mid-sentence. Merges a trailing
 * remainder that is smaller than minWords into the previous chunk.
 */
export function splitIntoChunks(
  content: string,
  targetWords = 750,
  minWords = 300,
  maxWords = 1200
): string[] {
  const sentences = splitIntoSentences(content, DEFAULT_SENTENCE_REGEX);
  if (sentences.length === 0) return [content];

  const chunks: string[] = [];
  let currentSentences: string[] = [];
  let currentWordCount = 0;

  for (const sentence of sentences) {
    const wordCount = quickTokenize(sentence.text, 'en').length;
    currentSentences.push(sentence.text);
    currentWordCount += wordCount;

    if ((currentWordCount >= targetWords && currentWordCount >= minWords) || currentWordCount >= maxWords) {
      chunks.push(currentSentences.join(' '));
      currentSentences = [];
      currentWordCount = 0;
    }
  }

  if (currentSentences.length > 0) {
    const remainder = currentSentences.join(' ');
    if (chunks.length > 0 && currentWordCount < minWords) {
      chunks[chunks.length - 1] += ' ' + remainder;
    } else {
      chunks.push(remainder);
    }
  }

  return chunks.length > 0 ? chunks : [content];
}
