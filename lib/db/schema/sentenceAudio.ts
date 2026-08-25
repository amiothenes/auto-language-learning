import { pgTable, text, integer, json, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export type WordBoundaryMark = {
  textOffset: number;
  wordLength: number;
  audioOffsetMs: number;
  durationMs: number;
  text: string;
};

// Global, content-keyed cache — NOT per-user, and NOT tied to a specific
// `sentences.id`. Keying by a hash of the sentence text (rather than the row
// id) means identical sentence content produced by reprocessing a text, or by
// two different texts/users, reuses the same cached audio automatically.
export const sentenceAudio = pgTable(
  'sentence_audio',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    contentHash: text('content_hash').notNull(),
    languageCode: text('language_code').notNull(),
    voiceId: text('voice_id').notNull(),
    ratePercent: integer('rate_percent').notNull(),
    storagePath: text('storage_path').notNull(),
    durationMs: integer('duration_ms').notNull(),
    // Raw Azure WordBoundary events, unaligned — aligned to a karaoke target
    // at serve time against whichever sentence is actually being requested.
    marks: json('marks').$type<WordBoundaryMark[]>().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    hashLangVoiceRateUnique: unique('sentence_audio_hash_lang_voice_rate_unique').on(
      table.contentHash,
      table.languageCode,
      table.voiceId,
      table.ratePercent
    ),
    hashLangIdx: index('sentence_audio_hash_lang_idx').on(table.contentHash, table.languageCode),
  })
);

export type SentenceAudio = typeof sentenceAudio.$inferSelect;
export type NewSentenceAudio = typeof sentenceAudio.$inferInsert;
