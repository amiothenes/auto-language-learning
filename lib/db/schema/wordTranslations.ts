import { pgTable, text, json, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { words } from './words';

export type TranslationMeaning = {
  pos: string;
  definitions: string[];
  confidence: number;
};

export type TranslationSource = 'azure' | 'wiktionary' | 'user';

export const wordTranslations = pgTable(
  'word_translations',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    wordId: text('word_id')
      .notNull()
      .references(() => words.id, { onDelete: 'cascade' }),
    targetLangCode: text('target_lang_code').notNull(),
    translation: text('translation'),
    meanings: json('meanings').$type<TranslationMeaning[]>(),
    exampleSentence: text('example_sentence'),
    exampleSentenceTranslation: text('example_sentence_translation'),
    // TODO(auth): add userId here when auth lands — scope translations per-user
    source: text('source').$type<TranslationSource>().default('azure').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    wordLangUnique: unique('word_translations_word_lang_unique').on(table.wordId, table.targetLangCode),
    wordIdIdx: index('word_translations_word_id_idx').on(table.wordId),
    targetLangIdx: index('word_translations_target_lang_idx').on(table.targetLangCode),
  })
);

export type WordTranslation = typeof wordTranslations.$inferSelect;
export type NewWordTranslation = typeof wordTranslations.$inferInsert;
