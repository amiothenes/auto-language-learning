/**
 * Contraction Handler
 *
 * Handles language-specific contractions by splitting them into
 * constituent parts while preserving original position information.
 *
 * Supports:
 * - English: don't → do + n't, I've → I + 've
 * - French: l'histoire → l' + histoire, qu'il → qu' + il
 */

/**
 * Contraction patterns for English
 *
 * Maps contractions to their constituent parts.
 * Order matters: check longer patterns first.
 */
const ENGLISH_CONTRACTIONS: Array<{
  pattern: RegExp;
  split: (match: string) => string[];
}> = [
  // Special cases
  {
    pattern: /won't$/i,
    split: () => ['will', 'not'],
  },
  {
    pattern: /can't$/i,
    split: () => ['can', 'not'],
  },
  {
    pattern: /n't$/i,
    split: (match) => [match.slice(0, -3), "n't"],
  },

  // Common contractions
  {
    pattern: /'ll$/i,
    split: (match) => [match.slice(0, -3), "'ll"],
  },
  {
    pattern: /'re$/i,
    split: (match) => [match.slice(0, -3), "'re"],
  },
  {
    pattern: /'ve$/i,
    split: (match) => [match.slice(0, -3), "'ve"],
  },
  {
    pattern: /'d$/i,
    split: (match) => [match.slice(0, -2), "'d"],
  },
  {
    pattern: /'s$/i,
    split: (match) => [match.slice(0, -2), "'s"],
  },
  {
    pattern: /'m$/i,
    split: (match) => [match.slice(0, -2), "'m"],
  },
];

/**
 * Contraction patterns for French
 *
 * French uses elision (l', d', qu', etc.) before vowels.
 */
const FRENCH_CONTRACTIONS: Array<{
  pattern: RegExp;
  split: (match: string) => string[];
}> = [
  {
    pattern: /^qu'/i,
    split: (match) => ["qu'", match.slice(3)],
  },
  {
    pattern: /^[ldcjnmtscçLD]'/i,
    split: (match) => [match.slice(0, 2), match.slice(2)],
  },
];

/**
 * Check if a word is a contraction in the given language
 *
 * @param word - Word to check
 * @param languageCode - ISO 639-1 language code
 * @returns True if word is a contraction
 *
 * @example
 * isContraction("don't", 'en')  // => true
 * isContraction("hello", 'en')  // => false
 * isContraction("l'école", 'fr') // => true
 */
export function isContraction(word: string, languageCode: string): boolean {
  const patterns =
    languageCode === 'en'
      ? ENGLISH_CONTRACTIONS
      : languageCode === 'fr'
      ? FRENCH_CONTRACTIONS
      : [];

  return patterns.some((p) => p.pattern.test(word));
}

/**
 * Split a contraction into its constituent parts
 *
 * @param word - Contraction to split
 * @param languageCode - ISO 639-1 language code
 * @returns Array of parts, or original word if not a contraction
 *
 * @example
 * splitContraction("don't", 'en')
 * // => ["do", "n't"]
 *
 * splitContraction("I've", 'en')
 * // => ["I", "'ve"]
 *
 * splitContraction("l'histoire", 'fr')
 * // => ["l'", "histoire"]
 *
 * splitContraction("hello", 'en')
 * // => ["hello"] (not a contraction)
 */
export function splitContraction(
  word: string,
  languageCode: string
): string[] {
  const patterns =
    languageCode === 'en'
      ? ENGLISH_CONTRACTIONS
      : languageCode === 'fr'
      ? FRENCH_CONTRACTIONS
      : [];

  for (const { pattern, split } of patterns) {
    if (pattern.test(word)) {
      return split(word);
    }
  }

  // Not a contraction
  return [word];
}

/**
 * Expand contractions for lemmatization
 *
 * Returns the primary word form for lemmatization purposes.
 * For example, "don't" → "do" (the verb part)
 *
 * @param word - Contraction to expand
 * @param languageCode - ISO 639-1 language code
 * @returns Primary word form
 *
 * @example
 * expandContraction("don't", 'en')    // => "do"
 * expandContraction("I've", 'en')     // => "I"
 * expandContraction("l'école", 'fr')  // => "école"
 */
export function expandContraction(
  word: string,
  languageCode: string
): string {
  const parts = splitContraction(word, languageCode);

  // Return first part (primary word)
  // For French elision, return second part (the actual word)
  if (languageCode === 'fr' && parts.length === 2 && parts[0].match(/^[a-z]'$/i)) {
    return parts[1];
  }

  return parts[0];
}
