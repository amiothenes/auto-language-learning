import * as Sentry from '@sentry/nextjs';
import { db } from '@/lib/db';
import { auditLog } from '@/lib/db/schema';

export type AuditAction =
  | 'data.wipe'
  | 'vocabulary.cleanup_orphaned'
  | 'vocabulary.import_replace'
  | 'text.delete'
  | 'text.bulk_delete'
  | 'series.delete'
  | 'language.delete';

interface AuditEvent {
  userId: string;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Record a destructive action. Call after the delete succeeds. Never throws:
 * a failed audit write must not fail or roll back the user's action, so on
 * error it falls back to a structured console line and reports to Sentry.
 */
export async function logAudit(event: AuditEvent): Promise<void> {
  try {
    await db.insert(auditLog).values({
      userId: event.userId,
      action: event.action,
      targetType: event.targetType ?? null,
      targetId: event.targetId ?? null,
      metadata: event.metadata ?? null,
    });
  } catch (error) {
    console.error('[audit] failed to write audit log', JSON.stringify({ ...event, at: new Date().toISOString() }), error);
    Sentry.captureException(error, {
      tags: { area: 'audit' },
      extra: { action: event.action },
    });
  }
}
