import { pgTable, text, integer, real, timestamp, index } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { languages } from './languages';
import { series } from './series';

export const texts = pgTable(
  'texts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    title: text('title').notNull(),
    content: text('content').notNull(),
    languageId: text('language_id')
      .notNull()
      .references(() => languages.id, { onDelete: 'restrict' }),
    userId: text('user_id').notNull(),
    seriesId: text('series_id')
      .notNull()
      .references(() => series.id, { onDelete: 'cascade' }),
    order: integer('order').notNull().default(1),
    lastParagraphIndex: integer('last_paragraph_index').notNull().default(0),

    audioURI: text('audio_uri'),
    sourceURI: text('source_uri'),

    // Computed statistics
    wordCount: integer('word_count').default(0).notNull(),
    uniqueWordCount: integer('unique_word_count').default(0).notNull(),
    knownPercentage: real('known_percentage').default(0).notNull(),
    viewCount: integer('view_count').default(0).notNull(),

    lastViewedAt: timestamp('last_viewed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    languageIdx: index('texts_language_id_idx').on(table.languageId),
    seriesIdx: index('texts_series_id_idx').on(table.seriesId),
    lastViewedIdx: index('texts_last_viewed_at_idx').on(table.lastViewedAt),
    knownPctIdx: index('texts_known_percentage_idx').on(table.knownPercentage),
  })
);

export type Text = typeof texts.$inferSelect;
export type NewText = typeof texts.$inferInsert;
