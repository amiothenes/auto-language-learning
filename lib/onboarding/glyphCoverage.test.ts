import { describe, it, expect } from 'vitest';
import deck from '@/content/es/deck.generated.json';
import { GLYPH_IDS } from '@/components/riso/glyphs/Glyphs';
import { TYPOGRAPHIC_ONLY } from '@/components/riso/glyphs/typographicOnly';

/**
 * Every starter-deck concept must either have a riso glyph or be a deliberate
 * typographic card (grammar words, abstractions, and a few concepts a
 * picture would treat insensitively). This catches new deck words that would
 * otherwise silently ship without a decision.
 */
describe('starter deck glyph coverage', () => {
  const ids = (deck.cards as Array<{ conceptId: string; kind: string }>).map((c) => c.conceptId);
  const glyphs = new Set(GLYPH_IDS);
  const typographic = new Set(TYPOGRAPHIC_ONLY);

  it('has a decision for every concept', () => {
    const undecided = ids.filter((id) => !glyphs.has(id) && !typographic.has(id));
    expect(undecided).toEqual([]);
  });

  it('never lists a concept as both', () => {
    expect(TYPOGRAPHIC_ONLY.filter((id) => glyphs.has(id))).toEqual([]);
  });

  it('pictures most of the deck', () => {
    const pictured = ids.filter((id) => glyphs.has(id)).length;
    expect(pictured / ids.length).toBeGreaterThan(0.75);
  });
});
