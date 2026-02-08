# Database Schema Implementation Summary

## ✅ Completed Tasks (1.3 - 1.5)

All three tasks from the PRD have been successfully implemented.

---

## Task 1.3: Core Vocabulary Schema ✅

### Files Created:
- `lib/db/schema/enums.ts` - VocabularyStatus enum
- `lib/db/schema/words.ts` - Words table (lemma storage)
- `lib/db/schema/wordInstances.ts` - Word instances table

### Words Table
**Purpose:** Track lemmas (root words) with full vocabulary metadata

**Fields:**
- `id` - CUID2 primary key
- `lemma` - Root word form
- `languageId` - Foreign key to languages
- `status` - VocabularyStatus enum (NEWLY_SEEN, FAMILIAR, KNOWN, WELL_KNOWN, IGNORE)
- `translation` - Optional translation
- `definition` - Optional definition text
- `romanization` - Optional romanization
- `exampleSentence` - Optional example usage
- `dictionaryFrequency` - 0-100 scale (language-wide commonality)
- `userFrequency` - User encounter count (starts at 1)
- `statusChangedAt` - Timestamp of last status change
- `lastPracticedAt` - Timestamp of last practice
- `todayScore` - SRS score for today
- `tomorrowScore` - SRS score for tomorrow
- `createdAt`, `updatedAt` - Timestamps

**Constraints:**
- Unique: `[lemma, languageId]` - One entry per root word per language

**Indexes:**
- `status` - Filter by vocabulary status
- `lemma` - Search by lemma
- `languageId` - Filter by language
- `dictionaryFrequency` - Sort by commonality
- `userFrequency` - Sort by encounter count

### Word Instances Table
**Purpose:** Track specific occurrences of words in texts

**Fields:**
- `id` - CUID2 primary key
- `textId` - Foreign key to texts (CASCADE DELETE)
- `wordId` - Foreign key to words
- `sentenceId` - Foreign key to sentences (SET NULL on delete)
- `surfaceForm` - Actual word form in text (e.g., "running" vs "run")
- `position` - Position in text
- `inflectionData` - JSON metadata (tense, case, gender, etc.)
- `createdAt` - Timestamp

**Indexes:**
- `textId`, `wordId`, `sentenceId`, `position`

---

## Task 1.4: Texts, Series, and Sentences Schema ✅

### Files Created:
- `lib/db/schema/series.ts` - Series table
- `lib/db/schema/texts.ts` - Texts table
- `lib/db/schema/sentences.ts` - Sentences table

### Series Table
**Purpose:** Organize texts into collections/folders

**Fields:**
- `id` - CUID2 primary key
- `name` - Series name
- `description` - Optional description
- `languageId` - Optional foreign key to languages (SET NULL on delete)
- `createdAt`, `updatedAt` - Timestamps

**Indexes:**
- `languageId`

### Texts Table
**Purpose:** Store reading content with computed statistics

**Fields:**
- `id` - CUID2 primary key
- `title` - Text title
- `content` - Full text content
- `languageId` - Foreign key to languages
- `seriesId` - Optional foreign key to series (SET NULL on delete)
- `audioURI` - Optional audio file URL
- `sourceURI` - Optional source URL
- `wordCount` - Total word count (computed)
- `uniqueWordCount` - Unique word count (computed)
- `knownPercentage` - Known word percentage (computed)
- `lastViewedAt` - Last view timestamp
- `createdAt`, `updatedAt` - Timestamps

**Indexes:**
- `languageId`, `seriesId`, `lastViewedAt`, `knownPercentage`

### Sentences Table
**Purpose:** Extract and store sentences from texts

**Fields:**
- `id` - CUID2 primary key
- `textId` - Foreign key to texts (CASCADE DELETE)
- `content` - Sentence text
- `order` - Position in text (for ordering)
- `createdAt` - Timestamp

**Indexes:**
- `textId`
- `[textId, order]` - Composite index for ordered queries

---

## Task 1.5: Tagging System ✅

### Files Created:
- `lib/db/schema/tags.ts` - Tags table
- `lib/db/schema/posTags.ts` - Part of Speech tags (word tags)
- `lib/db/schema/textTags.ts` - Text tags

### Tags Table
**Purpose:** Store reusable tags with custom colors

**Fields:**
- `id` - CUID2 primary key
- `name` - Unique tag name
- `color` - HSL color string (default: "0 0% 50%")
- `createdAt` - Timestamp

**Constraints:**
- Unique: `name`

### POSTags Join Table
**Purpose:** Associate tags with words (Part of Speech tagging)

**Note:** Typically one POS tag per word unless grammatically ambiguous

**Fields:**
- `id` - CUID2 primary key
- `wordId` - Foreign key to words (CASCADE DELETE)
- `tagId` - Foreign key to tags (CASCADE DELETE)

**Constraints:**
- Unique: `[wordId, tagId]` - Prevent duplicate assignments

**Indexes:**
- `wordId`, `tagId`

### TextTags Join Table
**Purpose:** Associate multiple tags with texts

**Fields:**
- `id` - CUID2 primary key
- `textId` - Foreign key to texts (CASCADE DELETE)
- `tagId` - Foreign key to tags (CASCADE DELETE)

**Constraints:**
- Unique: `[textId, tagId]` - Prevent duplicate assignments

**Indexes:**
- `textId`, `tagId`

---

## Relations Defined ✅

**File:** `lib/db/schema/relations.ts`

All bidirectional relationships defined using Drizzle's `relations()` helper:

### Language Relations:
- Has many: Words, Texts, Series

### Word Relations:
- Belongs to: Language
- Has many: WordInstances, POSTags

### WordInstance Relations:
- Belongs to: Word, Text, Sentence

### Series Relations:
- Belongs to: Language
- Has many: Texts

### Text Relations:
- Belongs to: Language, Series
- Has many: Sentences, WordInstances, TextTags

### Sentence Relations:
- Belongs to: Text
- Has many: WordInstances

### Tag Relations:
- Has many: POSTags, TextTags

---

## Migration Generated ✅

**File:** `lib/db/migrations/0001_famous_micromacro.sql`

**Summary:**
- 1 Enum: `vocabulary_status` (5 values)
- 8 Tables: words, word_instances, series, texts, sentences, tags, pos_tags, text_tags
- 12 Foreign keys with correct cascade behaviors
- 19 Indexes for query optimization
- 4 Unique constraints

---

## Verification Checklist

### ✅ Acceptance Criteria Met

**Task 1.3:**
- ✅ Words table tracks lemmas with full metadata
- ✅ Word instances connect texts to words with position data
- ✅ Status enum is properly typed (TypeScript + PostgreSQL)
- ✅ Can create word with multiple instances (via relations)
- ✅ Foreign keys enforce referential integrity

**Task 1.4:**
- ✅ All tables created with proper relations
- ✅ Can create series with multiple texts (one-to-many relation)
- ✅ Sentences are extracted and stored separately
- ✅ Statistics fields ready (wordCount, knownPercentage)
- ✅ Cascade deletes configured (text → sentences, wordInstances)

**Task 1.5:**
- ✅ Tags can be created with custom HSL colors
- ✅ Words can have multiple POS tags (via join table)
- ✅ Texts can have multiple tags (via join table)
- ✅ Join tables prevent duplicate tag assignments (unique constraints)
- ✅ Can query "all words with tag X" (via relations)

---

## Next Steps

### To Apply Schema to Database:
```bash
npm run db:push
```

### To View Database:
```bash
npm run db:studio
```

### Future Enhancements:
1. Update `lib/db/seed.ts` to include sample data for all tables
2. Create query helpers in `lib/db/queries/` for common operations
3. Add database triggers for automatic `updatedAt` timestamp updates
4. Implement SRS score calculation logic
5. Add aggregation queries for statistics (knownPercentage calculation)

---

## Files Modified/Created

### New Files (10):
1. `lib/db/schema/enums.ts`
2. `lib/db/schema/words.ts`
3. `lib/db/schema/wordInstances.ts`
4. `lib/db/schema/series.ts`
5. `lib/db/schema/texts.ts`
6. `lib/db/schema/sentences.ts`
7. `lib/db/schema/tags.ts`
8. `lib/db/schema/posTags.ts`
9. `lib/db/schema/textTags.ts`
10. `lib/db/schema/relations.ts`

### Modified Files (1):
1. `lib/db/schema/index.ts` - Added exports for all schemas

### Generated Files (1):
1. `lib/db/migrations/0001_famous_micromacro.sql`

---

## Database Schema Diagram

```
┌─────────────┐
│  Languages  │
└──────┬──────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌─────────┐    ┌────────────┐
│  Words  │◄───┤  WordInst  │
└────┬────┘    └─────┬──────┘
     │               │
     │               ├──────────┐
     │               │          │
     ▼               ▼          ▼
┌──────────┐  ┌─────────┐ ┌──────────┐
│ POSTags  │  │  Texts  │ │Sentences │
└────┬─────┘  └────┬────┘ └──────────┘
     │             │
     │             ├───────┐
     │             │       │
     ▼             ▼       ▼
 ┌──────┐    ┌──────────┐ ┌────────┐
 │ Tags │◄───┤ TextTags │ │ Series │
 └──────┘    └──────────┘ └────────┘
```

---

## TypeScript Types Available

All tables export infer types for type safety:

```typescript
// Select types (full record from DB)
Language, Word, WordInstance, Series, Text, Sentence, Tag, POSTag, TextTag

// Insert types (for creating new records)
NewLanguage, NewWord, NewWordInstance, NewSeries, NewText, NewSentence, NewTag, NewPOSTag, NewTextTag
```

---

**Implementation Date:** 2026-02-01
**Status:** ✅ Complete - Ready for database push
