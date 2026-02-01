import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { texts } from './texts';

export const sentences = pgTable(
  'sentences',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    textId: text('text_id')
      .notNull()
      .references(() => texts.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    order: integer('order').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    textIdx: index('sentences_text_id_idx').on(table.textId),
    textOrderIdx: index('sentences_text_id_order_idx').on(table.textId, table.order),
  })
);

export type Sentence = typeof sentences.$inferSelect;
export type NewSentence = typeof sentences.$inferInsert;
