import { pgTable, text, boolean, json, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const languages = pgTable('languages', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  isRTL: boolean('is_rtl').default(false).notNull(),
  dictURI: text('dict_uri'),
  translateURI: text('translate_uri'),
  googleTTSCode: text('google_tts_code'),
  characterSubstitutions: json('character_substitutions').$type<Record<string, string>>(),
  sentenceSplitRegex: text('sentence_split_regex'),
  includeForeignScript: boolean('include_foreign_script').default(false).notNull(),
  // Default target language for auto-translation (e.g. 'en' for a Spanish-learning app)
  // TODO(auth): override per-user when auth lands — move to user profile settings
  defaultTranslationLangCode: text('default_translation_lang_code'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Language = typeof languages.$inferSelect;
export type NewLanguage = typeof languages.$inferInsert;
