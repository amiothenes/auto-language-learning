import { pgTable, text, integer, timestamp, unique, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { vocabularyStatusEnum } from './enums';

/**
 * Where a word row came from:
 *  - text:         created by importing a text (the default, and all pre-existing rows)
 *  - placement:    pre-marked by the onboarding placement estimate
 *  - starter_deck: Core 625 + grammar words seeded for SRS drip introduction
 *  - import:       vocabulary CSV/LWT import
 */
export const WORD_ORIGINS = ['text', 'placement', 'starter_deck', 'import'] as const;

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

    // Onboarding / starter deck
    origin: text('origin', { enum: WORD_ORIGINS }).default('text').notNull(),
    // Introduction order within the starter deck (1 = first card); NULL outside the deck.
    deckOrder: integer('deck_order'),
    // Riso glyph key (conceptId) for picture flashcards; NULL → typographic card.
    glyph: text('glyph'),

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
    userIdx: index('words_user_id_idx').on(table.userId),

    // Composite indexes for common query patterns (CRITICAL for performance)
    // Used by: textProcessor query existing words, update user frequency
    languageLemmaIdx: index('words_language_lemma_idx').on(table.languageId, table.lemma),

    // Used by: textProcessor calculate known percentage query
    languageStatusIdx: index('words_language_status_idx').on(table.languageId, table.status),

    // Used by: SRS new-card selection (lib/srs/queue.ts findNewWordIds) —
    // filters by (userId, languageId, status) and orders by statusChangedAt.
    newCardsIdx: index('words_user_language_status_changed_idx').on(
      table.userId,
      table.languageId,
      table.statusChangedAt
    ),

    originCheck: check('words_origin_check', sql`${table.origin} IN ('text','placement','starter_deck','import')`),

    // Used by: SRS starter-deck drip (lib/srs/queue.ts), which picks the next
    // UNKNOWN deck cards in deck_order. Partial, so it only covers deck rows.
    starterDeckIdx: index('words_starter_deck_idx')
      .on(table.userId, table.languageId, table.deckOrder)
      .where(sql`${table.origin} = 'starter_deck'`),
  })
).enableRLS();

// Import languages from languages.ts to avoid circular dependency
import { languages } from './languages';

export type Word = typeof words.$inferSelect;
export type NewWord = typeof words.$inferInsert;
