import { eq, and, type SQL } from 'drizzle-orm';
import { languages, series, texts, words } from '@/lib/db/schema';

// Tables that carry a NOT NULL userId column and must always be scoped to the
// requesting user in every query that reads, updates, or deletes a row by id.
const userScopedTables = { languages, series, texts, words } as const;

type UserScopedTableName = keyof typeof userScopedTables;

// Builds and(eq(table.id, id), eq(table.userId, userId)) for one of the four
// user-owned tables. Works with both db.query.<table>.findFirst({ where }) and
// db.select()/.update()/.delete().where(...), since both consume a `where:` condition.
export function ownedBy<T extends UserScopedTableName>(
  tableName: T,
  id: string,
  userId: string
): SQL {
  const table = userScopedTables[tableName];
  return and(eq(table.id, id), eq(table.userId, userId))!;
}
