import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { texts, languages, wordInstances, wordTranslations } from '@/lib/db/schema';
import { eq, asc, and, inArray } from 'drizzle-orm';
import type { WordInstanceItem, WordInstancesResponse, ApiErrorResponse } from '@/lib/types/api';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import type { WordTranslation } from '@/lib/db/schema/wordTranslations';
import { requireUser } from '@/lib/auth/requireUser';

// ============================================================================
// GET /api/texts/[id]/word-instances — Word instances for reader highlighting
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Text ID is required' },
        { status: 400 }
      );
    }

    // 1. Verify text exists, belongs to user, and get its language
    const text = await db.query.texts.findFirst({
      where: and(eq(texts.id, id), eq(texts.userId, user.id)),
      columns: { id: true, title: true, languageId: true },
    });

    if (!text) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Text not found with ID: ${id}` },
        { status: 404 }
      );
    }

    console.log(`[Word Instances] Fetching instances for text: "${text.title}" (${id})`);

    // 2. Resolve the language's default translation target
    // TODO(auth): derive targetLangCode from user.nativeLanguagCode when auth lands
    const language = await db.query.languages.findFirst({
      where: eq(languages.id, text.languageId),
      columns: { defaultTranslationLangCode: true },
    });
    const targetLangCode = language?.defaultTranslationLangCode ?? null;

    // 3. Fetch all word instances with their lemma data
    const rows = await db.query.wordInstances.findMany({
      where: eq(wordInstances.textId, id),
      with: { word: true },
      orderBy: [asc(wordInstances.position)],
    });

    // 4. Bulk-fetch word_translations for all word IDs in this text
    const wordTranslationMap = new Map<string, WordTranslation>();

    if (targetLangCode && rows.length > 0) {
      const wordIds = [...new Set(rows.map((r) => r.wordId))];
      const translations = await db
        .select()
        .from(wordTranslations)
        .where(
          and(
            inArray(wordTranslations.wordId, wordIds),
            eq(wordTranslations.targetLangCode, targetLangCode)
          )
        );
      for (const t of translations) {
        wordTranslationMap.set(t.wordId, t);
      }
    }

    // 5. Map to flat WordInstanceItem shape — prefer word_translations over legacy words.translation
    const instances: WordInstanceItem[] = rows.map((instance) => {
      const wt = wordTranslationMap.get(instance.wordId);
      return {
        instanceId: instance.id,
        wordId: instance.wordId,
        surface: instance.surfaceForm,
        lemma: instance.word.lemma,
        pos: instance.pos ?? null,
        translation: wt?.translation ?? instance.word.translation ?? null,
        romanization: instance.word.romanization ?? null,
        dictionaryFrequency: instance.word.dictionaryFrequency,
        userFrequency: instance.word.userFrequency,
        status: instance.word.status as VocabularyStatus,
        position: instance.position,
        sentenceId: instance.sentenceId ?? null,
        inflectionData: instance.inflectionData ?? null,
        meanings: wt?.meanings ?? null,
        exampleSentence: wt?.exampleSentence ?? null,
        exampleSentenceTranslation: wt?.exampleSentenceTranslation ?? null,
        translationSource: wt?.source ?? null,
      };
    });

    console.log(`[Word Instances] Found ${instances.length} instances`);

    return NextResponse.json<WordInstancesResponse>({ textId: id, instances });
  } catch (error) {
    console.error('[Word Instances] Unexpected error:', error);

    return NextResponse.json<ApiErrorResponse>(
      {
        error: 'Internal server error fetching word instances',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
