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

// max: 1 — each warm serverless instance holds its own module-scoped client,
// so this caps connections per instance, not per request (Supabase guidance).
// prepare: false — required for the transaction-mode pooler (Supavisor), which
// hands out a different underlying connection per query.
const client = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
export const db = drizzle({ client, schema });
