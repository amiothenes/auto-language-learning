/**
 * Fallback Language Handler
 *
 * Generic handler for unsupported languages.
 * Returns the surface form as lemma with confidence=0.
 *
 * Used when no language-specific handler is available.
 */

import type { LanguageHandler } from '../types';

/**
 * Fallback handler for unsupported languages
 *
 * Simply returns the lowercased surface form as the lemma.
 * Confidence is set to 0 to indicate no actual lemmatization occurred.
 */
export const fallbackHandler: LanguageHandler = {
  code: 'fallback',
  name: 'Fallback (Generic)',

  async lemmatize(
    word: string,
    _pos: string,
    _morphFeatures: Record<string, string>
  ): Promise<string> {
    // Return lowercase surface form
    return word.toLowerCase();
  },
};
