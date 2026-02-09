/**
 * Arabic Romanizer (Transliteration)
 *
 * Converts Arabic script to Latin characters using a simplified
 * transliteration table. This is NOT a pronunciation guide but
 * a character-by-character mapping for vocabulary learning.
 */

import { stripDiacritics } from '../utils/rtl';
import type { RomanizeHandler } from '../types';

/**
 * Arabic to Latin character mapping
 *
 * Based on common transliteration standards but simplified
 * for vocabulary learning purposes.
 */
const ARABIC_TO_LATIN: Record<string, string> = {
  // Alef variants
  'ا': 'a',
  'أ': 'a',
  'إ': 'i',
  'آ': 'aa',

  // Letters
  'ب': 'b',
  'ت': 't',
  'ث': 'th',
  'ج': 'j',
  'ح': 'h',
  'خ': 'kh',
  'د': 'd',
  'ذ': 'dh',
  'ر': 'r',
  'ز': 'z',
  'س': 's',
  'ش': 'sh',
  'ص': 's',
  'ض': 'd',
  'ط': 't',
  'ظ': 'z',
  'ع': "'",
  'غ': 'gh',
  'ف': 'f',
  'ق': 'q',
  'ك': 'k',
  'ل': 'l',
  'م': 'm',
  'ن': 'n',
  'ه': 'h',
  'و': 'w',
  'ي': 'y',

  // Special forms
  'ى': 'a',
  'ة': 'a',
  'ء': "'",

  // Additional characters
  'ئ': "'",
  'ؤ': "'",

  // Preserve numbers and spaces
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

/**
 * Arabic romanizer using simplified transliteration
 *
 * Features:
 * - Strips diacritics (harakat) before transliteration
 * - Character-by-character mapping to Latin script
 * - Preserves non-Arabic characters (numbers, punctuation, Latin)
 *
 * Note: This is a simplified transliteration, not perfect pronunciation.
 * Acceptable for vocabulary learning purposes.
 *
 * Example:
 * - Input: "مرحبا"
 * - Output: "mrhba"
 */
export const arabicRomanizer: RomanizeHandler = {
  code: 'ar',
  name: 'Arabic',
  scriptType: 'arabic',

  async romanize(text: string): Promise<string> {
    // Strip diacritics first (harakat vowel marks)
    // This uses existing RTL utility function
    const normalized = stripDiacritics(text);

    // Character-by-character replacement
    return Array.from(normalized)
      .map(char => ARABIC_TO_LATIN[char] || char)
      .join('');
  }
};
