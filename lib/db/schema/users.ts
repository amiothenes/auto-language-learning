import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { languages } from './languages';

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text('email').unique(),
  name: text('name'),
  defaultLanguageId: text('default_language_id').references(() => languages.id, {
    onDelete: 'set null',
  }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
