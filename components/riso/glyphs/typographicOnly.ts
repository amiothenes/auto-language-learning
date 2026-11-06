/**
 * Starter-deck concepts that deliberately have NO glyph and keep the
 * typographic card (word, gloss, example). Two reasons:
 *
 *  1. Grammar and abstract words a picture can't honestly say: "because",
 *     "if", "already" or "to want" would need a guessing game, not a picture.
 *     Wyner's method also teaches these through text and example sentences.
 *  2. Concepts a picture would treat crudely or insensitively: faith, violence,
 *     sex, ethnicity. Better as words in context.
 *
 * lib/onboarding/glyphCoverage.test.ts fails if a deck concept is neither here
 * nor in the glyph registry, so every new deck word gets an explicit decision.
 */
export const TYPOGRAPHIC_ONLY: string[] = [
  // 1. Grammar and abstractions
  'of-from', 'that-which', 'the', 'and', 'to-at', 'for-by-through', 'for-in-order-to',
  'his-her-their', 'like-as', 'if', 'but', 'my', 'all-everything', 'already', 'when',
  'to-be-identity', 'your', 'on-about', 'also', 'because', 'what', 'to-do-to-make', 'now',
  'much-many-very-muy', 'that', 'always', 'after-later', 'other-another', 'never', 'before',
  'little-few', 'to-have', 'how', 'to-be-state-place', 'someone', 'can-to-be-able',
  'truth-real', 'nobody', 'there-is-hay', 'to-know', 'who', 'still-yet', 'where', 'to-want',
  'how-much',
  // Parts-of-speech labels (Wyner uses them as tags, not pictures)
  'verb', 'adjective', 'noun',
  // 2. Sensitive concepts
  'god', 'religion', 'hell', 'sex', 'race-ethnicity', 'murder', 'to-kill', 'to-shoot',
];
