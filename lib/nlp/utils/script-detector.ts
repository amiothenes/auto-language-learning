/**
 * Script Type Detection Utility
 *
 * Detects the writing script used in text to determine if romanization
 * is needed. Supports detection of Latin, CJK (Chinese/Japanese/Korean),
 * Arabic, Cyrillic, and Hangul scripts.
 */

import type { ScriptType } from '../types';

/**
 * Detect primary script type of text
 *
 * Checks text against Unicode ranges for different writing systems.
 * Returns the first matching script type found.
 *
 * @param text - Text to analyze
 * @returns Detected script type
 *
 * @example
 * detectScriptType('你好') // => 'cjk'
 * detectScriptType('مرحبا') // => 'arabic'
 * detectScriptType('привет') // => 'cyrillic'
 * detectScriptType('안녕') // => 'hangul'
 * detectScriptType('hello') // => 'latin'
 */
export function detectScriptType(text: string): ScriptType {
  // CJK (Chinese, Japanese, Korean) - Unicode ranges
  // U+4E00–U+9FFF: CJK Unified Ideographs (Chinese characters)
  // U+3040–U+309F: Hiragana (Japanese)
  // U+30A0–U+30FF: Katakana (Japanese)
  const cjkPattern = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/;
  if (cjkPattern.test(text)) {
    return 'cjk';
  }

  // Arabic - Unicode range
  // U+0600–U+06FF: Arabic script
  const arabicPattern = /[\u0600-\u06FF]/;
  if (arabicPattern.test(text)) {
    return 'arabic';
  }

  // Cyrillic (Russian, Ukrainian, Bulgarian, etc.)
  // U+0400–U+04FF: Cyrillic script
  const cyrillicPattern = /[\u0400-\u04FF]/;
  if (cyrillicPattern.test(text)) {
    return 'cyrillic';
  }

  // Hangul (Korean)
  // U+AC00–U+D7A3: Hangul syllables
  const hangulPattern = /[\uAC00-\uD7A3]/;
  if (hangulPattern.test(text)) {
    return 'hangul';
  }

  // Default to Latin script
  // Includes English, Spanish, French, German, etc.
  return 'latin';
}

/**
 * Check if text contains mixed scripts
 *
 * Analyzes each character to determine if multiple different
 * script types are present in the same text.
 *
 * @param text - Text to analyze
 * @returns True if text contains multiple script types
 *
 * @example
 * isMixedScript('你好world') // => true (CJK + Latin)
 * isMixedScript('こんにちは') // => false (only CJK)
 * isMixedScript('hello world') // => false (only Latin)
 */
export function isMixedScript(text: string): boolean {
  const scripts = new Set<ScriptType>();

  for (const char of text) {
    const script = detectScriptType(char);
    scripts.add(script);
  }

  return scripts.size > 1;
}

/**
 * Check if language requires romanization
 *
 * Determines if a language uses a non-Latin script and therefore
 * needs romanization for users unfamiliar with that script.
 *
 * @param languageCode - ISO 639-1 language code
 * @returns True if language requires romanization
 *
 * @example
 * requiresRomanization('zh') // => true (Chinese)
 * requiresRomanization('ja') // => true (Japanese)
 * requiresRomanization('ar') // => true (Arabic)
 * requiresRomanization('ru') // => true (Russian)
 * requiresRomanization('ko') // => true (Korean)
 * requiresRomanization('en') // => false (English - Latin script)
 * requiresRomanization('es') // => false (Spanish - Latin script)
 */
export function requiresRomanization(languageCode: string): boolean {
  const latinScriptLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt'];
  return !latinScriptLanguages.includes(languageCode);
}

// Map from language code to a regex that matches ONLY tokens in the language's expected script.
// Languages absent from this map (Latin-script languages) have no restriction.
const EXPECTED_SCRIPT_PATTERNS: Partial<Record<string, RegExp>> = {
  ru: /^[Ѐ-ӿ]+$/,
  be: /^[Ѐ-ӿ]+$/,
  bg: /^[Ѐ-ӿ]+$/,
  uk: /^[Ѐ-ӿ]+$/,
  sr: /^[Ѐ-ӿ]+$/,
  mk: /^[Ѐ-ӿ]+$/,
  ar: /^[؀-ۿ]+$/,
  fa: /^[؀-ۿ]+$/,
  zh: /^[一-鿿㐀-䶿]+$/,
  ja: /^[一-鿿぀-ゟ゠-ヿ]+$/,
  ko: /^[가-힣ᄀ-ᇿ]+$/,
  he: /^[֐-׿]+$/,
};

/**
 * Check whether a surface token belongs to the expected script for the given language.
 *
 * Used by the import pipeline when `includeForeignScript` is false to skip tokens
 * that are clearly not vocabulary for that language (e.g. Latin brand names in Russian text).
 *
 * Languages without a defined expected script (Latin-script languages) always return true.
 *
 * @param surface - The raw token string
 * @param languageCode - ISO 639-1 language code
 * @returns True if the token is in the expected script (or no script restriction applies)
 */
export function matchesLanguageScript(surface: string, languageCode: string): boolean {
  const pattern = EXPECTED_SCRIPT_PATTERNS[languageCode];
  return !pattern || pattern.test(surface);
}
