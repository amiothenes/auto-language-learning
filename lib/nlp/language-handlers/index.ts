/**
 * Language Handler Registry
 *
 * Central registry for all language-specific lemmatization handlers.
 * Maps language codes to their respective handlers.
 */

import type { LanguageHandler } from '../types';
import { englishHandler } from './en';
import { spanishHandler } from './es';
import { fallbackHandler } from './fallback';

/**
 * Registry of all available language handlers
 *
 * Keys are ISO 639-1 language codes (e.g., 'en', 'es', 'fr')
 * Values are LanguageHandler implementations
 */
export const languageHandlers: Record<string, LanguageHandler> = {
  'en': englishHandler,
  'es': spanishHandler,
  // Additional languages can be added here:
  // 'fr': frenchHandler,
  // 'de': germanHandler,
  // 'ru': russianHandler,
  // 'zh': chineseHandler,
  // 'ja': japaneseHandler,
  // 'ar': arabicHandler,
};

/**
 * Get language handler for a given language code
 *
 * Returns the specific handler if available, otherwise returns fallback.
 *
 * @param languageCode - ISO 639-1 language code
 * @returns Language handler or fallback
 *
 * @example
 * const handler = getLanguageHandler('en');
 * const lemma = await handler.lemmatize('running', 'VERB', {});
 */
export function getLanguageHandler(languageCode: string): LanguageHandler {
  return languageHandlers[languageCode] || fallbackHandler;
}

/**
 * Check if a language is supported
 *
 * @param languageCode - ISO 639-1 language code
 * @returns True if language has a specific handler
 *
 * @example
 * isLanguageSupported('en') // => true
 * isLanguageSupported('zh') // => false (not yet implemented)
 */
export function isLanguageSupported(languageCode: string): boolean {
  return languageCode in languageHandlers;
}

/**
 * Get list of all supported language codes
 *
 * @returns Array of supported language codes
 *
 * @example
 * getSupportedLanguages() // => ['en', 'es']
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(languageHandlers);
}
