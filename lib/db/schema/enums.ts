import { pgEnum } from 'drizzle-orm/pg-core';

export const vocabularyStatusEnum = pgEnum('vocabulary_status', [
  'UNKNOWN',
  'NEWLY_SEEN',
  'FAMILIAR',
  'KNOWN',
  'WELL_KNOWN',
  'IGNORE',
]);
