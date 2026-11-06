import { pgTable, text, timestamp, index, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { languages } from './languages';

/** 'starter_story' is the onboarding story series (La Biblioteca del Olvido). */
export const SERIES_KINDS = ['user', 'starter_story'] as const;

export const series = pgTable(
  'series',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text('name').notNull(),
    description: text('description'),
    languageId: text('language_id').notNull().references(() => languages.id, { onDelete: 'restrict' }),
    userId: text('user_id').notNull(),
    kind: text('kind', { enum: SERIES_KINDS }).default('user').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    languageIdx: index('series_language_id_idx').on(table.languageId),
    userIdx: index('series_user_id_idx').on(table.userId),
    kindCheck: check('series_kind_check', sql`${table.kind} IN ('user','starter_story')`),
    // At most one starter story per user and language, which makes onboarding
    // seeding idempotent (a retried request can't create a second copy).
    oneStarterStory: uniqueIndex('series_one_starter_story_idx')
      .on(table.userId, table.languageId)
      .where(sql`${table.kind} = 'starter_story'`),
  })
).enableRLS();

export type Series = typeof series.$inferSelect;
export type NewSeries = typeof series.$inferInsert;
