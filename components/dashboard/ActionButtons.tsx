'use client';

import { useRouter } from 'next/navigation';
import { Heading, Muted } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { Library, ClipboardList, Settings } from 'lucide-react';

interface ActionButtonsProps {
  className?: string;
}

export function ActionButtons({ className }: ActionButtonsProps) {
  const router = useRouter();

  return (
    <section className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className || ''}`}>
      <Card 
        variant="interactive" 
        padding="md" 
        as="button" 
        className="text-left"
        onClick={() => router.push('/series')}
      >
        <div className="mb-3">
          <Library size={32} className="text-primary" strokeWidth={1.5} />
        </div>
        <Heading size="lg" as="h3" className="mb-2">
          Browse Series
        </Heading>
        <Muted size="sm">
          Explore organized text collections
        </Muted>
      </Card>

      <Card 
        variant="interactive" 
        padding="md" 
        as="button" 
        className="text-left"
        onClick={() => router.push('/vocabulary')}
      >
        <div className="mb-3">
          <ClipboardList size={32} className="text-primary" strokeWidth={1.5} />
        </div>
        <Heading size="lg" as="h3" className="mb-2">
          Vocabulary List
        </Heading>
        <Muted size="sm">
          Review and practice your words
        </Muted>
      </Card>

      <Card 
        variant="interactive" 
        padding="md" 
        as="button" 
        className="text-left"
        onClick={() => router.push('/settings')}
      >
        <div className="mb-3">
          <Settings size={32} className="text-primary" strokeWidth={1.5} />
        </div>
        <Heading size="lg" as="h3" className="mb-2">
          Settings
        </Heading>
        <Muted size="sm">
          Customize your learning experience
        </Muted>
      </Card>
    </section>
  );
}
