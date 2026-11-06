import { describe, it, expect } from 'vitest';
import { pickNextStep, pickLibraryNext, type NextStepInput, type LibraryText } from './nextStep';

const base: NextStepInput = {
  guidedDone: true,
  dueCount: 0,
  continueText: null,
  story: null,
};

describe('pickNextStep', () => {
  it('starts with the guided read until it is done', () => {
    const s = pickNextStep({ ...base, guidedDone: false, dueCount: 12, story: { startTextId: 't1', nextChapter: null } });
    expect(s.kind).toBe('guided');
    expect(s.href).toBe('/reader/t1?guide=1');
  });

  it('skips the guided read when there is no story (fallback languages)', () => {
    expect(pickNextStep({ ...base, guidedDone: false }).kind).toBe('import');
  });

  it('puts due reviews before reading', () => {
    const s = pickNextStep({ ...base, dueCount: 1, continueText: { id: 'x', title: 'X', knownPercentage: 40 } });
    expect(s.kind).toBe('review');
    expect(s.title).toBe('1 word is waiting for you');
  });

  it('continues an unfinished text, then the next chapter, then import', () => {
    expect(pickNextStep({ ...base, continueText: { id: 'x', title: 'X', knownPercentage: 41.6 } })).toMatchObject({
      kind: 'continue',
      href: '/reader/x',
    });
    expect(pickNextStep({ ...base, story: { startTextId: 't1', nextChapter: { id: 'c3', title: 'La guardiana' } } })).toMatchObject({
      kind: 'chapter',
      href: '/reader/c3',
    });
    expect(pickNextStep(base)).toMatchObject({ kind: 'import', href: null });
  });

  it('offers to skip the tour', () => {
    const s = pickNextStep({ ...base, guidedDone: false, story: { startTextId: 't1', nextChapter: null } });
    expect(s.secondary?.action).toBe('skip-guided');
  });
});

describe('seasoned users and skipped/deleted stories', () => {
  const lib = { id: 'own2', title: 'My article', knownPercentage: 72 };

  it('own texts only (no story): suggests the next unopened text instead of "bring a text"', () => {
    expect(pickNextStep({ ...base, libraryNext: lib, hasReadOwnTexts: true })).toMatchObject({ kind: 'library', href: '/reader/own2' });
  });

  it('drops the tour once the learner is reading their own texts', () => {
    const s = pickNextStep({
      ...base,
      guidedDone: false,
      story: { startTextId: 't1', nextChapter: { id: 'c2', title: 'Ch 2' } },
      libraryNext: lib,
      hasReadOwnTexts: true,
      prefersOwnTexts: true,
    });
    expect(s.kind).toBe('library');
  });

  it('prefers whichever the learner actually reads: own library or story', () => {
    const story = { startTextId: 't1', nextChapter: { id: 'c2', title: 'Ch 2' } };
    expect(pickNextStep({ ...base, story, libraryNext: lib, prefersOwnTexts: true }).kind).toBe('library');
    expect(pickNextStep({ ...base, story, libraryNext: lib, prefersOwnTexts: false }).kind).toBe('chapter');
  });

  it('deleted story with nothing unopened falls back to import', () => {
    expect(pickNextStep({ ...base, story: null, libraryNext: null, hasReadOwnTexts: true }).kind).toBe('import');
  });
});

describe('pickLibraryNext', () => {
  const d = (s: string) => new Date(s);
  const t = (over: Partial<LibraryText> & { id: string }): LibraryText => ({
    title: over.id,
    seriesId: 'S',
    order: 1,
    createdAt: d('2026-01-01'),
    viewCount: 0,
    lastViewedAt: null,
    knownPercentage: 0,
    ...over,
  });

  it('returns null when everything has been opened', () => {
    expect(pickLibraryNext([t({ id: 'a', viewCount: 2, lastViewedAt: d('2026-02-01') })])).toBeNull();
  });

  it('picks the earliest-created unopened text in the series read most recently', () => {
    const r = pickLibraryNext([
      t({ id: 'read', viewCount: 1, lastViewedAt: d('2026-03-01') }),
      t({ id: 'newer', createdAt: d('2026-01-05') }),
      t({ id: 'older', createdAt: d('2026-01-02') }),
      t({ id: 'other-series-easy', seriesId: 'X', knownPercentage: 99 }),
    ]);
    expect(r?.id).toBe('older');
  });

  it('breaks creation-date ties by serial order (bulk imports)', () => {
    const same = d('2026-01-03');
    const r = pickLibraryNext([
      t({ id: 'read', viewCount: 1, lastViewedAt: d('2026-03-01') }),
      t({ id: 'part3', createdAt: same, order: 3 }),
      t({ id: 'part2', createdAt: same, order: 2 }),
    ]);
    expect(r?.id).toBe('part2');
  });

  it('otherwise picks the easiest unopened text (highest % known)', () => {
    const r = pickLibraryNext([
      t({ id: 'read', seriesId: 'A', viewCount: 1, lastViewedAt: d('2026-03-01') }), // series A fully read
      t({ id: 'hard', seriesId: 'B', knownPercentage: 40 }),
      t({ id: 'easy', seriesId: 'C', knownPercentage: 85 }),
    ]);
    expect(r?.id).toBe('easy');
  });

  it('with nothing read yet, also picks the easiest', () => {
    expect(pickLibraryNext([t({ id: 'x', knownPercentage: 10 }), t({ id: 'y', knownPercentage: 60 })])?.id).toBe('y');
  });
});
