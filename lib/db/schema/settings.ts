import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const settings = pgTable('settings', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),

  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
