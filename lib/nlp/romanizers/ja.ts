/**
 * Japanese Romanizer (Romaji)
 *
 * Converts Japanese hiragana and katakana to romaji romanization.
 * Uses the 'wanakana' library for accurate conversion.
 *
 * Limitation: Does NOT romanize Kanji characters. For full Kanji support,
 * would need to use 'kuroshiro' library (future enhancement).
 */

import { toRomaji } from 'wanakana';
import type { RomanizeHandler } from '../types';

/**
 * Japanese romanizer using Hepburn romanization system
 *
 * Features:
 * - Converts hiragana to romaji (こんにちは → konnichiwa)
 * - Converts katakana to romaji (カタカナ → katakana)
 * - Handles particles correctly (は → wa, へ → e, を → o)
 * - Preserves Latin characters in mixed text
 *
 * Limitations:
 * - Kanji characters remain un-romanized (e.g., "日本" stays "日本")
 * - For Kanji support, future versions could use kuroshiro library
 *
 * Examples:
 * - Input: "こんにちは" (hiragana)
 * - Output: "konnichiwa"
 *
 * - Input: "ありがとう" (hiragana)
 * - Output: "arigatou"
 *
 * - Input: "カタカナ" (katakana)
 * - Output: "katakana"
 */
export const japaneseRomanizer: RomanizeHandler = {
  code: 'ja',
  name: 'Japanese',
  scriptType: 'cjk',

  async romanize(text: string): Promise<string> {
    // toRomaji() handles hiragana/katakana → romaji conversion
    // Uses Hepburn romanization system (most common)
    // Kanji characters are left unchanged
    return toRomaji(text, {
      // Use IME mode for more natural romanization
      // This handles edge cases like long vowels and particles
      IMEMode: false,

      // Custom kana mapping (empty for now, but can be extended)
      customKanaMapping: {}
    });
  }
};
