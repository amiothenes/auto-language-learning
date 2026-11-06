/**
 * Builds and validates onboarding content in content/<lang>/.
 *
 *   npx tsx scripts/build-onboarding-content.ts            # compile only
 *   npx tsx scripts/build-onboarding-content.ts --validate # also check lemmas against the NLP service
 *   npx tsx scripts/build-onboarding-content.ts --pools    # also (re)build placement-pools.json via NLP
 *
 * Compile step (offline):
 *   story/*.md → story.generated.json, imported statically by
 *   lib/onboarding/content.ts so it is bundled with the app; nothing reads
 *   the filesystem at runtime.
 *
 * Validate step (needs NLP_SERVICE_URL / NLP_API_KEY in .env.local):
 *   Every deck, glue and band lemma must lemmatize to itself. Word rows are
 *   unique on (lemma, language, user), so if spaCy turns "lámpara" into
 *   something else, the starter-deck card and the word in Chapter 1 would
 *   become two different rows. Exits non-zero on any mismatch.
 *
 * Pools step (needs NLP):
 *   Lemmatizes the top-N surface forms of wordfreq_<lang>.json and buckets the
 *   lemmas by best rank into the placement bands. Onboarding pre-marks whole
 *   pools below the learner's level as Known.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';

config({ path: '.env.local' });

const LANG = 'es';
const ROOT = path.join(process.cwd(), 'content', LANG);
const args = new Set(process.argv.slice(2));

// Lemma-form rank windows for the placement bands; must match the
// _comment in placement-bands.json.
const POOL_WINDOWS: Array<[level: string, maxRank: number]> = [
  ['A1', 1000],
  ['A2', 2500],
  ['B1', 5000],
  ['B2', 10000],
  ['C1', 20000],
];
// Surface forms to lemmatize for pools. Many surfaces fold into one lemma
// (roughly 3:1 for Spanish), so 60k surfaces are needed to fill the C1 window.
const POOL_SOURCE_LIMIT = 60000;
// Established Spanish words containing k or w (others are treated as foreign).
const SPANISH_KW = new Set(['kilo', 'kilómetro', 'kilogramo', 'kiosco', 'karate', 'whisky', 'web', 'wifi']);

// ─── Compile story ──────────────────────────────────────────────────────────

interface ChapterOut {
  id: string;
  order: number;
  level: string;
  title: string;
  titleEn: string;
  scene: string;
  body: string;
  wordCount: number;
}

function parseChapter(file: string): ChapterOut {
  const raw = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing frontmatter`);
  const meta: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  for (const k of ['id', 'order', 'level', 'title', 'titleEn', 'scene']) {
    if (!meta[k]) throw new Error(`${file}: frontmatter is missing "${k}"`);
  }
  const body = m[2].trim();
  return {
    id: meta.id,
    order: Number(meta.order),
    level: meta.level,
    title: meta.title,
    titleEn: meta.titleEn,
    scene: meta.scene,
    body,
    wordCount: body.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length,
  };
}

function compileStory(): ChapterOut[] {
  const dir = path.join(ROOT, 'story');
  const chapters = readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => parseChapter(path.join(dir, f)))
    .sort((a, b) => a.order - b.order);
  writeFileSync(path.join(ROOT, 'story.generated.json'), JSON.stringify({ language: LANG, chapters }, null, 2) + '\n');
  console.log(`story: ${chapters.length} chapters → content/${LANG}/story.generated.json`);
  for (const c of chapters) console.log(`  ${c.order}. [${c.level}] ${c.title} (${c.wordCount} words)`);
  return chapters;
}

// ─── Compile deck ───────────────────────────────────────────────────────────

interface DeckCardOut {
  lemma: string;
  gloss: string;
  gender: 'm' | 'f' | null;
  display: string | null;
  conceptId: string;
  category: string;
  kind: 'core' | 'glue';
  order: number;
}

const slug = (s: string) =>
  s.toLowerCase().replace(/\(.*?\)/g, (m) => m.replace(/[()]/g, '')).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Merge Core 625 and the grammar words into one ordered starter deck:
 * Chapter 1's first words, then everything else by real frequency rank (so
 * the cards a learner meets first are the most useful for reading). Duplicate
 * lemmas are merged: first occurrence wins and glosses are joined.
 */
function compileDeck(): DeckCardOut[] {
  const core = JSON.parse(readFileSync(path.join(ROOT, 'core625.json'), 'utf8'));
  const glue = JSON.parse(readFileSync(path.join(ROOT, 'glue.json'), 'utf8'));
  const freq: Record<string, number> = JSON.parse(
    readFileSync(path.join(process.cwd(), 'lib/db/seeds/data', `wordfreq_${LANG}.json`), 'utf8')
  );
  const rank = new Map(Object.keys(freq).map((w, i) => [w, i + 1]));

  const byLemma = new Map<string, Omit<DeckCardOut, 'order'>>();
  const add = (c: Omit<DeckCardOut, 'order'>) => {
    const prev = byLemma.get(c.lemma);
    if (!prev) byLemma.set(c.lemma, c);
    else if (!prev.gloss.split('; ').includes(c.gloss)) prev.gloss = `${prev.gloss}; ${c.gloss}`;
  };
  for (const cat of core.categories as { id: string; words: [string, string, 'm' | 'f' | null, string?][] }[]) {
    for (const [lemma, gloss, gender, display] of cat.words) {
      // Fold the display form into the gloss ("to sit (sentarse)"), so it also
      // shows on Review cards, which only render lemma + translation.
      add({
        lemma,
        gloss: display ? `${gloss} (${display})` : gloss,
        gender,
        display: display ?? null,
        conceptId: slug(gloss),
        category: cat.id,
        kind: 'core',
      });
    }
  }
  for (const [lemma, gloss] of glue.words as [string, string][]) {
    add({ lemma, gloss, gender: null, display: null, conceptId: slug(gloss), category: 'grammar', kind: 'glue' });
  }

  const first: string[] = core.firstWords;
  const rest = [...byLemma.keys()]
    .filter((l) => !first.includes(l))
    .sort((a, b) => (rank.get(a) ?? 1e9) - (rank.get(b) ?? 1e9));
  const deck = [...first, ...rest].map((lemma, i) => ({ ...byLemma.get(lemma)!, order: i + 1 }));

  writeFileSync(path.join(ROOT, 'deck.generated.json'), JSON.stringify({ language: LANG, cards: deck }, null, 1) + '\n');
  console.log(`deck: ${deck.length} cards (${deck.filter((c) => c.kind === 'glue').length} grammar) → content/${LANG}/deck.generated.json`);
  console.log(`  first 20: ${deck.slice(0, 20).map((c) => c.lemma).join(', ')}`);
  return deck;
}

// ─── NLP helpers ────────────────────────────────────────────────────────────

interface Tok { surface: string; lemma: string; pos: string; is_word: boolean }

async function nlp(text: string): Promise<Tok[]> {
  const url = process.env.NLP_SERVICE_URL_LOC || process.env.NLP_SERVICE_URL || 'http://localhost:8000';
  const res = await fetch(`${url}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.NLP_API_KEY ? { 'X-API-Key': process.env.NLP_API_KEY } : {}),
    },
    body: JSON.stringify({ text, language: LANG }),
  });
  if (!res.ok) throw new Error(`NLP service ${res.status}: ${await res.text()}`);
  return ((await res.json()) as { tokens: Tok[] }).tokens;
}

/**
 * Lemmatize words *in context*. A bare "vaca." is ambiguous to spaCy (it reads
 * as a verb), but in "la vaca." it is a noun, as it is in real texts. Each item
 * is framed into a tiny sentence, and the token whose surface equals the word
 * is taken.
 */
async function lemmatizeInContext(items: Array<{ word: string; frame: string }>): Promise<Map<string, Tok>> {
  const out = new Map<string, Tok>();
  const CHUNK = 400;
  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK);
    // Match by character offset, not token order: spaCy may split a word into
    // several tokens (e.g. contractions), which would shift any order-based
    // matching for the rest of the chunk.
    const lines = chunk.map((it) => it.frame.replace('{w}', it.word));
    const wordOffsets: number[] = [];
    let offset = 0;
    chunk.forEach((it, j) => {
      wordOffsets.push(offset + it.frame.indexOf('{w}'));
      offset += lines[j].length + 1; // + '\n'
    });
    const toks = await nlp(lines.join('\n'));
    const byPosition = new Map(toks.map((t) => [(t as Tok & { position: number }).position, t]));
    chunk.forEach((it, j) => {
      const t = byPosition.get(wordOffsets[j]);
      // Only accept a whole-word match; a split token is reported as missing.
      if (t && t.surface.toLowerCase() === it.word.toLowerCase()) out.set(`${it.word}|${it.frame}`, t);
    });
  }
  return out;
}

/** Context frame for a word, from its category, gender and shape. */
function frameFor(word: string, category: string, gender: 'm' | 'f' | null): string {
  if (category === 'number') return 'tengo {w} libros.';
  if (category === 'direction') return gender === 'f' ? 'gira a la {w}.' : 'el gato está {w}.';
  if (category === 'color') return 'me gusta el color {w}.';
  if (gender === 'm') return 'el {w} está aquí.';
  if (gender === 'f') return 'la {w} está aquí.';
  if (category === 'verb' || /(ar|er|ir|ír)$/.test(word)) return 'quiero {w} hoy.';
  if (category === 'adjective') return 'es muy {w}.';
  // Placement-band words carry no gender: guess from the ending, which is
  // right for the nouns in the bands; adjectives and adverbs lemmatize to
  // themselves either way.
  if (category === 'band') return /a$/.test(word) ? 'la {w} está aquí.' : 'el {w} está aquí.';
  return 'y {w} también.';
}

// ─── Validate ───────────────────────────────────────────────────────────────

async function validate() {
  const core = JSON.parse(readFileSync(path.join(ROOT, 'core625.json'), 'utf8'));
  const glue = JSON.parse(readFileSync(path.join(ROOT, 'glue.json'), 'utf8'));
  const bands = JSON.parse(readFileSync(path.join(ROOT, 'placement-bands.json'), 'utf8'));
  const freq: Record<string, number> = JSON.parse(
    readFileSync(path.join(process.cwd(), 'lib/db/seeds/data', `wordfreq_${LANG}.json`), 'utf8')
  );

  type Src = { word: string; where: string; frame: string };
  const sources: Src[] = [
    ...core.categories.flatMap((c: { id: string; words: [string, string, 'm' | 'f' | null][] }) =>
      c.words.map((w) => ({ word: w[0], where: `core625:${c.id}`, frame: frameFor(w[0], c.id, w[2]) }))
    ),
    ...glue.words.map((w: [string]) => ({ word: w[0], where: 'glue', frame: 'sí, {w} es así.' })),
    ...bands.bands.flatMap((b: { level: string; words: { lemma: string }[] }) =>
      b.words.map((w) => ({ word: w.lemma, where: `band:${b.level}`, frame: frameFor(w.lemma, 'band', null) }))
    ),
  ];

  const lemmas = await lemmatizeInContext(sources);

  // Known spaCy model bugs we accept rather than ship a wrong lemma on the card:
  // es_core_news_sm lemmatizes the colour adjective "rosa" to "rós". Texts may
  // create a separate "rós" row; the deck card stays correct.
  // Same for "vosotros", which becomes "vosotro".
  const KNOWN_QUIRKS: Record<string, string> = { rosa: 'rós', vosotros: 'vosotro' };

  const problems: string[] = [];
  for (const s of sources) {
    const t = lemmas.get(`${s.word}|${s.frame}`);
    if (!t) problems.push(`${s.where} "${s.word}": not found in "${s.frame.replace('{w}', s.word)}"`);
    else if (t.lemma !== s.word.toLowerCase()) {
      if (KNOWN_QUIRKS[s.word] === t.lemma) console.warn(`  ⚠ known spaCy quirk: "${s.word}" → "${t.lemma}" (accepted)`);
      else problems.push(`${s.where} "${s.word}": spaCy lemma is "${t.lemma}" (${t.pos})`);
    }
  }
  const unique = [...new Set(sources.map((s) => s.word))];

  // Chapter 1 must contain every first word as spaCy reads it: that's the
  // beginner's "I just read a sentence" moment.
  const story = JSON.parse(readFileSync(path.join(ROOT, 'story.generated.json'), 'utf8'));
  const ch1Lemmas = new Set((await nlp(story.chapters[0].body)).filter((t) => t.is_word).map((t) => t.lemma));
  for (const w of core.firstWords as string[]) {
    if (!ch1Lemmas.has(w)) problems.push(`firstWords "${w}" does not appear in Chapter 1 (as a spaCy lemma)`);
  }
  for (const d of bands.decoys as string[]) {
    if (d in freq) problems.push(`decoy "${d}" exists in wordfreq_${LANG}.json: pick another pseudo-word`);
  }

  if (problems.length) {
    console.error(`\n✗ ${problems.length} lemma problem(s):`);
    for (const p of [...new Set(problems)]) console.error('  ' + p);
    process.exitCode = 1;
  } else {
    console.log(`\n✓ ${unique.length} lemmas validated, decoys clean`);
  }
}

// ─── Pools ──────────────────────────────────────────────────────────────────

async function buildPools() {
  const freq: Record<string, number> = JSON.parse(
    readFileSync(path.join(process.cwd(), 'lib/db/seeds/data', `wordfreq_${LANG}.json`), 'utf8')
  );
  const surfaces = Object.keys(freq)
    .slice(0, POOL_SOURCE_LIMIT)
    .filter((w) => /^\p{L}+$/u.test(w));

  console.log(`pools: lemmatizing ${surfaces.length} surface forms…`);
  const toks = await lemmatizeInContext(surfaces.map((w) => ({ word: w, frame: '{w}.' })));

  // Best (lowest) rank per lemma. Skip proper nouns, numbers and one-letter
  // noise. Out of context spaCy sometimes invents lemmas ("manzana" → "manzán",
  // "oreja" → "orejar"), so only keep a lemma that is itself a real word in
  // the frequency list. That drops nearly all of those invented forms.
  const bestRank = new Map<string, number>();
  let dropped = 0;
  surfaces.forEach((s, i) => {
    const t = toks.get(`${s}|{w}.`);
    if (!t || t.pos === 'PROPN' || t.pos === 'NUM' || t.lemma.length < 2) return;
    const invented = !(t.lemma in freq);
    // A verb whose "lemma" isn't an infinitive is an inflection spaCy failed to
    // reduce ("sepa", "tomo", "venís"): it would never match a real word row.
    const unreducedVerb = (t.pos === 'VERB' || t.pos === 'AUX') && !/(ar|er|ir|ír)(se)?$/.test(t.lemma);
    // Lowercased names and loanwords tagged as nouns ("wong", "wright", "email").
    // Spanish natively uses k and w almost only in loanwords.
    const foreign = /[kw]/.test(t.lemma) && !SPANISH_KW.has(t.lemma);
    if (invented || unreducedVerb || foreign) {
      dropped++;
      return;
    }
    if (!bestRank.has(t.lemma)) bestRank.set(t.lemma, i + 1);
  });
  console.log(`  dropped ${dropped} invented lemmas`);

  // Lemma-form rank = position among lemmas ordered by best surface rank.
  const ordered = [...bestRank.entries()].sort((a, b) => a[1] - b[1]).map(([l]) => l);
  const pools: Record<string, string[]> = {};
  let start = 0;
  for (const [level, maxRank] of POOL_WINDOWS) {
    pools[level] = ordered.slice(start, Math.min(maxRank, ordered.length));
    start = maxRank;
  }

  writeFileSync(
    path.join(ROOT, 'placement-pools.json'),
    JSON.stringify(
      {
        _comment: 'Generated by scripts/build-onboarding-content.ts --pools. Lemmas by frequency band; whole pools below the placed level are pre-marked Known.',
        language: LANG,
        pools,
      },
      null,
      0
    ) + '\n'
  );
  for (const [l, p] of Object.entries(pools)) console.log(`  ${l}: ${p.length} lemmas`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

(async () => {
  compileStory();
  compileDeck();
  if (args.has('--validate')) await validate();
  if (args.has('--pools')) await buildPools();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
