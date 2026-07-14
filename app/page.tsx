import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, FileText, MousePointerClick, BarChart3 } from 'lucide-react';

// ─── Grammar Demo ─────────────────────────────────────────────────────────────
// Static mockup of the reader experience — the core differentiator made visible.
// Uses the actual vocabulary-status highlight color (FAMILIAR = orange).
function GrammarDemo() {
  return (
    <div className="bg-paper border border-border rounded-card shadow-raised p-6 md:p-8 relative overflow-visible">
      {/* Faux reader header */}
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: 'hsla(32, 90%, 56%, 0.9)' }}
        />
        <span className="font-sans text-ui-xs text-muted tracking-widest uppercase">
          Familiar · Russian
        </span>
      </div>

      {/* Sentence with highlighted word */}
      <div className="relative">
        <p
          className="text-ink leading-relaxed"
          style={{ fontFamily: 'var(--font-eb-garamond)', fontSize: '22px', lineHeight: 1.7 }}
        >
          {'Я читаю '}
          <span className="relative inline-block">
            {/* Highlighted word — matches the FAMILIAR status color in the real reader */}
            <span
              className="rounded px-1 py-0.5"
              style={{ background: 'hsla(32, 90%, 56%, 0.25)' }}
            >
              книгу
            </span>

            {/* Grammar tooltip card */}
            <span className="absolute left-0 top-full mt-2 z-20 bg-paper border border-border rounded-card shadow-modal p-3 min-w-45 pointer-events-none">
              <span className="block font-sans text-ui-xs text-muted uppercase tracking-wider mb-1.5">
                Noun
              </span>
              <span
                className="block text-ink font-medium mb-2"
                style={{ fontFamily: 'var(--font-eb-garamond)', fontSize: '20px' }}
              >
                книга
              </span>
              <span className="flex flex-wrap gap-1 mb-2.5">
                <span className="font-sans text-ui-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                  Accusative
                </span>
                <span className="font-sans text-ui-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                  Singular
                </span>
              </span>
              <span className="block font-sans text-ui-sm text-ink">book</span>
            </span>
          </span>
          {' в библиотеке.'}
        </p>

        {/* Translation */}
        <p className="font-sans text-ui-sm text-muted mt-4 italic">
          I am reading a book in the library.
        </p>
      </div>

      {/* "Try tapping" hint */}
      <p className="font-sans text-ui-xs text-muted mt-5 pt-4 border-t border-border flex items-center gap-1.5">
        <MousePointerClick size={12} strokeWidth={2} />
        Tap any word to see its case, tense, or aspect
      </p>
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    n: '1',
    icon: FileText,
    title: 'Import any text',
    body: 'Paste an article, a chapter, or a news item. Verbista parses it word by word using NLP.',
  },
  {
    n: '2',
    icon: MousePointerClick,
    title: 'Read with grammar labels',
    body: 'Every word is highlighted by vocabulary status. Tap it to get the lemma, grammar, and translation.',
  },
  {
    n: '3',
    icon: BarChart3,
    title: 'Track your known words',
    body: 'Mark words as Familiar, Known, or Well-Known. Watch your reading coverage grow over time.',
  },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-desk">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-desk/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/illustrations/verbista-icon.png"
              alt="Verbista"
              width={28}
              height={28}
              className="rounded-md"
            />
            <span
              className="text-ink"
              style={{ fontFamily: 'var(--font-eb-garamond)', fontSize: '22px' }}
            >
              Verbista
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="font-sans text-ui-sm text-muted hover:text-ink transition-colors px-3 py-2 rounded"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="font-sans text-ui-sm font-medium bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-16 md:pb-24">

        {/* Language chips */}
        <div className="flex flex-wrap items-center gap-2 mb-10">
          {[
            { flag: '🇷🇺', name: 'Russian' },
            { flag: '🇪🇸', name: 'Spanish' },
            { flag: '🇬🇧', name: 'English' },
            { flag: '🇫🇷', name: 'French' },
          ].map(({ flag, name }) => (
            <span
              key={name}
              className="font-sans text-ui-xs text-muted border border-border bg-paper rounded px-2.5 py-1"
            >
              {flag} {name}
            </span>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">

          {/* Headline + CTAs */}
          <div>
            <h1
              className="text-ink mb-4"
              style={{
                fontFamily: 'var(--font-eb-garamond)',
                fontSize: 'clamp(38px, 5vw, 62px)',
                lineHeight: 1.1,
              }}
            >
              The words
              <br />
              explain{' '}
              <em
                className="not-italic"
                style={{ color: '#183A37' }}
              >
                themselves.
              </em>
            </h1>
            <p className="font-sans text-ui-md text-muted leading-relaxed mb-8 max-w-sm">
              Read in Russian, Spanish, French, or English. Tap any word to see its
              grammatical case, tense, and aspect, drawn directly from the sentence.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 font-sans text-ui-base font-medium bg-primary text-white px-5 py-2.5 rounded hover:bg-primary-dark transition-colors"
              >
                Start reading free
                <ArrowRight size={16} strokeWidth={2} />
              </Link>
              <Link
                href="/login"
                className="font-sans text-ui-base text-muted hover:text-ink transition-colors py-2.5 px-2"
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* Demo */}
          <div className="relative">
            {/* Decorative blur behind the demo */}
            <div
              className="absolute inset-0 rounded-card opacity-10 blur-3xl -z-10"
              style={{ background: '#183A37' }}
            />
            <GrammarDemo />
          </div>
        </div>
      </section>

      {/* ── Feature spotlight ────────────────────────────────────────────── */}
      <section className="bg-paper border-y border-border py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <p className="font-sans text-ui-sm text-muted tracking-widest uppercase mb-4">
            The differentiator
          </p>
          <h2
            className="text-ink mb-6"
            style={{
              fontFamily: 'var(--font-eb-garamond)',
              fontSize: 'clamp(28px, 4vw, 48px)',
              lineHeight: 1.2,
            }}
          >
            Grammar tooltips, straight from the text.
          </h2>
          <p className="font-sans text-ui-md text-muted leading-relaxed max-w-xl mx-auto mb-12">
            No grammar drills. No separate reference tab. Case, tense, and aspect
            appear the moment you tap, because the sentence already contains the answer.
          </p>

          <div className="w-full rounded-card overflow-hidden border border-border shadow-modal mb-12">
            <video
              src="/demo.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto block"
            />
          </div>

          {/* Supporting bullets */}
          <div className="grid sm:grid-cols-3 gap-6 text-left">
            {[
              { label: 'Case', detail: 'Nominative, Accusative, Genitive: shown for every noun and adjective.' },
              { label: 'Tense & Aspect', detail: 'Present, past, future, plus perfective vs. imperfective in Russian.' },
              { label: 'Part of speech', detail: 'Verb, noun, adjective, conjunction: labeled at a glance.' },
            ].map(({ label, detail }) => (
              <div key={label} className="bg-paper border border-border rounded-card p-4 shadow-raised">
                <span className="font-sans text-ui-sm font-semibold text-ink block mb-1">{label}</span>
                <span className="font-sans text-ui-sm text-muted leading-relaxed">{detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-24">
        <div className="text-center mb-12">
          <p className="font-sans text-ui-sm text-muted tracking-widest uppercase mb-4">
            How it works
          </p>
          <h2
            className="text-ink"
            style={{
              fontFamily: 'var(--font-eb-garamond)',
              fontSize: 'clamp(26px, 3vw, 40px)',
              lineHeight: 1.2,
            }}
          >
            Import, read, grow.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {STEPS.map(({ n, icon: Icon, title, body }) => (
            <div
              key={n}
              className="bg-paper border border-border rounded-card shadow-raised p-6 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-7 h-7 rounded-full bg-primary/10 text-primary font-sans text-ui-sm font-semibold flex items-center justify-center shrink-0"
                >
                  {n}
                </span>
                <Icon size={18} strokeWidth={1.5} className="text-muted" />
              </div>
              <div>
                <span className="block font-sans text-ui-base font-semibold text-ink mb-1.5">
                  {title}
                </span>
                <span className="block font-sans text-ui-sm text-muted leading-relaxed">{body}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────────────────── */}
      <section className="bg-paper border-y border-border py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2
            className="text-ink mb-4"
            style={{
              fontFamily: 'var(--font-eb-garamond)',
              fontSize: 'clamp(26px, 3vw, 40px)',
              lineHeight: 1.2,
            }}
          >
            Start with any text.
          </h2>
          <p className="font-sans text-ui-md text-muted mb-8">
            Paste an article, a novel excerpt, or a song lyric. Verbista handles the rest.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 font-sans text-ui-base font-medium bg-primary text-white px-6 py-3 rounded hover:bg-primary-dark transition-colors"
          >
            Create a free account
            <ArrowRight size={16} strokeWidth={2} />
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ background: '#183A37' }} className="py-10">
        <div className="max-w-6xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/illustrations/verbista-icon.png"
              alt="Verbista"
              width={24}
              height={24}
              className="rounded-md opacity-90"
            />
            <span
              style={{ fontFamily: 'var(--font-eb-garamond)', color: 'rgba(240,239,234,0.9)', fontSize: '20px' }}
            >
              Verbista
            </span>
          </div>
          <span className="font-sans text-ui-xs" style={{ color: 'rgba(240,239,234,0.4)' }}>
            Grammar-in-context reading · RU · ES · EN · FR
          </span>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="font-sans text-ui-sm transition-colors"
              style={{ color: 'rgba(240,239,234,0.55)' }}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="font-sans text-ui-sm transition-colors"
              style={{ color: 'rgba(240,239,234,0.55)' }}
            >
              Sign up
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
