import { config } from 'dotenv';

config({ path: '.env.local' });

import { readFileSync } from 'fs';
import path from 'path';
import { db } from '../index';
import { languages, words } from '../schema';
import { eq, inArray, sql } from 'drizzle-orm';

const DATA_DIR = path.join(__dirname, 'data');
const CHUNK_SIZE = 500;

type FreqMap = Record<string, number>;

function loadFreqMap(langCode: string): FreqMap {
  const filePath = path.join(DATA_DIR, `wordfreq_${langCode}.json`);
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as FreqMap;
  } catch {
    console.warn(`  [warn] No frequency file found for '${langCode}' at ${filePath} — skipping`);
    return {};
  }
}

function zipfToFrequency(zipf: number): number {
  return Math.min(100, Math.round((zipf / 7) * 100));
}

async function seedLanguage(
  langId: string,
  langCode: string,
  freqMap: FreqMap,
): Promise<void> {
  const allWords = await db
    .select({ id: words.id, lemma: words.lemma })
    .from(words)
    .where(eq(words.languageId, langId));

  if (allWords.length === 0) {
    console.log(`  [${langCode}] No words in DB — skipping`);
    return;
  }

  const updates: Array<{ id: string; dictionaryFrequency: number }> = [];
  for (const word of allWords) {
    const zipf = freqMap[word.lemma] ?? 0;
    if (zipf > 0) {
      updates.push({ id: word.id, dictionaryFrequency: zipfToFrequency(zipf) });
    }
  }

  const skipped = allWords.length - updates.length;
  console.log(
    `  [${langCode}] ${allWords.length} words in DB — ${updates.length} have corpus data, ${skipped} will stay at 0`,
  );

  if (updates.length === 0) return;

  const now = new Date();
  for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
    const chunk = updates.slice(i, i + CHUNK_SIZE);
    const caseExpr = sql`CASE ${sql.join(
      chunk.map(({ id, dictionaryFrequency }) =>
        sql`WHEN ${words.id} = ${id} THEN ${sql.raw(String(dictionaryFrequency))}`
      ),
      sql` `,
    )} END`;
    await db
      .update(words)
      .set({ dictionaryFrequency: caseExpr, updatedAt: now })
      .where(inArray(words.id, chunk.map((u) => u.id)));
    const done = Math.min(i + CHUNK_SIZE, updates.length);
    process.stdout.write(`\r  [${langCode}] Updated ${done}/${updates.length}...`);
  }
  process.stdout.write('\n');
}

async function main(): Promise<void> {
  console.log('Verbista — frequency seed (wordfreq → dictionaryFrequency)\n');

  const allLanguages = await db
    .select({ id: languages.id, code: languages.code, name: languages.name })
    .from(languages);

  if (allLanguages.length === 0) {
    console.error('No languages found in DB. Run npm run db:seed first.');
    process.exit(1);
  }

  for (const lang of allLanguages) {
    console.log(`${lang.name} (${lang.code})`);
    const freqMap = loadFreqMap(lang.code);
    if (Object.keys(freqMap).length === 0) continue;
    await seedLanguage(lang.id, lang.code, freqMap);
  }

  console.log('\nFrequency seed complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
