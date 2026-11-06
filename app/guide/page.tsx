import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Heading, Muted } from '@/components/ui/Typography';
import { EmptyStateIllustration, type IllustrationType } from '@/components/ui/EmptyStateIllustration';

export const metadata = { title: 'Field Guide' };

// ─── The Field Guide ────────────────────────────────────────────────────────
// One short, illustrated chapter per feature: what it is, why it moves your
// Fluency, and a "Try it". Reached from the sidebar, Today, every field note
// ("More in the Field Guide"), and the ? key. Static, server-rendered.

interface Chapter {
  id: string;
  title: string;
  illustration: IllustrationType;
  what: ReactNode;
  why: ReactNode;
  tryIt?: { label: string; href: string };
  extra?: ReactNode;
}

const STATUS_ROWS = [
  { name: 'Unknown', varName: 'unknown', meaning: 'You haven’t met it yet. Tap it to find out what it means.' },
  { name: 'Newly seen', varName: 'new', meaning: 'Just met, so it comes back in Review soon.' },
  { name: 'Familiar', varName: 'familiar', meaning: 'Getting there: you recognise it, mostly.' },
  { name: 'Known', varName: 'known', meaning: 'You know it, and it counts fully toward Fluency.' },
  { name: 'Well known', varName: 'wellknown', meaning: 'Mastered. It retires from Review.' },
];

const CHAPTERS: Chapter[] = [
  {
    id: 'fluency',
    title: 'Fluency and the library map',
    illustration: 'mountain',
    what: (
      <>
        Fluency is the share of everyday text you can read with the words you know. It is weighted by how common
        each word is, so knowing <em>de</em> or <em>casa</em> counts far more than knowing <em>yunque</em>. The
        library map lights a new room as you cross each band, from A1 up to the tower.
      </>
    ),
    why: 'It is the one number everything else serves: reading, Review and placement all exist to push it up. Around 95% is comfortable independent reading.',
    tryIt: { label: 'See your progress', href: '/progress' },
    extra: (
      <Link href="/coverage-info" className="font-sans text-ui-sm text-primary hover:underline">
        How the number is calculated, in detail
      </Link>
    ),
  },
  {
    id: 'reading',
    title: 'Reading and tapping words',
    illustration: 'pages',
    what: 'Open any text and tap a word to see its meaning, its dictionary form and its grammar in this exact sentence. Tap “More” for every place you’ve met it.',
    why: 'Words learned inside a real sentence stick far better than words from a list. Every tap is a small, real lesson.',
    tryIt: { label: 'Open Today’s next step', href: '/dashboard' },
  },
  {
    id: 'statuses',
    title: 'Word colours',
    illustration: 'leaf',
    what: 'Every word wears a colour for how well you know it. Change it right in the reader, or with the number keys 1 to 4.',
    why: 'The colour follows the word into every text, so your whole library updates the moment you learn something.',
    extra: (
      <ul className="grid gap-2 sm:grid-cols-2 mt-1">
        {STATUS_ROWS.map((s) => (
          <li key={s.varName} className="flex items-start gap-2.5">
            <span
              className="mt-1 w-3 h-3 rounded-full shrink-0"
              style={{ background: `hsl(var(--color-status-${s.varName}))` }}
              aria-hidden="true"
            />
            <span className="font-sans text-ui-sm">
              <span className="font-semibold text-ink">{s.name}</span> <span className="text-muted">· {s.meaning}</span>
            </span>
          </li>
        ))}
        <li className="flex items-start gap-2.5">
          <span className="mt-1 w-3 h-3 rounded-full shrink-0 bg-muted/40" aria-hidden="true" />
          <span className="font-sans text-ui-sm">
            <span className="font-semibold text-ink">Ignored</span> <span className="text-muted">· Names and words you don’t want to learn (key I).</span>
          </span>
        </li>
      </ul>
    ),
  },
  {
    id: 'audio',
    title: 'Narration and Tutor Mode',
    illustration: 'bell',
    what: 'Press play to hear the page read aloud, with each word lighting up as it is spoken. Switch on Tutor Mode and narration pauses on words you don’t know yet and asks whether you know them.',
    why: 'You hear how words actually sound, and Tutor Mode turns passive listening into quick recall practice without leaving the story.',
  },
  {
    id: 'review',
    title: 'Review and the starter deck',
    illustration: 'hourglass',
    what: 'Review shows each word just before you would forget it, as a sentence card from your reading or a picture card from the starter deck. Answer honestly: Knew it, or Didn’t.',
    why: 'Spaced review is the cheapest way to keep what you’ve learned. A few minutes a day keeps every word that counts toward your Fluency.',
    tryIt: { label: 'Open Review', href: '/review' },
    extra: (
      <p className="font-sans text-ui-sm text-muted">
        The starter deck is the Core 625: the most useful first words, introduced a few at a day, plus the small
        grammar words you need to read. Words you already know are skipped.
      </p>
    ),
  },
  {
    id: 'vocabulary',
    title: 'Your vocabulary',
    illustration: 'vocabulary',
    what: 'Every word you’ve met, with its status, how often you’ve seen it and where. Filter by colour, search, bulk-change statuses, or import a list.',
    why: 'It’s where you tidy up: mark words you already know so they stop being highlighted, or find the shaky ones to study.',
    tryIt: { label: 'Open Vocabulary', href: '/vocabulary' },
  },
  {
    id: 'series',
    title: 'Series and readiness',
    illustration: 'books',
    what: 'Series group texts like chapters of a book. Each text shows how much of it you already know: Ready (80% or more), OK, or Hard.',
    why: 'Reading at the right level is the fastest way up. Texts you mostly know are enjoyable and teach the words that remain.',
    tryIt: { label: 'Browse your series', href: '/series' },
  },
  {
    id: 'importing',
    title: 'Bring your own texts',
    illustration: 'quill',
    what: 'Paste an article, a page of a novel or song lyrics, upload a file, or import from a web address. Long texts are split into pages automatically.',
    why: 'You learn the words of whatever you love to read, and they all count toward the same Fluency.',
    tryIt: { label: 'Start a new series', href: '/series?new=true' },
  },
  {
    id: 'placement',
    title: 'Your level and placement',
    illustration: 'compass',
    what: 'When you add a language, a short placement asks which words you know and checks one page. Verbista then marks the words you most likely know and starts your story at your level.',
    why: 'You start where you really are, instead of tapping through hundreds of words you already know.',
    tryIt: { label: 'Retake placement in Settings', href: '/settings/languages' },
  },
];

const SHORTCUTS: Array<[string, string]> = [
  ['?', 'Open this Field Guide'],
  ['/', 'Search your vocabulary'],
  ['Space', 'Play or pause narration (reader), or reveal a card (Review)'],
  ['1 – 4', 'Set a word to Newly seen, Familiar, Known or Well known'],
  ['↑ / ↓', 'Step the open word’s status up or down'],
  ['I', 'Ignore the open word'],
  ['Backspace', 'Reset the open word to Unknown'],
  ['Esc', 'Close'],
];

export default function GuidePage() {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="space-y-2 mb-6 md:mb-8">
          <p className="font-sans text-ui-xs uppercase tracking-wide text-riso-coral font-semibold">Field Guide</p>
          <Heading size="2xl" as="h1">
            How the library works
          </Heading>
          <Muted>Every feature in one place: what it does, and how it helps you read more.</Muted>
        </header>

        <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
          {/* Contents: a chip row on phones and tablets, a sticky column on desktop */}
          <nav aria-label="Field Guide chapters" className="mb-6 lg:mb-0">
            <ol className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible -mx-4 px-4 lg:mx-0 lg:px-0 pb-1 lg:sticky lg:top-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[...CHAPTERS.map((c) => ({ id: c.id, title: c.title })), { id: 'shortcuts', title: 'Keyboard shortcuts' }].map((c) => (
                <li key={c.id} className="shrink-0">
                  <a
                    href={`#${c.id}`}
                    className="block whitespace-nowrap lg:whitespace-normal font-sans text-ui-sm text-muted hover:text-ink border border-border lg:border-0 bg-paper lg:bg-transparent rounded-full lg:rounded px-3 py-1.5 lg:px-2 lg:py-1 hover:bg-desk"
                  >
                    {c.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-5 md:space-y-6">
            {CHAPTERS.map((c) => (
              <section
                key={c.id}
                id={c.id}
                aria-labelledby={`${c.id}-title`}
                className="scroll-mt-6 bg-paper border border-border rounded-card shadow-raised p-5 md:p-6 sm:flex sm:gap-5"
              >
                <div className="shrink-0 mb-3 sm:mb-0" aria-hidden="true">
                  <EmptyStateIllustration type={c.illustration} size={80} />
                </div>
                <div className="min-w-0 space-y-2.5">
                  <h2 id={`${c.id}-title`} className="font-sans text-ui-xl font-semibold text-ink">
                    {c.title}
                  </h2>
                  <p className="font-sans text-ui-base text-ink leading-relaxed">{c.what}</p>
                  <p className="font-sans text-ui-sm text-muted leading-relaxed">
                    <span className="font-semibold text-primary">Why it matters: </span>
                    {c.why}
                  </p>
                  {c.extra}
                  {c.tryIt && (
                    <Link
                      href={c.tryIt.href}
                      className="inline-flex items-center gap-1 min-h-[40px] font-sans text-ui-sm font-medium text-primary hover:underline"
                    >
                      {c.tryIt.label} <ArrowRight size={14} strokeWidth={2} />
                    </Link>
                  )}
                </div>
              </section>
            ))}

            <section id="shortcuts" aria-labelledby="shortcuts-title" className="scroll-mt-6 bg-paper border border-border rounded-card shadow-raised p-5 md:p-6">
              <h2 id="shortcuts-title" className="font-sans text-ui-xl font-semibold text-ink mb-3">
                Keyboard shortcuts
              </h2>
              <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_minmax(0,1fr)]">
                {SHORTCUTS.map(([k, d]) => (
                  <div key={k} className="contents">
                    <dt>
                      <kbd className="inline-block min-w-[2rem] text-center font-sans text-ui-xs font-semibold text-ink bg-desk border border-border rounded px-1.5 py-0.5 shadow-raised">
                        {k}
                      </kbd>
                    </dt>
                    <dd className="font-sans text-ui-sm text-muted mb-2 sm:mb-0">{d}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <p className="font-sans text-ui-xs text-muted px-1">
              The starter deck’s concept list is based on Gabriel Wyner’s “Your First 625” thematic word list
              (Fluent Forever). Translations, story and illustrations are Verbista’s own.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
