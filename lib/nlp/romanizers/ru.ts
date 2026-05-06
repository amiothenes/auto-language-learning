/**
 * Russian Romanizer (Cyrillic to Latin)
 *
 * Converts Russian Cyrillic script to Latin characters using
 * a straightforward character-by-character mapping.
 */

import type { RomanizeHandler } from '../types';

/**
 * Cyrillic to Latin character mapping
 *
 * Based on common romanization standards for Russian.
 * Handles all standard Russian Cyrillic letters.
 */
const CYRILLIC_TO_LATIN: Record<string, string> = {
  // Lowercase Cyrillic
  'а': 'a',
  'б': 'b',
  'в': 'v',
  'г': 'g',
  'д': 'd',
  'е': 'e',
  'ё': 'yo',
  'ж': 'zh',
  'з': 'z',
  'и': 'i',
  'й': 'y',
  'к': 'k',
  'л': 'l',
  'м': 'm',
  'н': 'n',
  'о': 'o',
  'п': 'p',
  'р': 'r',
  'с': 's',
  'т': 't',
  'у': 'u',
  'ф': 'f',
  'х': 'kh',
  'ц': 'ts',
  'ч': 'ch',
  'ш': 'sh',
  'щ': 'shch',
  'ъ': '',      // Hard sign (silent)
  'ы': 'y',
  'ь': '',      // Soft sign (silent)
  'э': 'e',
  'ю': 'yu',
  'я': 'ya',

  // Uppercase Cyrillic
  'А': 'A',
  'Б': 'B',
  'В': 'V',
  'Г': 'G',
  'Д': 'D',
  'Е': 'E',
  'Ё': 'Yo',
  'Ж': 'Zh',
  'З': 'Z',
  'И': 'I',
  'Й': 'Y',
  'К': 'K',
  'Л': 'L',
  'М': 'M',
  'Н': 'N',
  'О': 'O',
  'П': 'P',
  'Р': 'R',
  'С': 'S',
  'Т': 'T',
  'У': 'U',
  'Ф': 'F',
  'Х': 'Kh',
  'Ц': 'Ts',
  'Ч': 'Ch',
  'Ш': 'Sh',
  'Щ': 'Shch',
  'Ъ': '',      // Hard sign (silent)
  'Ы': 'Y',
  'Ь': '',      // Soft sign (silent)
  'Э': 'E',
  'Ю': 'Yu',
  'Я': 'Ya',
};

/**
 * Russian romanizer using Cyrillic-to-Latin mapping
 *
 * Features:
 * - Straightforward character mapping
 * - Handles both uppercase and lowercase
 * - Soft sign (ь) and hard sign (ъ) map to empty string
 * - Preserves non-Cyrillic characters (numbers, punctuation, Latin)
 *
 * Examples:
 * - Input: "привет"
 * - Output: "privet"
 *
 * - Input: "спасибо"
 * - Output: "spasibo"
 *
 * - Input: "Здравствуйте"
 * - Output: "Zdravstvuyte"
 */
export const russianRomanizer: RomanizeHandler = {
  code: 'ru',
  name: 'Russian',
  scriptType: 'cyrillic',

  async romanize(text: string): Promise<string> {
    // Character-by-character replacement
    // Non-Cyrillic characters (Latin, numbers, punctuation) are preserved
    return Array.from(text)
      .map(char => CYRILLIC_TO_LATIN[char] || char)
      .join('');
  }
};
