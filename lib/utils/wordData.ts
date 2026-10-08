import type { WordData } from '@/lib/types';
import type { WordInstanceItem } from '@/lib/types/api';
import type { VocabularyItem } from '@/lib/types/vocabulary';

export function formatInflection(inflectionData: Record<string, unknown>): string {
  const d = Object.fromEntries(Object.entries(inflectionData).map(([k, v]) => [k.toLowerCase(), v]));
  const parts: string[] = [];
  if (d.tense) parts.push(String(d.tense));
  if (d.mood) parts.push(String(d.mood));
  if (d.person) parts.push(`${d.person}p`);
  if (d.number) parts.push(String(d.number));
  if (d.gender) parts.push(String(d.gender));
  if (d.case) parts.push(String(d.case));
  if (d.voice) parts.push(String(d.voice));
  if (d.aspect) parts.push(String(d.aspect));
  return parts.length > 0 ? parts.join(', ') : 'base form';
}

/** Comma-joins every distinct definition across a word's meanings (capped, to
 * keep compact list rows readable), falling back to the single pre-picked
 * `translation` when no `meanings` are available yet. */
export function formatTranslationList(
  translation: string,
  meanings: { definitions: string[] }[] | null | undefined,
  maxDefinitions = 5
): string {
  if (!meanings || meanings.length === 0) return translation;
  const seen = new Set<string>();
  const definitions: string[] = [];
  for (const meaning of meanings) {
    for (const def of meaning.definitions) {
      if (seen.has(def)) continue;
      seen.add(def);
      definitions.push(def);
      if (definitions.length >= maxDefinitions) break;
    }
    if (definitions.length >= maxDefinitions) break;
  }
  return definitions.length > 0 ? definitions.join(', ') : translation;
}

/** Mirrors ReaderContent.tsx's per-token WordData construction — single
 * source of truth so Tutor Mode can build the same shape to programmatically
 * open the same tooltip/sheet a real tap would, without duplicating this. */
export function buildWordDataFromInstance(inst: WordInstanceItem): WordData {
  return {
    id: inst.instanceId,
    wordId: inst.wordId,
    surface: inst.surface,
    lemma: inst.lemma,
    pos: inst.pos ?? 'UNKNOWN',
    inflection: inst.inflectionData ? formatInflection(inst.inflectionData) : 'base form',
    translation: inst.translation ?? '—',
    dictionaryFrequency: inst.dictionaryFrequency,
    frequencyPercentile: inst.frequencyPercentile,
    userFrequency: inst.userFrequency,
    status: inst.status,
    inflectionData: inst.inflectionData ?? null,
    meanings: inst.meanings ?? null,
    exampleSentence: inst.exampleSentence ?? null,
    exampleSentenceTranslation: inst.exampleSentenceTranslation ?? null,
  };
}

/** Builds the same WordData shape from lemma-level VocabularyItem (the
 * /vocabulary page's data), so the Reader's WordDetailsPanel can be reused
 * there. No instance exists at this level, so surface = lemma and
 * inflectionData is null — WordDetailsPanel already hides the
 * surface-form and Morphology sections when those are absent. */
export function buildWordDataFromVocabularyItem(item: VocabularyItem): WordData {
  const topMeaning = item.meanings?.reduce(
    (best, m) => (!best || m.confidence > best.confidence ? m : best),
    undefined as { pos: string; definitions: string[]; confidence: number } | undefined
  );

  return {
    id: item.id,
    wordId: item.id,
    surface: item.lemma,
    lemma: item.lemma,
    pos: topMeaning?.pos ?? 'UNKNOWN',
    inflection: 'base form',
    translation: item.translation ?? '—',
    dictionaryFrequency: item.dictionaryFrequency,
    frequencyPercentile: item.frequencyPercentile ?? null,
    userFrequency: item.userFrequency,
    status: item.status,
    inflectionData: null,
    meanings: item.meanings ?? null,
    exampleSentence: null,
    exampleSentenceTranslation: null,
  };
}
