import { config } from 'dotenv';

// Load environment variables from .env.local for non-Next.js contexts
if (!process.env.DATABASE_URL) {
  config({ path: '.env.local' });
}

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Reuse the client across Next.js dev-mode hot reloads to avoid exhausting
// Supabase's pooler connection limit (each module reload would otherwise
// spin up a brand new postgres() connection pool).
const globalForDb = globalThis as unknown as {
  postgresClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.postgresClient ?? postgres(process.env.DATABASE_URL, { max: 10 });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.postgresClient = client;
}

export const db = drizzle({ client, schema });
