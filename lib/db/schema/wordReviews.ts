import { pgTable, text, integer, real, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { words } from './words';

// SRS scheduling state for a word (SM-2). A row only exists once a word has
// been introduced into a review session — its absence means "new"/never
// reviewed. This table is the sole source of truth for scheduling; the dead
// `words.todayScore`/`tomorrowScore` fields are not used here.
export const wordReviews = pgTable(
  'word_reviews',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    wordId: text('word_id')
      .notNull()
      .references(() => words.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),

    easeFactor: real('ease_factor').default(2.5).notNull(),
    intervalDays: integer('interval_days').default(0).notNull(),
    repetitions: integer('repetitions').default(0).notNull(),

    dueAt: timestamp('due_at').defaultNow().notNull(),
    lastReviewedAt: timestamp('last_reviewed_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueWord: unique('word_reviews_word_id_unique').on(table.wordId),
    userDueIdx: index('word_reviews_user_due_idx').on(table.userId, table.dueAt),
  })
);

export type WordReview = typeof wordReviews.$inferSelect;
export type NewWordReview = typeof wordReviews.$inferInsert;
