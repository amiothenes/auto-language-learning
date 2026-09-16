import { pgTable, text, integer, date, timestamp, unique } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { languages } from './languages';

// Per user+language+day counters for SRS daily caps. Kept as durable counters
// (rather than derived from wordReviews.createdAt/lastReviewedAt) so caps stay
// correct across multiple sessions in a day and aren't sensitive to timezone
// drift in "what counts as today" queries.
export const srsDailyStats = pgTable(
  'srs_daily_stats',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id').notNull(),
    languageId: text('language_id')
      .notNull()
      .references(() => languages.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),

    newIntroducedCount: integer('new_introduced_count').default(0).notNull(),
    reviewsCompletedCount: integer('reviews_completed_count').default(0).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueUserLanguageDate: unique('srs_daily_stats_user_language_date_unique').on(
      table.userId,
      table.languageId,
      table.date
    ),
  })
);

export type SrsDailyStats = typeof srsDailyStats.$inferSelect;
export type NewSrsDailyStats = typeof srsDailyStats.$inferInsert;
