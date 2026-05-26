import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Heading, Body, Muted } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';

export const metadata = {
  title: 'How Reading Coverage is Calculated — Verbista',
};

const FREQUENCY_BANDS = [
  { words: '1,000', coverage: '~77%', cefr: 'A1–A2' },
  { words: '2,000', coverage: '~84%', cefr: 'A2–B1' },
  { words: '3,000', coverage: '~88%', cefr: 'B1' },
  { words: '5,000', coverage: '~93%', cefr: 'B1–B2' },
  { words: '10,000', coverage: '~97%', cefr: 'C1–C2' },
];

const CEFR_BANDS = [
  { range: 'below 77%', band: 'A1–A2', description: 'Beginner — high-frequency words only' },
  { range: '77–84%', band: 'A2–B1', description: 'Elementary — everyday vocabulary forming' },
  { range: '84–92%', band: 'B1–B2', description: 'Intermediate — comfortable with common topics' },
  { range: '92–96%', band: 'C1', description: 'Advanced — broad vocabulary across domains' },
  { range: '96%+', band: 'C2', description: 'Proficient — near-native lexical breadth' },
];

export default function CoverageInfoPage() {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors font-sans text-ui-sm font-medium"
        >
          <ArrowLeft size={16} strokeWidth={2} />
          Back to Dashboard
        </Link>

        {/* Page Header */}
        <header className="space-y-2">
          <Heading size="2xl" as="h1">Reading Coverage</Heading>
          <Muted>How your language coverage estimate is calculated</Muted>
        </header>

        {/* What is Reading Coverage */}
        <Card variant="default" padding="md" as="section" className="space-y-3">
          <Heading size="lg" as="h2">What does this number mean?</Heading>
          <Body size="sm">
            Reading Coverage estimates what percentage of a typical text in your target language
            you would understand based on the words you currently know. A score of 72% means
            roughly 72 out of every 100 word tokens you encounter are ones you know.
          </Body>
          <Body size="sm">
            Research by Paul Nation (2001) found that comfortable, independent reading requires
            around <strong>95% coverage</strong>, while truly fluent unsupported reading approaches
            <strong> 98%</strong>. These thresholds are marked on your dashboard.
          </Body>
        </Card>

        {/* The Formula */}
        <Card variant="default" padding="md" as="section" className="space-y-4">
          <Heading size="lg" as="h2">The formula</Heading>
          <Body size="sm">
            Each word in a language contributes to text coverage proportionally to how frequently
            it appears. A common word like <em>the</em> or <em>and</em> covers far more of any given
            text than a rare technical term. This relationship follows <strong>Zipf&apos;s Law</strong>:
            a word at frequency rank <em>r</em> appears roughly 1/<em>r</em> times as often as the
            most common word.
          </Body>

          <div className="bg-desk rounded-lg p-4 space-y-2">
            <Muted size="xs" className="uppercase tracking-wide font-medium">Formula</Muted>
            <Body size="sm" className="font-mono">
              rank = 10,000 × (1 − frequency / 100) + 1
            </Body>
            <Body size="sm" className="font-mono">
              weight = 1 / rank
            </Body>
            <Body size="sm" className="font-mono">
              coverage = Σ(weight for known words) / ln(10,000) + 0.5772
            </Body>
          </div>

          <Body size="sm">
            The denominator — the harmonic sum of all 10,000 word families — represents the total
            frequency weight of the entire language. Words you have not yet encountered contribute
            zero to the numerator, which means <strong>reading fewer texts naturally lowers your
            score</strong>, even if you know every word you have seen so far.
          </Body>

          <Body size="sm">
            The value 10,000 is the estimated number of useful word families needed to cover
            approximately 97% of everyday text. Words beyond that point contribute so little
            individually that they do not meaningfully change the estimate.
          </Body>
        </Card>

        {/* Frequency Band Table */}
        <Card variant="default" padding="md" as="section" className="space-y-4">
          <Heading size="lg" as="h2">Word count → coverage</Heading>
          <Body size="sm">
            The table below shows how many of the most frequent word families you would need to
            know to reach each coverage level. These figures are from Nation&apos;s empirical
            research on English and apply broadly to other major languages.
          </Body>

          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-desk border-b border-border">
                  <th className="px-4 py-2.5 font-sans font-medium text-ui-xs text-muted uppercase tracking-wide">
                    Top word families known
                  </th>
                  <th className="px-4 py-2.5 font-sans font-medium text-ui-xs text-muted uppercase tracking-wide">
                    Est. text coverage
                  </th>
                  <th className="px-4 py-2.5 font-sans font-medium text-ui-xs text-muted uppercase tracking-wide">
                    Approx. CEFR
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {FREQUENCY_BANDS.map((row) => (
                  <tr key={row.words} className="hover:bg-desk/50 transition-colors">
                    <td className="px-4 py-3 font-sans text-ui-sm text-ink">{row.words}</td>
                    <td className="px-4 py-3 font-sans text-ui-sm text-primary font-medium">{row.coverage}</td>
                    <td className="px-4 py-3 font-sans text-ui-sm text-muted">{row.cefr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* CEFR Mapping */}
        <Card variant="default" padding="md" as="section" className="space-y-4">
          <div className="space-y-1">
            <Heading size="lg" as="h2">CEFR band mapping</Heading>
            <Muted size="xs">Approximate — CEFR assesses skills beyond vocabulary alone</Muted>
          </div>
          <Body size="sm">
            The CEFR (Common European Framework of Reference) defines language proficiency across
            listening, reading, speaking, and writing. The bands below are derived from the
            correlation between vocabulary size and CEFR level in the research literature. They
            are a useful orientation, not a certified assessment.
          </Body>

          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-desk border-b border-border">
                  <th className="px-4 py-2.5 font-sans font-medium text-ui-xs text-muted uppercase tracking-wide">
                    Coverage range
                  </th>
                  <th className="px-4 py-2.5 font-sans font-medium text-ui-xs text-muted uppercase tracking-wide">
                    Band
                  </th>
                  <th className="px-4 py-2.5 font-sans font-medium text-ui-xs text-muted uppercase tracking-wide hidden sm:table-cell">
                    Meaning
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {CEFR_BANDS.map((row) => (
                  <tr key={row.band} className="hover:bg-desk/50 transition-colors">
                    <td className="px-4 py-3 font-sans text-ui-sm text-muted">{row.range}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-primary/10 text-primary font-sans font-medium text-ui-xs">
                        {row.band}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans text-ui-sm text-muted hidden sm:table-cell">
                      {row.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Per-text percentage */}
        <Card variant="default" padding="md" as="section" className="space-y-3">
          <Heading size="lg" as="h2">What does "X% known" mean on a text?</Heading>
          <Body size="sm">
            Each text card shows a simpler metric: the percentage of unique word forms in that
            specific text that you have marked as <strong>Known</strong> or <strong>Well-Known</strong>,
            out of every word in the text — including words you have not reviewed yet.
          </Body>
          <Body size="sm">
            This answers a direct question: <em>"Of the words in this text, how many do I actually know?"</em>
            It is not frequency-weighted and does not account for the rest of the language —
            it is a quick indicator of how readable that particular text is for you right now.
          </Body>
        </Card>

        {/* Source note */}
        <Muted size="xs" className="text-center pb-4">
          Formula based on Zipf&apos;s Law and Paul Nation,{' '}
          <em>Learning Vocabulary in Another Language</em> (2001).
        </Muted>

      </div>
    </div>
  );
}
