'use client';

import { Heading, Body, Content, Muted } from '@/components/ui/Typography';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { ProgressGraph } from '@/components/dashboard/ProgressGraph';

export default function Dashboard() {
  const { currentLanguage } = useLanguage();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <header className="space-y-2">
          <Heading size="2xl" as="h1">
            {currentLanguage?.name || 'Dashboard'}
          </Heading>
          <Muted>
            Track your language learning progress and recent activity
          </Muted>
        </header>

        {/* Two Column Layout: Left (Chart + Stats) | Right (Recent Texts) */}
        <div className="flex flex-col lg:grid lg:grid-cols-[35%_65%] gap-6">
          {/* LEFT COLUMN: Chart + Stats - Order 3 on mobile, 1 on desktop */}
          <div className="space-y-6 order-3 lg:order-1">
            {/* Progress Chart */}
            <section className="bg-paper rounded-card border border-border shadow-raised p-6 space-y-4">
              <div>
                <Heading size="lg" as="h2" className="mb-1">
                  Progress
                </Heading>
                <Muted size="xs">
                  Your vocabulary growth over time
                </Muted>
              </div>
              <ProgressGraph />
            </section>

            {/* Stats Cards - Refined & Elegant */}
            <div className="bg-paper rounded-card border border-border shadow-raised divide-y divide-border lg:divide-y-0 lg:space-y-0">
              {/* Total Words */}
              <div className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-lg">📖</span>
                </div>
                <div className="flex-1 min-w-0">
                  <Muted size="xs" className="mb-0.5">
                    Total Words
                  </Muted>
                  <div className="flex items-baseline gap-2">
                    <Heading size="xl" weight="bold" as="h3">
                      1,234
                    </Heading>
                    <Body size="xs" className="text-primary">
                      +47
                    </Body>
                  </div>
                </div>
              </div>

              {/* Known Words */}
              <div className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-lg">✓</span>
                </div>
                <div className="flex-1 min-w-0">
                  <Muted size="xs" className="mb-0.5">
                    Known Words
                  </Muted>
                  <div className="flex items-baseline gap-2">
                    <Heading size="xl" weight="bold" as="h3">
                      823
                    </Heading>
                    <Body size="xs" className="text-primary">
                      66.7%
                    </Body>
                  </div>
                </div>
              </div>

              {/* Texts Read */}
              <div className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-lg">📚</span>
                </div>
                <div className="flex-1 min-w-0">
                  <Muted size="xs" className="mb-0.5">
                    Texts Read
                  </Muted>
                  <div className="flex items-baseline gap-2">
                    <Heading size="xl" weight="bold" as="h3">
                      24
                    </Heading>
                    <Body size="xs" className="text-primary">
                      +3
                    </Body>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Recent Texts - Order 1 on mobile, 2 on desktop */}
          <div className="space-y-6 order-1 lg:order-2">
            {/* Recent Texts Section */}
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
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-4 bg-desk rounded-lg hover:bg-border transition-colors cursor-pointer gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <Content size="base" weight="semibold" className="mb-1 md:text-content-lg">
                        El gato en la casa
                      </Content>
                      <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                        <Muted size="xs">Spanish Short Stories</Muted>
                        <Muted size="xs" className="hidden md:inline">•</Muted>
                        <Muted size="xs">234 words</Muted>
                        <Muted size="xs" className="hidden md:inline">•</Muted>
                        <Muted size="xs">72% known</Muted>
                      </div>
                    </div>
                    <div className="text-left md:text-right shrink-0">
                      <Muted size="xs">Last read</Muted>
                      <Body size="sm" weight="medium">
                        2 hours ago
                      </Body>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border text-center">
                <button className="text-primary font-sans font-medium text-ui-base hover:underline cursor-pointer">
                  View All Texts →
                </button>
              </div>
            </section>

            {/* Quick Actions - Order 2 on mobile */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 order-2 lg:order-3">
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
          </div>
        </div>
      </div>
    </div>
  );
}
