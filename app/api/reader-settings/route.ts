import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readerSyncSettings } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/requireUser';
import { eq } from 'drizzle-orm';
import { quantizeRate } from '@/lib/tts/rate';
import type { ApiErrorResponse, ReaderSyncSettingsPayload, ReaderSyncSettingsResponse } from '@/lib/types/api';

// ============================================================================
// GET/PUT /api/reader-settings — per-user (not per-language) audio/TTS +
// tutor-mode + highlighting settings, synced across devices.
// ============================================================================

export const DEFAULT_READER_SYNC_SETTINGS: ReaderSyncSettingsPayload = {
  highlightIntensity: 100,
  showWellKnownWords: true,
  highlightMode: 'highlight',
  playbackSpeed: 0.9,
  preferredVoices: {},
  tutorModeEnabled: false,
  tutorModeTiming: 'atWord',
  tutorModeThreshold: 'FAMILIAR',
  tutorModeMaxPerSentence: 2,
  tutorModeResume: 'onDismiss',
};

async function getReaderSyncSettings(userId: string): Promise<ReaderSyncSettingsPayload> {
  const row = await db.query.readerSyncSettings.findFirst({ where: eq(readerSyncSettings.userId, userId) });
  if (!row) return DEFAULT_READER_SYNC_SETTINGS;
  return {
    highlightIntensity: row.highlightIntensity,
    showWellKnownWords: row.showWellKnownWords,
    highlightMode: row.highlightMode,
    playbackSpeed: row.playbackSpeed,
    preferredVoices: row.preferredVoices,
    tutorModeEnabled: row.tutorModeEnabled,
    tutorModeTiming: row.tutorModeTiming,
    tutorModeThreshold: row.tutorModeThreshold,
    tutorModeMaxPerSentence: row.tutorModeMaxPerSentence,
    tutorModeResume: row.tutorModeResume,
  };
}

export async function GET() {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  const settings = await getReaderSyncSettings(user.id);
  return NextResponse.json<ReaderSyncSettingsResponse>({ settings });
}

export async function PUT(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  let body: Partial<ReaderSyncSettingsPayload>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiErrorResponse>({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.highlightMode !== undefined && body.highlightMode !== 'highlight' && body.highlightMode !== 'underline') {
    return NextResponse.json<ApiErrorResponse>({ error: `Invalid highlightMode: ${body.highlightMode}` }, { status: 400 });
  }
  if (
    body.tutorModeTiming !== undefined &&
    !['before', 'atWord', 'after'].includes(body.tutorModeTiming)
  ) {
    return NextResponse.json<ApiErrorResponse>({ error: `Invalid tutorModeTiming: ${body.tutorModeTiming}` }, { status: 400 });
  }
  if (
    body.tutorModeThreshold !== undefined &&
    !['UNKNOWN', 'NEWLY_SEEN', 'FAMILIAR', 'KNOWN'].includes(body.tutorModeThreshold)
  ) {
    return NextResponse.json<ApiErrorResponse>({ error: `Invalid tutorModeThreshold: ${body.tutorModeThreshold}` }, { status: 400 });
  }
  if (body.tutorModeResume !== undefined && body.tutorModeResume !== 'onGrade' && body.tutorModeResume !== 'onDismiss') {
    return NextResponse.json<ApiErrorResponse>({ error: `Invalid tutorModeResume: ${body.tutorModeResume}` }, { status: 400 });
  }

  const current = await getReaderSyncSettings(user.id);
  const merged: ReaderSyncSettingsPayload = {
    ...current,
    ...body,
    highlightIntensity:
      body.highlightIntensity !== undefined
        ? Math.max(0, Math.min(100, body.highlightIntensity))
        : current.highlightIntensity,
    playbackSpeed: body.playbackSpeed !== undefined ? quantizeRate(body.playbackSpeed) : current.playbackSpeed,
  };

  await db
    .insert(readerSyncSettings)
    .values({ userId: user.id, ...merged })
    .onConflictDoUpdate({
      target: readerSyncSettings.userId,
      set: { ...merged, updatedAt: new Date() },
    });

  return NextResponse.json<ReaderSyncSettingsResponse>({ settings: merged });
}
