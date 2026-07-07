import { pgTable, text, integer, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { vocabularyStatusEnum } from './enums';

export const words = pgTable(
  'words',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    lemma: text('lemma').notNull(),
    languageId: text('language_id')
      .notNull()
      .references(() => languages.id, { onDelete: 'restrict' }),
    userId: text('user_id').notNull(),

    // Core vocabulary data
    status: vocabularyStatusEnum('status').default('UNKNOWN').notNull(),
    translation: text('translation'),
    definition: text('definition'),
    romanization: text('romanization'),
    exampleSentence: text('example_sentence'),

    // Frequency tracking (TWO DIFFERENT CONCEPTS)
    dictionaryFrequency: integer('dictionary_frequency').default(0).notNull(),
    userFrequency: integer('user_frequency').default(1).notNull(),

    // Analytics & SRS
    statusChangedAt: timestamp('status_changed_at').defaultNow().notNull(),
    lastPracticedAt: timestamp('last_practiced_at').defaultNow().notNull(),
    todayScore: integer('today_score').default(0).notNull(),
    tomorrowScore: integer('tomorrow_score').default(0).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueLemmaLanguage: unique('words_lemma_language_id_user_id_unique').on(table.lemma, table.languageId, table.userId),

    // Single-column indexes
    statusIdx: index('words_status_idx').on(table.status),
    lemmaIdx: index('words_lemma_idx').on(table.lemma),
    languageIdx: index('words_language_id_idx').on(table.languageId),
    dictFreqIdx: index('words_dictionary_frequency_idx').on(table.dictionaryFrequency),
    userFreqIdx: index('words_user_frequency_idx').on(table.userFrequency),

    // Composite indexes for common query patterns (CRITICAL for performance)
    // Used by: textProcessor query existing words, update user frequency
    languageLemmaIdx: index('words_language_lemma_idx').on(table.languageId, table.lemma),

    // Used by: textProcessor calculate known percentage query
    languageStatusIdx: index('words_language_status_idx').on(table.languageId, table.status),
  })
);

// Import languages from languages.ts to avoid circular dependency
import { languages } from './languages';

export type Word = typeof words.$inferSelect;
export type NewWord = typeof words.$inferInsert;
