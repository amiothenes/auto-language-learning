import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { texts, tags, textTags, series } from '@/lib/db/schema';
import { inArray, and, eq, asc, sql } from 'drizzle-orm';
import type { ApiErrorResponse } from '@/lib/types/api';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

// ============================================================================
// POST /api/texts/bulk-action — delete / tag / move many texts at once
// ============================================================================

const MAX_IDS = 500;

type BulkActionBody =
  | { action: 'delete'; textIds: string[] }
  | { action: 'tag'; textIds: string[]; tagNames: string[] }
  | { action: 'move'; textIds: string[]; targetSeriesId: string };

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  try {
    const body = await request.json() as Partial<BulkActionBody>;
    const { action, textIds } = body;

    if (!Array.isArray(textIds) || textIds.length === 0) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'textIds must be a non-empty array' },
        { status: 400 }
      );
    }
    if (textIds.length > MAX_IDS) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Maximum ${MAX_IDS} text IDs per request` },
        { status: 400 }
      );
    }

    const rateLimit = await checkRateLimit('textsBulk', user.id);
    if (!rateLimit.allowed) {
      return rateLimitResponse('textsBulk', rateLimit);
    }

    if (action === 'delete') {
      const deleted = await db
        .delete(texts)
        .where(and(inArray(texts.id, textIds), eq(texts.userId, user.id)))
        .returning({ id: texts.id });

      return NextResponse.json({ action: 'delete', deleted: deleted.length });
    }

    if (action === 'tag') {
      const tagNames = (body as { tagNames?: string[] }).tagNames;
      if (!Array.isArray(tagNames) || tagNames.length === 0) {
        return NextResponse.json<ApiErrorResponse>(
          { error: 'tagNames must be a non-empty array' },
          { status: 400 }
        );
      }

      // Only touch texts the user actually owns.
      const owned = await db
        .select({ id: texts.id })
        .from(texts)
        .where(and(inArray(texts.id, textIds), eq(texts.userId, user.id)));

      let tagged = 0;
      if (owned.length > 0) {
        for (const rawName of tagNames) {
          const trimmed = rawName.trim();
          if (!trimmed) continue;

          const [tag] = await db
            .insert(tags)
            .values({ name: trimmed, userId: user.id })
            .onConflictDoUpdate({
              target: [tags.name, tags.userId],
              set: { name: trimmed },
            })
            .returning({ id: tags.id });
          if (!tag) continue;

          await db
            .insert(textTags)
            .values(owned.map((t) => ({ textId: t.id, tagId: tag.id })))
            .onConflictDoNothing();
        }
        tagged = owned.length;
      }

      return NextResponse.json({ action: 'tag', tagged, tagNames });
    }

    if (action === 'move') {
      const targetSeriesId = (body as { targetSeriesId?: string }).targetSeriesId;
      if (!targetSeriesId) {
        return NextResponse.json<ApiErrorResponse>(
          { error: 'targetSeriesId is required' },
          { status: 400 }
        );
      }

      const dest = await db.query.series.findFirst({
        where: and(eq(series.id, targetSeriesId), eq(series.userId, user.id)),
        columns: { id: true },
      });
      if (!dest) {
        return NextResponse.json<ApiErrorResponse>(
          { error: `Target series not found: ${targetSeriesId}` },
          { status: 404 }
        );
      }

      const moved = await db.transaction(async (tx) => {
        const [{ maxOrder }] = await tx
          .select({ maxOrder: sql<number>`coalesce(max(${texts.order}), 0)` })
          .from(texts)
          .where(and(eq(texts.seriesId, targetSeriesId), eq(texts.userId, user.id)));

        const moving = await tx
          .select({ id: texts.id })
          .from(texts)
          .where(and(inArray(texts.id, textIds), eq(texts.userId, user.id)))
          .orderBy(asc(texts.order));

        await Promise.all(
          moving.map((t, i) =>
            tx
              .update(texts)
              .set({ seriesId: targetSeriesId, order: maxOrder + i + 1, updatedAt: new Date() })
              .where(and(eq(texts.id, t.id), eq(texts.userId, user.id)))
          )
        );

        return moving.length;
      });

      return NextResponse.json({ action: 'move', moved, targetSeriesId });
    }

    return NextResponse.json<ApiErrorResponse>(
      { error: `Invalid action: ${String(action)}` },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Texts Bulk Action] Error:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Internal server error performing bulk action' },
      { status: 500 }
    );
  }
}
