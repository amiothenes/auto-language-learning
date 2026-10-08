import { pgTable, text, integer, real, boolean, json, timestamp, unique } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import type { TutorModeTiming, TutorModeThreshold, TutorModeResume } from '@/lib/types/ui';

// One row per user, global across languages — audio/TTS and reading-behavior
// toggles that should follow the user across devices. Margin/font/text-display
// settings (fontSize, contentWidth, colorScheme, isImmersionMode) stay
// localStorage-only (see ReaderSettingsContext) — device-specific by design,
// never written here.
export const readerSyncSettings = pgTable(
  'reader_sync_settings',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id').notNull(),

    highlightIntensity: integer('highlight_intensity').default(100).notNull(),
    showWellKnownWords: boolean('show_well_known_words').default(true).notNull(),
    highlightMode: text('highlight_mode').$type<'highlight' | 'underline'>().default('highlight').notNull(),

    playbackSpeed: real('playback_speed').default(0.9).notNull(),
    preferredVoices: json('preferred_voices').$type<Record<string, string>>().default({}).notNull(),

    tutorModeEnabled: boolean('tutor_mode_enabled').default(false).notNull(),
    tutorModeTiming: text('tutor_mode_timing').$type<TutorModeTiming>().default('atWord').notNull(),
    tutorModeThreshold: text('tutor_mode_threshold').$type<TutorModeThreshold>().default('FAMILIAR').notNull(),
    tutorModeMaxPerSentence: integer('tutor_mode_max_per_sentence').default(2).notNull(),
    tutorModeResume: text('tutor_mode_resume').$type<TutorModeResume>().default('onDismiss').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueUser: unique('reader_sync_settings_user_id_unique').on(table.userId),
  })
);

export type ReaderSyncSettingsRow = typeof readerSyncSettings.$inferSelect;
export type NewReaderSyncSettingsRow = typeof readerSyncSettings.$inferInsert;
