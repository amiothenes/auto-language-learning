import { pgTable, text, unique, index } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { words } from './words';
import { tags } from './tags';

export const posTags = pgTable(
  'pos_tags',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    wordId: text('word_id')
      .notNull()
      .references(() => words.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    uniqueWordTag: unique().on(table.wordId, table.tagId),
    wordIdx: index('pos_tags_word_id_idx').on(table.wordId),
    tagIdx: index('pos_tags_tag_id_idx').on(table.tagId),
  })
);

export type POSTag = typeof posTags.$inferSelect;
export type NewPOSTag = typeof posTags.$inferInsert;
