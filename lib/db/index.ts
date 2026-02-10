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

const client = postgres(process.env.DATABASE_URL, { max: 1 });
export const db = drizzle({ client, schema });
