import { quickTokenize } from './tokenizer';

/**
 * Split a long text into paragraph-boundary-respecting chunks.
 *
 * Targets ~750 words per chunk. Never cuts mid-paragraph. Merges a trailing
 * remainder that is smaller than minWords into the previous chunk.
 * Newlines within paragraph blocks are preserved as-is.
 */
export function splitIntoChunks(
  content: string,
  targetWords = 750,
  minWords = 300,
  maxWords = 1200
): string[] {
  // Split on two or more consecutive newlines to get paragraph blocks.
  // Single \n within a block is preserved and passes through unchanged.
  const paragraphBlocks = content.split(/\n{2,}/);
  const nonEmptyBlocks = paragraphBlocks.filter((b) => b.trim());
  if (nonEmptyBlocks.length === 0) return [content];

  const chunks: string[] = [];
  let currentBlocks: string[] = [];
  let currentWordCount = 0;

  for (const block of nonEmptyBlocks) {
    const wordCount = quickTokenize(block, 'en').length;
    currentBlocks.push(block);
    currentWordCount += wordCount;

    if ((currentWordCount >= targetWords && currentWordCount >= minWords) || currentWordCount >= maxWords) {
      chunks.push(currentBlocks.join('\n\n'));
      currentBlocks = [];
      currentWordCount = 0;
    }
  }

  if (currentBlocks.length > 0) {
    const remainder = currentBlocks.join('\n\n');
    if (chunks.length > 0 && currentWordCount < minWords) {
      chunks[chunks.length - 1] += '\n\n' + remainder;
    } else {
      chunks.push(remainder);
    }
  }

  return chunks.length > 0 ? chunks : [content];
}
