import { relations } from 'drizzle-orm';
import { languages } from './languages';
import { words } from './words';
import { wordInstances } from './wordInstances';
import { wordTranslations } from './wordTranslations';
import { series } from './series';
import { texts } from './texts';
import { sentences } from './sentences';
import { tags } from './tags';
import { posTags } from './posTags';
import { textTags } from './textTags';
import { users } from './users';

// Language Relations
export const languagesRelations = relations(languages, ({ many }) => ({
  words: many(words),
  texts: many(texts),
  series: many(series),
  users: many(users),
}));

// Word Relations
export const wordsRelations = relations(words, ({ one, many }) => ({
  language: one(languages, {
    fields: [words.languageId],
    references: [languages.id],
  }),
  instances: many(wordInstances),
  tags: many(posTags),
  translations: many(wordTranslations),
}));

// Word Translation Relations
export const wordTranslationsRelations = relations(wordTranslations, ({ one }) => ({
  word: one(words, {
    fields: [wordTranslations.wordId],
    references: [words.id],
  }),
}));

// Word Instance Relations
export const wordInstancesRelations = relations(wordInstances, ({ one }) => ({
  word: one(words, {
    fields: [wordInstances.wordId],
    references: [words.id],
  }),
  text: one(texts, {
    fields: [wordInstances.textId],
    references: [texts.id],
  }),
  sentence: one(sentences, {
    fields: [wordInstances.sentenceId],
    references: [sentences.id],
  }),
}));

// Series Relations
export const seriesRelations = relations(series, ({ one, many }) => ({
  language: one(languages, {
    fields: [series.languageId],
    references: [languages.id],
  }),
  texts: many(texts),
}));

// Text Relations
export const textsRelations = relations(texts, ({ one, many }) => ({
  language: one(languages, {
    fields: [texts.languageId],
    references: [languages.id],
  }),
  series: one(series, {
    fields: [texts.seriesId],
    references: [series.id],
  }),
  sentences: many(sentences),
  wordInstances: many(wordInstances),
  tags: many(textTags),
}));

// Sentence Relations
export const sentencesRelations = relations(sentences, ({ one, many }) => ({
  text: one(texts, {
    fields: [sentences.textId],
    references: [texts.id],
  }),
  wordInstances: many(wordInstances),
}));

// Tag Relations
export const tagsRelations = relations(tags, ({ many }) => ({
  wordTags: many(posTags),
  textTags: many(textTags),
}));

// POSTag Relations
export const posTagsRelations = relations(posTags, ({ one }) => ({
  word: one(words, {
    fields: [posTags.wordId],
    references: [words.id],
  }),
  tag: one(tags, {
    fields: [posTags.tagId],
    references: [tags.id],
  }),
}));

// TextTag Relations
export const textTagsRelations = relations(textTags, ({ one }) => ({
  text: one(texts, {
    fields: [textTags.textId],
    references: [texts.id],
  }),
  tag: one(tags, {
    fields: [textTags.tagId],
    references: [tags.id],
  }),
}));

// User Relations
export const usersRelations = relations(users, ({ one }) => ({
  defaultLanguage: one(languages, {
    fields: [users.defaultLanguageId],
    references: [languages.id],
  }),
}));
