/**
 * RTL (Right-to-Left) Text Handler
 *
 * Utilities for handling RTL languages (Arabic, Hebrew, Persian, etc.)
 * in the NLP pipeline.
 *
 * Note: Visual rendering is handled by the browser's bidirectional algorithm.
 * This module focuses on logical text processing.
 */

/**
 * Unicode ranges for RTL scripts
 */
const RTL_RANGES = {
  // Arabic (U+0600 to U+06FF)
  arabic: /[\u0600-\u06FF]/,

  // Arabic Supplement (U+0750 to U+077F)
  arabicSupplement: /[\u0750-\u077F]/,

  // Arabic Extended-A (U+08A0 to U+08FF)
  arabicExtended: /[\u08A0-\u08FF]/,

  // Hebrew (U+0590 to U+05FF)
  hebrew: /[\u0590-\u05FF]/,

  // Persian/Farsi specific characters
  persian: /[\u06A9\u06AF\u06CC\u06F0-\u06F9]/,

  // Thaana (Maldivian) (U+0780 to U+07BF)
  thaana: /[\u0780-\u07BF]/,

  // N'Ko (U+07C0 to U+07FF)
  nko: /[\u07C0-\u07FF]/,
};

/**
 * Check if text contains RTL characters
 *
 * @param text - Text to check
 * @returns True if text contains any RTL characters
 *
 * @example
 * isRTL('Hello')           // => false
 * isRTL('مرحبا')           // => true (Arabic)
 * isRTL('שלום')            // => true (Hebrew)
 * isRTL('Hello مرحبا')     // => true (mixed)
 */
export function isRTL(text: string): boolean {
  return Object.values(RTL_RANGES).some((range) => range.test(text));
}

/**
 * Detect if text is primarily RTL
 *
 * Returns true if > 50% of characters are RTL.
 *
 * @param text - Text to analyze
 * @returns True if text is primarily RTL
 *
 * @example
 * isPrimarilyRTL('مرحبا world')  // => false (50% RTL)
 * isPrimarilyRTL('مرحبا بك')     // => true (100% RTL)
 */
export function isPrimarilyRTL(text: string): boolean {
  const chars = text.split('');
  const rtlChars = chars.filter((char) => isRTL(char)).length;
  return rtlChars > chars.length / 2;
}

/**
 * Get the script type of text
 *
 * @param text - Text to analyze
 * @returns Script type ('arabic', 'hebrew', 'persian', 'mixed', 'ltr')
 *
 * @example
 * getScriptType('مرحبا')  // => 'arabic'
 * getScriptType('שלום')   // => 'hebrew'
 * getScriptType('Hello')  // => 'ltr'
 */
export function getScriptType(
  text: string
): 'arabic' | 'hebrew' | 'persian' | 'mixed' | 'ltr' {
  const hasArabic = RTL_RANGES.arabic.test(text);
  const hasHebrew = RTL_RANGES.hebrew.test(text);
  const hasPersian = RTL_RANGES.persian.test(text);

  // Check for mixed scripts
  const scriptCount =
    (hasArabic ? 1 : 0) + (hasHebrew ? 1 : 0) + (hasPersian ? 1 : 0);

  if (scriptCount > 1) {
    return 'mixed';
  }

  if (hasPersian || hasArabic) return 'arabic'; // Persian uses Arabic script
  if (hasHebrew) return 'hebrew';

  return 'ltr';
}

/**
 * Normalize RTL text for processing
 *
 * Removes RTL marks and normalizes whitespace.
 * Preserves logical order (not visual order).
 *
 * @param text - RTL text to normalize
 * @returns Normalized text
 *
 * @example
 * normalizeRTL('  مرحبا  ')  // => 'مرحبا'
 */
export function normalizeRTL(text: string): string {
  return (
    text
      // Remove RTL/LTR marks (U+200E, U+200F, U+202A, U+202B, U+202C, U+202D, U+202E)
      .replace(/[\u200E\u200F\u202A-\u202E]/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Extract Arabic diacritics (harakat) from text
 *
 * Arabic uses diacritics for vowel marks. These can be stripped
 * for lemmatization but preserved for display.
 *
 * @param text - Arabic text
 * @returns Object with text and diacritics
 *
 * @example
 * extractDiacritics('مَرْحَبًا')
 * // => {
 * //   text: 'مرحبا',
 * //   diacritics: ['َ', 'ْ', 'َ', 'ً']
 * // }
 */
export function extractDiacritics(text: string): {
  text: string;
  diacritics: string[];
} {
  const diacritics: string[] = [];

  // Arabic diacritics (harakat)
  const diacriticPattern = /[\u064B-\u065F\u0670]/g;

  const cleanText = text.replace(diacriticPattern, (match) => {
    diacritics.push(match);
    return '';
  });

  return {
    text: cleanText,
    diacritics,
  };
}

/**
 * Strip Arabic diacritics for lemmatization
 *
 * @param text - Arabic text with diacritics
 * @returns Text without diacritics
 *
 * @example
 * stripDiacritics('مَرْحَبًا')  // => 'مرحبا'
 */
export function stripDiacritics(text: string): string {
  return extractDiacritics(text).text;
}

/**
 * Normalize Arabic characters for consistent processing
 *
 * Handles character variants:
 * - Alef variants: أ، إ، آ، ا
 * - Hamza variants
 * - Tah Marbuta vs Hah
 *
 * @param text - Arabic text
 * @returns Normalized text
 */
export function normalizeArabic(text: string): string {
  return (
    text
      // Normalize Alef variants
      .replace(/[أإآ]/g, 'ا')
      // Normalize Hamza variants
      .replace(/[ؤئ]/g, 'ء')
      // Normalize Tah Marbuta to Hah (for some normalization schemes)
      // .replace(/ة/g, 'ه')  // Optional: can affect lemmatization accuracy
      // Strip diacritics
      .replace(/[\u064B-\u065F\u0670]/g, '')
  );
}
