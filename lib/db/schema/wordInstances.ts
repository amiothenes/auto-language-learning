import { pgTable, text, integer, json, timestamp, index } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const wordInstances = pgTable(
  'word_instances',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    textId: text('text_id')
      .notNull()
      .references(() => texts.id, { onDelete: 'cascade' }),
    wordId: text('word_id')
      .notNull()
      .references(() => words.id),
    sentenceId: text('sentence_id').references(() => sentences.id, { onDelete: 'set null' }),

    surfaceForm: text('surface_form').notNull(),
    position: integer('position').notNull(),
    inflectionData: json('inflection_data').$type<Record<string, unknown>>(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    textIdx: index('word_instances_text_id_idx').on(table.textId),
    wordIdx: index('word_instances_word_id_idx').on(table.wordId),
    sentenceIdx: index('word_instances_sentence_id_idx').on(table.sentenceId),
    positionIdx: index('word_instances_position_idx').on(table.position),
  })
);

// Import references (will be defined in other files)
import { words } from './words';
import { texts } from './texts';
import { sentences } from './sentences';

export type WordInstance = typeof wordInstances.$inferSelect;
export type NewWordInstance = typeof wordInstances.$inferInsert;
