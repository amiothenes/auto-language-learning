# Auto-Language-Learning

A Next.js language learning application for tracking vocabulary growth at the lemma (root word) level.

## Overview

Auto-Language-Learning helps language learners track their vocabulary by analyzing texts at the **lemma** level, not surface forms. Users paste foreign-language content to read, and the system:

- Identifies grammatical inflections
- Tracks vocabulary by lemma (root word)
- Organizes texts into Series
- Computes learning progress in real-time

**Current Status:** Frontend-only prototype with hardcoded data. Backend with Drizzle ORM planned.

## Quick Start

### Prerequisites
- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Available Commands
```bash
npm run dev      # Start development server
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

## Project Architecture

### Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **Charts:** Chart.js
- **State:** React Context + useState (no external state library)

### Directory Structure

```
app/                      # Next.js App Router pages
├── page.tsx              # Dashboard
├── reader/[id]/          # 3-panel reader (core experience)
├── series/               # Series library
├── vocabulary/           # Vocabulary browser
└── settings/             # Settings pages

components/               # React components (feature-based folders)
├── dashboard/            # Dashboard stats and lists
├── reader/               # Reader-specific components
├── series/               # Series and text cards
├── vocabulary/           # Vocabulary table and filters
├── settings/             # Settings controls
└── ui/                   # Shared primitives

lib/
├── contexts/             # React Context providers
├── hooks/                # Custom React hooks
├── types/                # Centralized TypeScript types
└── utils.ts              # Utility functions

docs/                     # Product documentation
├── Auto-Lang PRD.md      # Product requirements
├── Auto-Lang Data Model.md
└── ...
```

### Key Architectural Concepts

#### 1. Lemma-First Design
- **Lemma** = root word form (e.g., "run")
- **Surface form** = actual word in text (e.g., "running")
- ALL vocabulary statistics track lemmas, not surface forms
- Surface forms are UI artifacts for display only

**Example:** The words "habló", "habla", and "hablando" all map to the lemma "hablar". Vocabulary progress tracks "hablar", not each individual form.

#### 2. Single-Language Scope
- The entire app UI operates on ONE language at a time
- Selected via `LanguageContext` at the top level
- All content is filtered by the selected language

#### 3. Vocabulary Status Flow
```
NEWLY_SEEN → FAMILIAR → KNOWN → WELL_KNOWN
                    ↓
                 IGNORE (manual opt-out)
```

**Status Meanings:**
- **NEWLY_SEEN:** First encounter with this lemma
- **FAMILIAR:** Seen multiple times, partially learned
- **KNOWN:** Confidently understood
- **WELL_KNOWN:** Mastered, no highlighting needed
- **IGNORE:** User manually excluded (proper nouns, etc.)

#### 4. Two Types of Frequency (Critical Distinction)
- **`dictionaryFrequency` (0-100):** How common the word is in the language based on corpus analysis
- **`userFrequency` (1+):** How many times YOU have encountered this lemma across all texts
- These are NEVER merged or conflated

**Example:** "the" has `dictionaryFrequency: 100` (extremely common), but for a new user, `userFrequency: 3` (only seen it 3 times so far).

### Component Organization

Components are organized by feature/domain:
- `components/reader/` - Reader panel, word interaction, tooltips
- `components/vocabulary/` - Vocabulary browser, filters, bulk actions
- `components/series/` - Series and text cards
- `components/dashboard/` - Stats, graphs, recent texts
- `components/settings/` - Settings controls (toggle, slider, select)
- `components/ui/` - Shared primitives (button, card, typography, etc.)

**Design Pattern:** Feature-based folders, not component-type folders. This keeps related components together and makes the codebase easier to navigate.

### State Management

React Context + `useState` only (no Redux/Zustand):
- **`LanguageContext`** - Selected language, filters all content
- **`ReaderSettingsContext`** - Font size, highlight intensity, color scheme (persisted to localStorage)

**Why Context?** Simple, built-in, sufficient for current scope. May migrate to a state management library when backend is added.

### Design System

Strict, intentional design inspired by paper and desk aesthetics:
- **Primary:** Library Green (`#183A37`)
- **Background:** Desk (`#F0EFEA`)
- **Surface:** Paper (`#FAF9F5`)
- **Text:** Primary Ink (`#141413`), Muted Ink (`#6E6D6A`)
- **Typography:** Inter (UI) + EB Garamond (language content)

**Rule:** If it's the *interface* → Inter. If it's the *language being learned* → EB Garamond.

## Data Model

Currently using hardcoded data with `TEMP_` prefixes. All marked with `// TODO: Replace with API call`.

### Core Types (in `lib/types/`)

**Vocabulary Types (`vocabulary.ts`):**
```typescript
VocabularyStatus    // Enum: NEWLY_SEEN, FAMILIAR, KNOWN, WELL_KNOWN, IGNORE
WordData            // Lemma occurrence in text with full metadata
VocabularyItem      // Lemma entry in vocabulary browser
```

**Content Types (`content.ts`):**
```typescript
Series              // Collection of related texts
SeriesDetail        // Extended series data with text list
Text                // Individual text metadata
TextData            // Full text with content
ParagraphProgress   // Mini-map paragraph data
```

**Language Types (`language.ts`):**
```typescript
Language            // Language definition (code, name)
LanguageContextType // Context value for language selection
```

**UI Types (`ui.ts`):**
```typescript
FontSize            // 'small' | 'medium' | 'large'
ColorScheme         // 'light' | 'dark'
ReaderSettings      // Reader customization settings
SeriesSortOption    // Series sorting options
VocabularySortOption // Vocabulary sorting options
```

## Development Guidelines

### Code Conventions
- No inline styles - Tailwind only
- No `any` types - strict TypeScript
- Explicit prop interfaces for components
- Use `cn()` from `lib/utils.ts` for conditional classes
- Hardcoded data marked with `// TODO: Replace with API call`
- Use `import type` for type-only imports to avoid Turbopack issues

### Reader Highlighting Rules
| Status | Visual |
|--------|--------|
| NEWLY_SEEN | Red tint background |
| FAMILIAR | Orange tint background |
| KNOWN | Subtle green background |
| WELL_KNOWN | No styling |
| IGNORE | Dashed underline, reduced opacity |

**Design Principle:** Highlighting should be accessible, subtle, and non-distracting for long reading sessions.

### Accessibility Requirements
- WCAG AA contrast ratios
- Full keyboard navigation
- Visible focus states
- Semantic HTML
- Proper ARIA labels
- Modal focus trapping

### Responsive Breakpoints
- Mobile-first approach
- 768px (tablet)
- 1024px (desktop)

**Sidebar behavior:**
- Desktop: hover-expand
- Mobile: bottom tab bar

## Performance Considerations

The reader is the most performance-sensitive area:
- Virtualize long text content
- Debounce search inputs (300ms)
- Memoize expensive computations
- Avoid unnecessary re-renders in Reader

**Why?** The reader needs to handle texts with hundreds of interactive words while remaining responsive.
