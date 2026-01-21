'use client';

import { Heading, Muted } from '@/components/ui/Typography';
import { TextListItem } from './TextListItem';

const recentTexts = [
  {
    id: '1',
    title: 'El gato en la casa',
    series: 'Spanish Short Stories',
    wordCount: 234,
    knownPercentage: 72,
    lastViewed: '2 hours ago',
  },
  {
    id: '2',
    title: 'El gato en la casa',
    series: 'Spanish Short Stories',
    wordCount: 234,
    knownPercentage: 72,
    lastViewed: '2 hours ago',
  },
  {
    id: '3',
    title: 'El gato en la casa',
    series: 'Spanish Short Stories',
    wordCount: 234,
    knownPercentage: 72,
    lastViewed: '2 hours ago',
  },
];

export function RecentTextsList() {
  return (
    <section className="bg-paper rounded-card border border-border shadow-raised p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Heading size="lg" as="h2" className="mb-1 md:mb-2 md:text-ui-xl">
            Recent Texts
          </Heading>
          <Muted size="xs" className="hidden md:block md:text-ui-sm">
            Continue reading where you left off
          </Muted>
        </div>
        <button className="px-3 md:px-4 py-2 bg-primary text-white font-sans font-medium text-ui-base rounded hover:opacity-90 active:translate-y-px transition-all shrink-0 cursor-pointer">
          <span className="hidden md:inline">Add New Text</span>
          <span className="md:hidden text-lg">➕</span>
        </button>
      </div>

      {/* Sample Text Items */}
      <div className="space-y-2 md:space-y-3">
        {recentTexts.map((text) => (
          <TextListItem
            key={text.id}
            title={text.title}
            series={text.series}
            wordCount={text.wordCount}
            knownPercentage={text.knownPercentage}
            lastViewed={text.lastViewed}
            onClick={() => {}}
          />
        ))}
      </div>

      <div className="pt-4 border-t border-border text-center">
        <button className="text-primary font-sans font-medium text-ui-base hover:underline cursor-pointer">
          View All Texts →
        </button>
      </div>
    </section>
  );
}
