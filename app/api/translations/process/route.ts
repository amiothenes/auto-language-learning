import { NextRequest, NextResponse } from 'next/server';
import { processTranslationsForText } from '@/lib/translation/translationService';
import { requireUser } from '@/lib/auth/requireUser';
import { db } from '@/lib/db';
import { texts } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

// ============================================================================
// POST /api/translations/process
// Internal endpoint — can also be triggered via cron or external tooling.
// Core logic lives in translationService.processTranslationsForText.
// ============================================================================

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  let body: { textId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { textId } = body;
  if (!textId) {
    return NextResponse.json({ error: 'textId is required' }, { status: 400 });
  }

  const text = await db.query.texts.findFirst({
    where: and(eq(texts.id, textId), eq(texts.userId, user.id)),
    columns: { id: true },
  });
  if (!text) {
    return NextResponse.json({ error: 'Text not found' }, { status: 404 });
  }

  const rateLimit = await checkRateLimit('translationsProcess', user.id);
  if (!rateLimit.allowed) {
    return rateLimitResponse('translationsProcess', rateLimit);
  }

  await processTranslationsForText(textId);
  return NextResponse.json({ ok: true });
}
