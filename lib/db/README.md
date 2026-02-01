# Database Setup Guide

This project uses Drizzle ORM with PostgreSQL (via Neon serverless driver).

## Quick Start

### 1. Set Up Database Connection

Create a `.env.local` file in the project root (or copy from `.env.example`):

```bash
DATABASE_URL="postgresql://user:password@host:port/database"
```

For Neon (recommended):
```bash
DATABASE_URL="postgres://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

### 2. Generate and Push Schema

```bash
# Generate migration files
npm run db:generate

# Push schema to database
npm run db:push
```

### 3. Seed Database

```bash
npm run db:seed
```

This will populate the database with 14 common languages.

### 4. View Database (Optional)

```bash
npm run db:studio
```

Opens Drizzle Studio in your browser for visual database exploration.

## Available Scripts

- `npm run db:generate` - Generate migration files from schema
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio
- `npm run db:seed` - Seed database with initial data

## Database Schema

### Languages Table

- `id` - CUID2 primary key
- `code` - ISO 639-1 language code (unique)
- `name` - Full language name
- `isRTL` - Right-to-left flag
- `dictURI` - Dictionary URL template
- `translateURI` - Translation URL template
- `googleTTSCode` - Google TTS language code
- `characterSubstitutions` - JSON map for character normalization
- `sentenceSplitRegex` - Regex for sentence splitting
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

## Seeded Languages

The seed script includes:
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Chinese Simplified (zh)
- Japanese (ja)
- Arabic (ar) - RTL
- Russian (ru)
- Portuguese (pt)
- Italian (it)
- Korean (ko)
- Dutch (nl)
- Polish (pl)
- Hebrew (he) - RTL

## Using the Database

```typescript
import { db } from '@/lib/db';
import { languages } from '@/lib/db/schema';

// Get all languages
const allLanguages = await db.select().from(languages);

// Get specific language
const english = await db.select()
  .from(languages)
  .where(eq(languages.code, 'en'));
```
