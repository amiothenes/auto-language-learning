![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)
![Transformers.js](https://img.shields.io/badge/Transformers.js-in--browser_NLP-FFD21E?logo=huggingface&logoColor=black)
![Vercel](https://img.shields.io/badge/Vercel-deployed-000000?logo=vercel&logoColor=white)

## Auto-Lang

A language learning reader that tracks vocabulary at the lemma level, so your known-word count reflects what you actually know rather than how many surface forms you've encountered.

**Live Demo:** _deploying May 13_

## Demo

![Demo](demo.gif)

## Why I Built It

I was learning German and couldn't find a reader that tracked vocabulary at the lemma level. Existing tools counted word forms separately, which inflated known-word counts: "laufen," "läuft," and "lief" would register as three distinct words instead of one. So I built a reader that treats them all as the same lemma and tracks progress accordingly.

## How It Works

- Paste any foreign-language text into the importer. The NLP pipeline runs immediately in the browser via Transformers.js, with no server round-trip for processing.
- The pipeline tokenizes the text, tags parts of speech, and lemmatizes each word form down to its root.
- Word instances are pre-computed at import time and stored, so the reader loads instantly on subsequent visits without reprocessing.
- Each lemma in your vocabulary gets a status based on your reading history: Newly Seen, Familiar, Known, Well-Known, or Ignored.
- The reader highlights words inline by status tier, giving you a live picture of what you know and what you are still learning.
- Known-word percentage is tracked per text and per series over time, so you can see your vocabulary grow as you read.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Database | Supabase (PostgreSQL) via Drizzle ORM |
| NLP | Transformers.js (@xenova/transformers) |
| Data Fetching | TanStack Query v5 |
| Charts | Chart.js |
| Styling | Tailwind CSS v4 |

## Features

- Lemma-first vocabulary tracking: inflected forms resolve to their root, so "ran," "running," and "runs" all count toward the same word
- Five-tier status system (Newly Seen, Familiar, Known, Well-Known, Ignored) with inline color-coded highlighting that does not interrupt reading flow
- In-browser NLP pipeline (tokenization, POS tagging, lemmatization) with no server round-trip at read time
- Series support: group related texts and track cumulative vocabulary progress across a collection
- Known-word percentage displayed per text and per series, updated as you interact with words
- Reader settings (font size, highlight intensity) persisted locally across sessions

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project for the database

### Installation

```bash
npm install
```

Create a `.env.local` file with your Supabase credentials:

```
DATABASE_URL=your_database_connection_string
```

Push the schema to your database:

```bash
npm run db:push
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Commands

```bash
npm run dev          # localhost:3000
npm run build        # production build
npm run lint         # ESLint
npm run db:push      # push schema to Supabase
npm run db:studio    # Drizzle Studio UI
```

