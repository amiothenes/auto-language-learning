import { NextRequest, NextResponse } from 'next/server';
import { processTranslationsForText } from '@/lib/translation/translationService';

// ============================================================================
// POST /api/translations/process
// Internal endpoint — can also be triggered via cron or external tooling.
// Core logic lives in translationService.processTranslationsForText.
// TODO(auth): accept userId to scope target language per-user when auth lands
// ============================================================================

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-admin-key');
  if (secret !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  await processTranslationsForText(textId);
  return NextResponse.json({ ok: true });
}
