/**
 * Chinese Romanizer (Pinyin)
 *
 * Converts Chinese characters to Pinyin romanization with tone marks.
 * Handles both Simplified and Traditional Chinese characters.
 * Uses the 'pinyin' library for accurate conversion.
 */

import pinyin from 'pinyin';
import type { RomanizeHandler, RomanizeOptions } from '../types';

/**
 * Chinese romanizer using Pinyin system
 *
 * Features:
 * - Converts Chinese characters to Pinyin with tone marks (nǐ hǎo)
 * - Handles polyphonic characters (same character, different pronunciations)
 * - Preserves Latin characters in mixed text
 * - Supports both Simplified and Traditional Chinese
 *
 * Example:
 * - Input: "你好世界"
 * - Output: "nǐ hǎo shì jiè"
 */
export const chineseRomanizer: RomanizeHandler = {
  code: 'zh',
  name: 'Chinese',
  scriptType: 'cjk',

  async romanize(text: string, options?: RomanizeOptions): Promise<string> {
    // Use tone marks by default (nǐ hǎo) vs tone numbers (ni3 hao3)
    const useToneMarks = options?.includeTones !== false;

    // pinyin() returns array of arrays: [['nǐ'], ['hǎo']]
    // Each inner array can contain multiple pronunciations for polyphonic characters
    const result = pinyin(text, {
      // STYLE_TONE uses tone marks (default), STYLE_TONE2 uses numbers
      style: useToneMarks ? pinyin.STYLE_TONE : pinyin.STYLE_TONE2,

      // Don't show multiple pronunciations - pick the most common one
      heteronym: false,

      // Use word segmentation for better context-aware romanization
      segment: true,

      // Group words together where possible
      group: true
    });

    // Flatten the nested arrays and join with spaces
    // Result format: [['nǐ'], ['hǎo']] => 'nǐ hǎo'
    return result
      .map(word => word[0]) // Take first (most common) pronunciation
      .join(' ')
      .trim();
  }
};
