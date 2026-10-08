'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, BookOpen } from 'lucide-react';
import { Heading, Muted, Content } from '@/components/ui/Typography';
import { EmptyState } from '@/components/ui/EmptyState';
import { VocabularyStatus } from '@/lib/types';
import { useVocabularyContexts } from '@/lib/hooks/useVocabularyContexts';
import type { VocabularyContextItem } from '@/lib/types/api';

const STATUS_LABELS: Record<VocabularyStatus, string> = {
  [VocabularyStatus.UNKNOWN]: 'Unknown',
  [VocabularyStatus.NEWLY_SEEN]: 'Newly Seen',
  [VocabularyStatus.FAMILIAR]: 'Familiar',
  [VocabularyStatus.KNOWN]: 'Known',
  [VocabularyStatus.WELL_KNOWN]: 'Well Known',
  [VocabularyStatus.IGNORE]: 'Ignored',
};

// Bolds every occurrence of `surfaceForm` within `content` (case-insensitive,
// since surface forms carry their own capitalization from the sentence).
function HighlightedSentence({ content, surfaceForm }: { content: string; surfaceForm: string }) {
  if (!surfaceForm) return <>{content}</>;
  const parts = content.split(new RegExp(`(${surfaceForm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === surfaceForm.toLowerCase() ? (
          <strong key={i} className="font-semibold text-ink">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function groupByText(contexts: VocabularyContextItem[]) {
  const groups = new Map<string, { title: string; seriesName: string; items: VocabularyContextItem[] }>();
  for (const ctx of contexts) {
    const existing = groups.get(ctx.text.id);
    if (existing) {
      existing.items.push(ctx);
    } else {
      groups.set(ctx.text.id, { title: ctx.text.title, seriesName: ctx.text.series.name, items: [ctx] });
    }
  }
  return Array.from(groups.entries()).map(([textId, group]) => ({ textId, ...group }));
}

interface VocabularyContextsPageProps {
  params: Promise<{ id: string }>;
}

export default function VocabularyContextsPage({ params }: VocabularyContextsPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, isError } = useVocabularyContexts(id);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => router.push('/vocabulary')}
          className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors cursor-pointer font-sans text-ui-sm"
        >
          <ChevronLeft size={16} strokeWidth={2} />
          Back to Vocabulary
        </button>

        {isLoading && <Muted>Loading contexts…</Muted>}

        {isError && (
          <EmptyState
            illustration="none"
            title="Couldn't load this word"
            description="Something went wrong fetching its contexts. Try again from the Vocabulary page."
          />
        )}

        {data && (
          <>
            <header className="space-y-2 border-b border-border pb-6">
              <Heading size="2xl" as="h1">
                {data.word.lemma}
              </Heading>
              <div className="flex items-center gap-3 flex-wrap">
                <Muted size="sm">{STATUS_LABELS[data.word.status]}</Muted>
                {data.word.translation && (
                  <>
                    <Muted size="sm">·</Muted>
                    <Muted size="sm">{data.word.translation}</Muted>
                  </>
                )}
                <Muted size="sm">·</Muted>
                <Muted size="sm">
                  {data.contexts.length} occurrence{data.contexts.length !== 1 ? 's' : ''}
                </Muted>
              </div>
            </header>

            {data.contexts.length === 0 ? (
              <EmptyState
                illustration="none"
                title="No contexts found"
                description="This word doesn't appear in any of your texts yet."
              />
            ) : (
              <div className="space-y-8">
                {groupByText(data.contexts).map((group) => (
                  <section key={group.textId} className="space-y-3">
                    <div className="flex items-baseline justify-between gap-4">
                      <div>
                        <Heading size="sm" as="h2">
                          {group.title}
                        </Heading>
                        <Muted size="xs">{group.seriesName}</Muted>
                      </div>
                      <Link
                        href={`/reader/${group.textId}`}
                        className="inline-flex items-center gap-1 font-sans text-ui-sm font-semibold text-primary hover:underline cursor-pointer whitespace-nowrap"
                      >
                        <BookOpen size={14} strokeWidth={2} />
                        Open in Reader
                      </Link>
                    </div>
                    <ul className="space-y-3">
                      {group.items.map((ctx) => (
                        <li key={ctx.id} className="pl-4 border-l-2 border-border">
                          {ctx.sentence ? (
                            <Content size="base" className="leading-relaxed">
                              <HighlightedSentence content={ctx.sentence.content} surfaceForm={ctx.surfaceForm} />
                            </Content>
                          ) : (
                            <Muted size="sm">(sentence unavailable)</Muted>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
