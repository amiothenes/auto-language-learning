import type { TranslationMeaning } from '../db/schema/wordTranslations';

// Maps ISO 639-1 codes to the language section names used in English Wiktionary
const LANG_SECTION_NAMES: Record<string, string> = {
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  ja: 'Japanese',
  zh: 'Chinese',
  ko: 'Korean',
  ar: 'Arabic',
  nl: 'Dutch',
  pl: 'Polish',
  sv: 'Swedish',
  no: 'Norwegian',
  da: 'Danish',
  fi: 'Finnish',
  tr: 'Turkish',
  uk: 'Ukrainian',
};

type WiktionaryDefinition = {
  partOfSpeech: string;
  language: string;
  definitions: { definition: string; examples?: string[] }[];
};

type WiktionaryResponse = Record<string, WiktionaryDefinition[]>;

export type WiktionaryResult = {
  meanings: TranslationMeaning[];
  exampleSentence: string | null;
};

/**
 * Looks up a lemma on English Wiktionary.
 * Returns parsed meanings grouped by POS for the given source language, or null if not found.
 */
export async function wiktionaryLookup(
  lemma: string,
  sourceLangCode: string
): Promise<WiktionaryResult | null> {
  const sectionName = LANG_SECTION_NAMES[sourceLangCode.toLowerCase()];
  if (!sectionName) return null;

  const encoded = encodeURIComponent(lemma.toLowerCase());
  const url = `https://en.wiktionary.org/api/rest_v1/page/definition/${encoded}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': 'auto-language-learning/1.0 (language learning app)' },
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    return null;
  }

  if (res.status === 404) return null;
  if (!res.ok) return null;

  const data: WiktionaryResponse = await res.json();
  const sections = data[sectionName];
  if (!sections || sections.length === 0) return null;

  const meanings: TranslationMeaning[] = sections.map((section) => ({
    pos: normalizePOS(section.partOfSpeech),
    definitions: section.definitions
      .slice(0, 5)
      .map((d) => stripHtml(d.definition))
      .filter(Boolean),
    confidence: 1.0,
  }));

  const exampleSentence =
    sections
      .flatMap((s) => s.definitions)
      .flatMap((d) => d.examples ?? [])
      .map(stripHtml)
      .find((e) => e.length > 0) ?? null;

  return { meanings, exampleSentence };
}

function normalizePOS(raw: string): string {
  return raw.toUpperCase().replace(/\s+/g, '_');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}
