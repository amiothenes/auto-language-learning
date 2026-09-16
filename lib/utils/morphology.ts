// Shared morph (grammar) formatting — spaCy's token.morph.to_dict() output,
// keyed by feature name (e.g. { Case: "Ins", Number: "Sing" }). Used by the
// word tooltip's grammar line and the 1T Anki export's Grammar column, so
// both render the same labels from the same priority order.

export const MORPH_PRIORITY = ['tense', 'case', 'number'] as const;

export const MORPH_LABELS: Record<string, string> = {
  tense: 'Tense', case: 'Case', number: 'Number', mood: 'Mood',
  gender: 'Gender', voice: 'Voice', aspect: 'Aspect', person: 'Person',
};

/** Short inline summary, e.g. "Ins, Sing" — tense/case/number only. */
export function buildMorphSummary(data: Record<string, unknown>): string {
  const d = Object.fromEntries(Object.entries(data).map(([k, v]) => [k.toLowerCase(), v]));
  return MORPH_PRIORITY.filter((k) => d[k]).map((k) => String(d[k])).join(', ');
}

/** Full labeled form, e.g. "Case: Ins · Number: Sing" — every known feature. */
export function buildMorphFull(data: Record<string, unknown>): string {
  const d = Object.fromEntries(Object.entries(data).map(([k, v]) => [k.toLowerCase(), v]));
  const order = ['tense', 'mood', 'person', 'number', 'gender', 'case', 'voice', 'aspect'];
  return order
    .filter((k) => d[k])
    .map((k) => `${MORPH_LABELS[k] ?? k}: ${d[k]}`)
    .join(' · ');
}
