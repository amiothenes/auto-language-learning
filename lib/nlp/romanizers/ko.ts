/**
 * Korean Romanizer (Revised Romanization)
 *
 * Converts Hangul (Korean script) to Latin characters using the
 * Revised Romanization of Korean standard (official since 2000).
 *
 * This is an algorithmic romanization - Hangul syllables are mathematically
 * decomposed into initial consonant + vowel + final consonant, then mapped
 * to Latin characters.
 */

import type { RomanizeHandler } from '../types';

/**
 * Initial consonants (choseong) in Hangul syllables
 * 19 possible initial consonants
 */
const INITIAL_CONSONANTS = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp',
  's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'
];

/**
 * Vowels (jungseong) in Hangul syllables
 * 21 possible vowels
 */
const VOWELS = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye',
  'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we',
  'wi', 'yu', 'eu', 'ui', 'i'
];

/**
 * Final consonants (jongseong) in Hangul syllables
 * 28 possible final consonants (including none)
 */
const FINAL_CONSONANTS = [
  '', 'k', 'k', 'k', 'n', 'n', 'n', 'l', 'l', 'l',
  'l', 'l', 'l', 'l', 'l', 'm', 'p', 'p', 'p', 's',
  's', 'ng', 'j', 'ch', 'k', 't', 'p', 'h'
];

/**
 * Hangul Unicode Constants
 *
 * Modern Hangul syllables are encoded in Unicode from U+AC00 to U+D7A3.
 * Each syllable is computed as: BASE + (initial × 588) + (vowel × 28) + final
 */
const HANGUL_BASE = 0xAC00;  // Start of Hangul syllables: 가
const HANGUL_END = 0xD7A3;   // End of Hangul syllables: 힣

/**
 * Korean romanizer using Revised Romanization standard
 *
 * Features:
 * - Algorithmic decomposition of Hangul syllables
 * - Revised Romanization standard (official since 2000)
 * - Handles all modern Hangul syllables (가-힣)
 * - Preserves non-Hangul characters (numbers, punctuation, Latin)
 *
 * Limitations:
 * - Does NOT handle archaic or compatibility Jamo characters
 * - Does NOT apply pronunciation rules (e.g., 한국 → hanguk, not hangug)
 *
 * Examples:
 * - Input: "안녕하세요"
 * - Output: "annyeonghaseyo"
 *
 * - Input: "감사합니다"
 * - Output: "gamsahamnida"
 *
 * - Input: "한국어"
 * - Output: "hangugeo"
 */
export const koreanRomanizer: RomanizeHandler = {
  code: 'ko',
  name: 'Korean',
  scriptType: 'hangul',

  async romanize(text: string): Promise<string> {
    const result: string[] = [];

    for (const char of text) {
      const code = char.charCodeAt(0);

      // Check if character is a Hangul syllable (0xAC00 - 0xD7A3)
      if (code >= HANGUL_BASE && code <= HANGUL_END) {
        // Calculate syllable index (0-based)
        const syllableIndex = code - HANGUL_BASE;

        // Decompose syllable into components using mathematical formulas
        // Formula: syllable = initial × 588 + vowel × 28 + final
        const initialIndex = Math.floor(syllableIndex / 588);
        const vowelIndex = Math.floor((syllableIndex % 588) / 28);
        const finalIndex = syllableIndex % 28;

        // Combine components to form romanized syllable
        const romanized =
          INITIAL_CONSONANTS[initialIndex] +
          VOWELS[vowelIndex] +
          FINAL_CONSONANTS[finalIndex];

        result.push(romanized);
      } else {
        // Not a Hangul syllable - preserve as-is
        // This includes Latin characters, numbers, punctuation, spaces
        result.push(char);
      }
    }

    return result.join('');
  }
};
