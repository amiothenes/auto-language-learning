import { pgTable, text, boolean, json, timestamp, unique, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

/** Placement level captured at onboarding (frequency bands, not official CEFR). */
export const LANGUAGE_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
/** How the learner was placed: absolute beginner, word-picker placement, or self-picked level. */
export const ONBOARDING_PATHS = ['beginner', 'placement', 'self'] as const;

export const languages = pgTable(
  'languages',
  {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  code: text('code').notNull(),
  userId: text('user_id').notNull(),
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
  // Onboarding (see lib/onboarding/*). onboardedAt NULL means this language
  // still needs its onboarding flow; `level` is null for below-A1 beginners.
  level: text('level', { enum: LANGUAGE_LEVELS }),
  onboardingPath: text('onboarding_path', { enum: ONBOARDING_PATHS }),
  onboardedAt: timestamp('onboarded_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueCodeUser: unique('languages_code_user_id_unique').on(table.code, table.userId),
    levelCheck: check('languages_level_check', sql`${table.level} IS NULL OR ${table.level} IN ('A1','A2','B1','B2','C1','C2')`),
    onboardingPathCheck: check(
      'languages_onboarding_path_check',
      sql`${table.onboardingPath} IS NULL OR ${table.onboardingPath} IN ('beginner','placement','self')`
    ),
  })
).enableRLS();

export type Language = typeof languages.$inferSelect;
export type NewLanguage = typeof languages.$inferInsert;
