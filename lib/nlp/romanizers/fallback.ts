/**
 * Fallback Romanizer
 *
 * Returns null for Latin-script languages that don't require romanization.
 * Used for English, Spanish, French, German, and other Latin-alphabet languages.
 */

import type { RomanizeHandler } from '../types';

/**
 * Fallback romanizer for Latin-script languages
 *
 * Always returns null since Latin-script languages are already
 * in Latin characters and don't need romanization.
 */
export const fallbackRomanizer: RomanizeHandler = {
  code: 'fallback',
  name: 'Fallback',
  scriptType: 'latin',

  async romanize(): Promise<string | null> {
    // Latin scripts don't need romanization
    return null;
  }
};
