import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { languages } from './languages';

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

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    languageIdx: index('series_language_id_idx').on(table.languageId),
  })
);

export type Series = typeof series.$inferSelect;
export type NewSeries = typeof series.$inferInsert;
