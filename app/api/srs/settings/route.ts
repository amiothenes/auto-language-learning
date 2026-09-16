import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { srsSettings } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { getSrsSettings } from '@/lib/srs/queue';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import type { ApiErrorResponse, SrsSettingsPayload, SrsSettingsResponse } from '@/lib/types/api';

// ============================================================================
// GET/PUT /api/srs/settings — Per user+language SRS configuration
// ============================================================================

export async function GET(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const languageId = searchParams.get('languageId');
  if (!languageId) {
    return NextResponse.json<ApiErrorResponse>({ error: 'languageId query parameter is required' }, { status: 400 });
  }

  const settings = await getSrsSettings(user.id, languageId);
  return NextResponse.json<SrsSettingsResponse>({ settings });
}

export async function PUT(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const languageId = searchParams.get('languageId');
  if (!languageId) {
    return NextResponse.json<ApiErrorResponse>({ error: 'languageId query parameter is required' }, { status: 400 });
  }

  let body: Partial<SrsSettingsPayload>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiErrorResponse>({ error: 'Invalid JSON' }, { status: 400 });
  }

  const validStatuses = Object.values(VocabularyStatus);
  for (const key of ['minEligibleStatus', 'maxEligibleStatus', 'typeSwitchStatus'] as const) {
    const value = body[key];
    if (value !== undefined && !validStatuses.includes(value)) {
      return NextResponse.json<ApiErrorResponse>({ error: `Invalid ${key}: ${value}` }, { status: 400 });
    }
  }
  if (body.newCardsPosition !== undefined && body.newCardsPosition !== 'end' && body.newCardsPosition !== 'interleaved') {
    return NextResponse.json<ApiErrorResponse>(
      { error: `Invalid newCardsPosition: ${body.newCardsPosition}` },
      { status: 400 }
    );
  }

  const current = await getSrsSettings(user.id, languageId);
  const merged: SrsSettingsPayload = { ...current, ...body };

  await db
    .insert(srsSettings)
    .values({
      userId: user.id,
      languageId,
      newCardsPerDay: merged.newCardsPerDay,
      reviewsPerDay: merged.reviewsPerDay,
      minEligibleStatus: merged.minEligibleStatus,
      maxEligibleStatus: merged.maxEligibleStatus,
      typeSwitchStatus: merged.typeSwitchStatus,
      sentenceAudioEnabled: merged.sentenceAudioEnabled,
      wordAudioEnabled: merged.wordAudioEnabled,
      newCardsPosition: merged.newCardsPosition,
    })
    .onConflictDoUpdate({
      target: [srsSettings.userId, srsSettings.languageId],
      set: {
        newCardsPerDay: merged.newCardsPerDay,
        reviewsPerDay: merged.reviewsPerDay,
        minEligibleStatus: merged.minEligibleStatus,
        maxEligibleStatus: merged.maxEligibleStatus,
        typeSwitchStatus: merged.typeSwitchStatus,
        sentenceAudioEnabled: merged.sentenceAudioEnabled,
        wordAudioEnabled: merged.wordAudioEnabled,
        newCardsPosition: merged.newCardsPosition,
        updatedAt: new Date(),
      },
    });

  return NextResponse.json<SrsSettingsResponse>({ settings: merged });
}
