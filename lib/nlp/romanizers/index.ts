/**
 * Romanizer Handler Registry
 *
 * Central registry for all language-specific romanization handlers.
 * Maps language codes to their respective romanizers.
 *
 * Pattern follows the same structure as language-handlers for lemmatization.
 */

import type { RomanizeHandler } from '../types';
import { chineseRomanizer } from './zh';
import { japaneseRomanizer } from './ja';
import { arabicRomanizer } from './ar';
import { russianRomanizer } from './ru';
import { koreanRomanizer } from './ko';
import { fallbackRomanizer } from './fallback';

/**
 * Registry of all available romanize handlers
 *
 * Keys are ISO 639-1 language codes (e.g., 'zh', 'ja', 'ar', 'ru', 'ko')
 * Values are RomanizeHandler implementations
 *
 * Languages NOT in this registry (e.g., 'en', 'es', 'fr', 'de') will
 * use the fallback handler which returns null (no romanization needed).
 */
export const romanizeHandlers: Record<string, RomanizeHandler> = {
  'zh': chineseRomanizer,    // Chinese (Simplified/Traditional) → Pinyin
  'ja': japaneseRomanizer,   // Japanese (Hiragana/Katakana) → Romaji
  'ar': arabicRomanizer,     // Arabic → Latin transliteration
  'ru': russianRomanizer,    // Russian (Cyrillic) → Latin
  'ko': koreanRomanizer,     // Korean (Hangul) → Revised Romanization
};

/**
 * Get romanize handler for a given language code
 *
 * Returns the specific handler if available for the language,
 * otherwise returns fallback handler (which returns null for Latin scripts).
 *
 * @param languageCode - ISO 639-1 language code
 * @returns Romanize handler or fallback
 *
 * @example
 * const handler = getRomanizeHandler('zh');
 * const romanized = await handler.romanize('你好'); // => 'nǐ hǎo'
 *
 * @example
 * const handler = getRomanizeHandler('en');
 * const romanized = await handler.romanize('hello'); // => null (fallback)
 */
export function getRomanizeHandler(languageCode: string): RomanizeHandler {
  return romanizeHandlers[languageCode] || fallbackRomanizer;
}

/**
 * Check if romanization is supported for a language
 *
 * Returns true if the language has a specific romanization handler.
 * Latin-script languages (EN, ES, FR, DE) return false.
 *
 * @param languageCode - ISO 639-1 language code
 * @returns True if language has a romanization handler
 *
 * @example
 * isRomanizationSupported('zh') // => true
 * isRomanizationSupported('ja') // => true
 * isRomanizationSupported('en') // => false
 * isRomanizationSupported('es') // => false
 */
export function isRomanizationSupported(languageCode: string): boolean {
  return languageCode in romanizeHandlers;
}

/**
 * Get list of all languages with romanization support
 *
 * Returns array of language codes that have romanization handlers.
 *
 * @returns Array of supported language codes
 *
 * @example
 * getSupportedRomanizations() // => ['zh', 'ja', 'ar', 'ru', 'ko']
 */
export function getSupportedRomanizations(): string[] {
  return Object.keys(romanizeHandlers);
}
