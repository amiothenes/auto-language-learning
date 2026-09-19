import { pgTable, text, json, timestamp, index } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Append-only record of destructive user actions, for support / incident
// response. `userId` is deliberately NOT a foreign key: rows must survive the
// user (or their data) being deleted. Server-only — RLS is enabled with no
// policies, so only the service role / direct DB connection can read or write.
export const auditLog = pgTable(
  'audit_log',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id').notNull(),
    action: text('action').notNull(),
    targetType: text('target_type'),
    targetId: text('target_id'),
    metadata: json('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userCreatedIdx: index('audit_log_user_created_idx').on(table.userId, table.createdAt),
    createdIdx: index('audit_log_created_idx').on(table.createdAt),
  })
).enableRLS();

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;
