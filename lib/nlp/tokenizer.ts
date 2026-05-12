/**
 * Text Tokenizer
 *
 * Language-aware tokenization that splits text into sentences and words
 * while preserving position metadata for mapping back to original text.
 *
 * **Features:**
 * - Language-specific sentence splitting (uses regex from database)
 * - Character normalization (apply substitutions for accents, etc.)
 * - Contraction handling (don't → do + n't)
 * - RTL language support (Arabic, Hebrew)
 * - Position tracking (character offsets)
 * - Hyphenated words (treat as single token)
 *
 * **Performance target:** < 500ms for 5000-word text
 */

import type { Token, TokenizeOptions } from './types';
import { isContraction, splitContraction } from './utils/contractions';
import { normalizeRTL, stripDiacritics, isRTL } from './utils/rtl';

// ============================================================================
// Text Normalization
// ============================================================================

/**
 * Apply character substitutions to text
 *
 * Used for normalizing language-specific characters (e.g., Spanish accents)
 * based on database settings.
 *
 * @param text - Text to normalize
 * @param substitutions - Map of characters to replace
 * @returns Normalized text
 */
function applyCharacterSubstitutions(
  text: string,
  substitutions: Record<string, string>
): string {
  let result = text;

  for (const [from, to] of Object.entries(substitutions)) {
    result = result.replace(new RegExp(from, 'g'), to);
  }

  return result;
}

// ============================================================================
// Sentence Splitting
// ============================================================================

/**
 * Split text into sentences using language-specific regex
 *
 * @param text - Text to split
 * @param sentenceSplitRegex - Language-specific regex pattern
 * @returns Array of sentences with their start positions
 */
export function splitIntoSentences(
  text: string,
  sentenceSplitRegex: string
): Array<{ text: string; startPosition: number }> {
  const regex = new RegExp(sentenceSplitRegex, 'g');
  const sentences: Array<{ text: string; startPosition: number }> = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Find all sentence boundaries
  while ((match = regex.exec(text)) !== null) {
    const sentenceEnd = match.index + match[0].length;
    const sentenceText = text.slice(lastIndex, sentenceEnd).trim();

    if (sentenceText.length > 0) {
      sentences.push({
        text: sentenceText,
        startPosition: lastIndex,
      });
    }

    lastIndex = sentenceEnd;
  }

  // Add remaining text as final sentence
  const remainingText = text.slice(lastIndex).trim();
  if (remainingText.length > 0) {
    sentences.push({
      text: remainingText,
      startPosition: lastIndex,
    });
  }

  return sentences;
}

// ============================================================================
// Word Tokenization
// ============================================================================

/**
 * Tokenize a sentence into words
 *
 * Handles:
 * - Latin scripts (English, Spanish, French, etc.)
 * - RTL scripts (Arabic, Hebrew)
 * - Contractions (don't, l'école)
 * - Hyphenated words (well-known)
 *
 * @param sentence - Sentence to tokenize
 * @param languageCode - ISO 639-1 language code
 * @param sentenceIndex - Index of this sentence in the text
 * @param sentenceStartPosition - Character offset of sentence start
 * @param isRTLLanguage - Whether language is RTL
 * @returns Array of tokens
 */
function tokenizeSentence(
  sentence: string,
  languageCode: string,
  sentenceIndex: number,
  sentenceStartPosition: number,
  isRTLLanguage: boolean
): Token[] {
  const tokens: Token[] = [];

  // Normalize RTL text if needed
  const normalizedSentence = isRTLLanguage
    ? normalizeRTL(sentence)
    : sentence;

  // Strip Arabic diacritics for tokenization (but preserve in surfaceForm)
  const processedSentence =
    languageCode === 'ar' ? stripDiacritics(normalizedSentence) : normalizedSentence;

  // Word boundary regex (Unicode-aware)
  // Matches sequences of letters and numbers, preserving hyphens within words
  const wordPattern = /[\p{L}\p{N}]+(?:[-'][\p{L}\p{N}]+)*/gu;

  let match: RegExpExecArray | null;
  let tokenIndex = 0;

  while ((match = wordPattern.exec(processedSentence)) !== null) {
    const surfaceForm = match[0];
    const position = sentenceStartPosition + match.index;

    // Check if this is a contraction
    if (isContraction(surfaceForm, languageCode)) {
      const parts = splitContraction(surfaceForm, languageCode);

      // Create token for contraction
      tokens.push({
        surfaceForm,
        cleanForm: parts[0].toLowerCase(),
        position,
        sentenceIndex,
        tokenIndex: tokenIndex++,
        isWord: true,
        isContraction: true,
        subTokens: parts,
      });
    } else {
      // Regular word token
      tokens.push({
        surfaceForm,
        cleanForm: surfaceForm.toLowerCase(),
        position,
        sentenceIndex,
        tokenIndex: tokenIndex++,
        isWord: true,
      });
    }
  }

  return tokens;
}

// ============================================================================
// Main Tokenization Function
// ============================================================================

/**
 * Tokenize text into words with position metadata
 *
 * **Process:**
 * 1. Apply character substitutions (accent normalization)
 * 2. Split into sentences (language-specific regex)
 * 3. Split sentences into words (Unicode-aware)
 * 4. Handle contractions (split but preserve)
 * 5. Track character positions for each token
 *
 * @param content - Text to tokenize
 * @param options - Tokenization options (language, regex, substitutions, etc.)
 * @returns Array of tokens with position metadata
 *
 * @example
 * const tokens = await tokenizeText("Hello world! Don't stop.", {
 *   languageCode: 'en',
 *   sentenceSplitRegex: '[.!?]+'
 * });
 * // => [
 * //   { surfaceForm: 'Hello', cleanForm: 'hello', position: 0, sentenceIndex: 0, ... },
 * //   { surfaceForm: 'world', cleanForm: 'world', position: 6, sentenceIndex: 0, ... },
 * //   { surfaceForm: "Don't", cleanForm: 'do', position: 13, sentenceIndex: 0, isContraction: true, subTokens: ['do', "n't"], ... },
 * //   { surfaceForm: 'stop', cleanForm: 'stop', position: 19, sentenceIndex: 0, ... }
 * // ]
 */
export async function tokenizeText(
  content: string,
  options: TokenizeOptions
): Promise<Token[]> {
  const {
    languageCode,
    sentenceSplitRegex = '[.!?]+',
    characterSubstitutions = {},
    isRTL: isRTLLanguage = false,
  } = options;

  if (!content || content.trim().length === 0) {
    return [];
  }

  // Step 1: Apply character substitutions
  const normalizedContent = applyCharacterSubstitutions(
    content,
    characterSubstitutions
  );

  // Step 2: Split into sentences
  const sentences = splitIntoSentences(normalizedContent, sentenceSplitRegex);

  // Step 3: Tokenize each sentence
  const allTokens: Token[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const { text, startPosition } = sentences[i];

    const sentenceTokens = tokenizeSentence(
      text,
      languageCode,
      i,
      startPosition,
      isRTLLanguage
    );

    allTokens.push(...sentenceTokens);
  }

  return allTokens;
}

/**
 * Quick tokenization for statistics (word count, etc.)
 *
 * Simpler and faster than full tokenizeText() - doesn't track positions.
 * Use this for calculating text statistics or previews.
 *
 * @param content - Text to tokenize
 * @param languageCode - ISO 639-1 language code
 * @returns Array of word strings
 *
 * @example
 * const words = quickTokenize("Hello world! Don't stop.", 'en');
 * // => ['Hello', 'world', "Don't", 'stop']
 */
export function quickTokenize(
  content: string,
  languageCode: string
): string[] {
  if (!content || content.trim().length === 0) {
    return [];
  }

  // Unicode-aware word matching
  const words = content.match(/[\p{L}\p{N}]+(?:[-'][\p{L}\p{N}]+)*/gu) || [];

  return words;
}

/**
 * Get word count for a text
 *
 * @param content - Text to count
 * @param languageCode - ISO 639-1 language code
 * @returns Number of words
 *
 * @example
 * getWordCount("Hello world! Don't stop.", 'en')  // => 4
 */
export function getWordCount(content: string, languageCode: string): number {
  return quickTokenize(content, languageCode).length;
}

/**
 * Get unique word count for a text
 *
 * @param content - Text to analyze
 * @param languageCode - ISO 639-1 language code
 * @returns Number of unique words (case-insensitive)
 *
 * @example
 * getUniqueWordCount("Hello world hello world", 'en')  // => 2
 */
export function getUniqueWordCount(
  content: string,
  languageCode: string
): number {
  const words = quickTokenize(content, languageCode);
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  return uniqueWords.size;
}
