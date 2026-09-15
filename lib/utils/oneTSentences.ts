import { VocabularyStatus } from '@/lib/types/vocabulary';
import { findSentenceStart } from '@/lib/tts/alignment';
import { buildMorphFull } from '@/lib/utils/morphology';
import type { WordInstanceItem, SentenceListItem } from '@/lib/types/api';

// ============================================================================
// 1T sentence export — "1T" (sentence-mining jargon): a sentence with exactly
// one word the learner hasn't consolidated yet (NEWLY_SEEN), ideal for an SRS
// card. Pure, DB-free — same convention as calculateCompletionPercentage in
// textStats.ts — so it can run entirely client-side over data the Reader
// already has cached.
// ============================================================================

export interface OneTCard {
  /** Sentence text with the target word wrapped in <b>…</b> (HTML — Anki
   * fields render as HTML, not markdown). */
  sentenceHtml: string;
  targetWord: string;
  lemma: string;
  /** Human-readable grammar/inflection, e.g. "Case: Ins · Number: Sing". */
  grammar: string;
  translation: string;
}

/**
 * One card per sentence that (a) has no UNKNOWN word left — a sentence isn't
 * ready to mine until everything in it has at least been triaged — and (b)
 * has exactly one non-IGNORE word instance still NEWLY_SEEN. Sentences
 * failing to resolve an offset (see findSentenceStart) are skipped rather
 * than shipped with the wrong word marked.
 */
export function buildOneTCards(
  sentences: SentenceListItem[],
  instances: WordInstanceItem[],
): OneTCard[] {
  const bySentence = new Map<string, WordInstanceItem[]>();
  for (const inst of instances) {
    if (!inst.sentenceId) continue;
    const existing = bySentence.get(inst.sentenceId);
    if (existing) existing.push(inst);
    else bySentence.set(inst.sentenceId, [inst]);
  }

  const cards: OneTCard[] = [];

  for (const sentence of sentences) {
    const sentInstances = (bySentence.get(sentence.id) ?? [])
      .slice()
      .sort((a, b) => a.position - b.position);

    const hasUnknown = sentInstances.some((i) => i.status === VocabularyStatus.UNKNOWN);
    if (hasUnknown) continue;

    const gradable = sentInstances.filter((i) => i.status !== VocabularyStatus.IGNORE);
    const newlySeen = gradable.filter((i) => i.status === VocabularyStatus.NEWLY_SEEN);
    if (newlySeen.length !== 1) continue;

    const target = newlySeen[0];
    const sentenceStart = findSentenceStart(
      sentence.content,
      sentInstances.map((i) => ({ id: i.instanceId, surfaceForm: i.surface, position: i.position })),
    );
    if (sentenceStart === null) continue;

    const localStart = target.position - sentenceStart;
    const localEnd = localStart + target.surface.length;
    if (localStart < 0 || localEnd > sentence.content.length) continue;

    const sentenceHtml =
      sentence.content.slice(0, localStart) +
      '<b>' + sentence.content.slice(localStart, localEnd) + '</b>' +
      sentence.content.slice(localEnd);

    cards.push({
      sentenceHtml,
      targetWord: target.surface,
      lemma: target.lemma,
      grammar: target.inflectionData ? buildMorphFull(target.inflectionData) : '',
      translation: target.translation ?? '',
    });
  }

  return cards;
}

function escapeCsvField(val: string): string {
  return val.includes(',') || val.includes('"') || val.includes('\n')
    ? `"${val.replace(/"/g, '""')}"`
    : val;
}

/** Anki "Basic" note CSV — one row per card. Same BOM + escaping convention
 * as the existing vocabulary CSV export in TextInfo.tsx. */
export function buildOneTCsv(cards: OneTCard[]): string {
  const header = 'Sentence,Target Word,Lemma,Grammar,Translation\n';
  const body = cards
    .map((c) => [c.sentenceHtml, c.targetWord, c.lemma, c.grammar, c.translation]
      .map(escapeCsvField)
      .join(','))
    .join('\n');
  return '﻿' + header + body;
}
