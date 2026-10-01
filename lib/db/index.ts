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

// max: 10 — each warm serverless instance holds its own module-scoped client;
// this caps *logical* connections per instance (Supavisor transaction-mode
// pooling multiplexes these onto real Postgres connections), not per request.
// Was 1, which fully serialized every query a single request makes (e.g. the
// several inArray-batched queries lib/srs/queue.ts now issues concurrently
// per session build) — raised so same-request queries can actually run in
// parallel. Verify against the project's configured Supavisor pool size under
// load if connections look saturated.
// prepare: false — required for the transaction-mode pooler (Supavisor), which
// hands out a different underlying connection per query.
const client = postgres(process.env.DATABASE_URL, { max: 10, prepare: false });
export const db = drizzle({ client, schema });
