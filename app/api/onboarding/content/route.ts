import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { getOnboardingContent, excerptFor, startChapterFor, PLACEMENT_LEVELS } from '@/lib/onboarding/content';
import type { ClientOnboardingContent } from '@/lib/onboarding/types';

// ============================================================================
// GET /api/onboarding/content?lang=es: the client-side slice of onboarding
// content (gate copy, picker bands, first words, comprehension excerpts).
// The lemma pools (~250KB) and the full deck stay server-side.
// Returns { content: null } for languages without content (fallback flow).
// ============================================================================

export async function GET(request: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const lang = request.nextUrl.searchParams.get('lang') ?? '';
  const content = getOnboardingContent(lang);
  if (!content) return NextResponse.json<{ content: null }>({ content: null });

  const excerpts = Object.fromEntries(
    PLACEMENT_LEVELS.map((lvl) => {
      const ch = startChapterFor(content, lvl);
      return [lvl, { title: ch.title, titleEn: ch.titleEn, level: ch.level, text: excerptFor(content, lvl) }];
    })
  ) as ClientOnboardingContent['excerpts'];

  const body: ClientOnboardingContent = {
    language: content.language,
    libraryName: content.libraryName,
    gate: content.gate,
    firstWords: content.deck.slice(0, content.firstWordsCount).map((c) => ({
      lemma: c.lemma,
      gloss: c.gloss,
      gender: c.gender,
      conceptId: c.conceptId,
    })),
    bands: content.bands,
    decoys: content.decoys,
    excerpts,
    firstChapter: { title: content.chapters[0].title, titleEn: content.chapters[0].titleEn },
  };

  return NextResponse.json({ content: body }, { headers: { 'Cache-Control': 'private, max-age=3600' } });
}
