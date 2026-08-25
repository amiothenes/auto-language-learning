import type { WordData } from '@/lib/types';
import type { WordInstanceItem } from '@/lib/types/api';

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
    userFrequency: inst.userFrequency,
    status: inst.status,
    inflectionData: inst.inflectionData ?? null,
    meanings: inst.meanings ?? null,
    exampleSentence: inst.exampleSentence ?? null,
    exampleSentenceTranslation: inst.exampleSentenceTranslation ?? null,
  };
}
