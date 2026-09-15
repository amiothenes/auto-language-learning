import { pgTable, text, integer, boolean, timestamp, unique } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { languages } from './languages';
import { vocabularyStatusEnum } from './enums';
import type { SrsNewCardsPosition } from '@/lib/types/api';

// Per user+language SRS configuration. Separate from the global `settings`
// key/value table, which has no userId column and doesn't fit per-user,
// per-language config.
export const srsSettings = pgTable(
  'srs_settings',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id').notNull(),
    languageId: text('language_id')
      .notNull()
      .references(() => languages.id, { onDelete: 'cascade' }),

    newCardsPerDay: integer('new_cards_per_day').default(20).notNull(),
    // null = unlimited
    reviewsPerDay: integer('reviews_per_day').default(100),

    // Reviewable status range — words outside [minEligibleStatus, maxEligibleStatus]
    // (in the UNKNOWN < NEWLY_SEEN < FAMILIAR < KNOWN < WELL_KNOWN ladder) never
    // enter the queue. Defaults exclude WELL_KNOWN (graduated) and UNKNOWN/IGNORE.
    minEligibleStatus: vocabularyStatusEnum('min_eligible_status').default('NEWLY_SEEN').notNull(),
    maxEligibleStatus: vocabularyStatusEnum('max_eligible_status').default('KNOWN').notNull(),
    // Words at/after this status render as Type B (word card); before it, Type A
    // (sentence card).
    typeSwitchStatus: vocabularyStatusEnum('type_switch_status').default('FAMILIAR').notNull(),

    sentenceAudioEnabled: boolean('sentence_audio_enabled').default(true).notNull(),
    wordAudioEnabled: boolean('word_audio_enabled').default(true).notNull(),

    // Where new cards fall relative to due reviews in the session queue.
    newCardsPosition: text('new_cards_position').$type<SrsNewCardsPosition>().default('end').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueUserLanguage: unique('srs_settings_user_language_unique').on(table.userId, table.languageId),
  })
);

export type SrsSettingsRow = typeof srsSettings.$inferSelect;
export type NewSrsSettingsRow = typeof srsSettings.$inferInsert;
