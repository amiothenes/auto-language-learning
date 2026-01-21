'use client';

import { Heading, Muted } from '@/components/ui/Typography';

interface ActionButtonsProps {
  className?: string;
}

export function ActionButtons({ className }: ActionButtonsProps) {
  return (
    <section className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className || ''}`}>
      <button className="bg-paper border border-border rounded-card shadow-raised p-6 hover:shadow-raised-hover hover:bg-desk transition-all text-left cursor-pointer active:translate-y-px">
        <div className="text-3xl mb-3">📚</div>
        <Heading size="lg" as="h3" className="mb-2">
          Browse Series
        </Heading>
        <Muted size="sm">
          Explore organized text collections
        </Muted>
      </button>

      <button className="bg-paper border border-border rounded-card shadow-raised p-6 hover:shadow-raised-hover hover:bg-desk transition-all text-left cursor-pointer active:translate-y-px">
        <div className="text-3xl mb-3">📝</div>
        <Heading size="lg" as="h3" className="mb-2">
          Vocabulary List
        </Heading>
        <Muted size="sm">
          Review and practice your words
        </Muted>
      </button>

      <button className="bg-paper border border-border rounded-card shadow-raised p-6 hover:shadow-raised-hover hover:bg-desk transition-all text-left cursor-pointer active:translate-y-px">
        <div className="text-3xl mb-3">⚙️</div>
        <Heading size="lg" as="h3" className="mb-2">
          Settings
        </Heading>
        <Muted size="sm">
          Customize your learning experience
        </Muted>
      </button>
    </section>
  );
}
