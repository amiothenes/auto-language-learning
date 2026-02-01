import { pgTable, text, unique, index } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { texts } from './texts';
import { tags } from './tags';

export const textTags = pgTable(
  'text_tags',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    textId: text('text_id')
      .notNull()
      .references(() => texts.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    uniqueTextTag: unique().on(table.textId, table.tagId),
    textIdx: index('text_tags_text_id_idx').on(table.textId),
    tagIdx: index('text_tags_tag_id_idx').on(table.tagId),
  })
);

export type TextTag = typeof textTags.$inferSelect;
export type NewTextTag = typeof textTags.$inferInsert;
