import { pgTable, text, integer, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Global, content-keyed cache — NOT per-user. Pronunciation audio for a given
// lemma/voice/rate is byte-identical regardless of who requests it, so this
// table has no userId/wordId FK; many per-user `words` rows sharing the same
// lemma+language resolve to the same cache row here.
export const wordAudio = pgTable(
  'word_audio',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    lemma: text('lemma').notNull(),
    languageCode: text('language_code').notNull(),
    voiceId: text('voice_id').notNull(),
    ratePercent: integer('rate_percent').notNull(),
    storagePath: text('storage_path').notNull(),
    durationMs: integer('duration_ms').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    lemmaLangVoiceRateUnique: unique('word_audio_lemma_lang_voice_rate_unique').on(
      table.lemma,
      table.languageCode,
      table.voiceId,
      table.ratePercent
    ),
    lemmaLangIdx: index('word_audio_lemma_lang_idx').on(table.lemma, table.languageCode),
  })
);

export type WordAudio = typeof wordAudio.$inferSelect;
export type NewWordAudio = typeof wordAudio.$inferInsert;
