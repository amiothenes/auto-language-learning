import { Heading, Body, Content, Muted } from '@/components/ui/Typography';

export default function Dashboard() {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <header className="space-y-2">
          <Heading size="2xl" as="h1">
            Dashboard
          </Heading>
          <Muted>
            Track your language learning progress and recent activity
          </Muted>
        </header>

        {/* Stats Overview */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-paper rounded-card border border-border shadow-raised p-6">
            <Muted size="xs" className="mb-2">
              TOTAL WORDS
            </Muted>
            <Heading size="2xl" weight="bold" as="h2" className="mb-1">
              1,234
            </Heading>
            <Body size="sm" className="text-primary">
              +47 this week
            </Body>
          </div>

          <div className="bg-paper rounded-card border border-border shadow-raised p-6">
            <Muted size="xs" className="mb-2">
              KNOWN WORDS
            </Muted>
            <Heading size="2xl" weight="bold" as="h2" className="mb-1">
              823
            </Heading>
            <Body size="sm" className="text-primary">
              66.7% mastery
            </Body>
          </div>

          <div className="bg-paper rounded-card border border-border shadow-raised p-6">
            <Muted size="xs" className="mb-2">
              TEXTS READ
            </Muted>
            <Heading size="2xl" weight="bold" as="h2" className="mb-1">
              24
            </Heading>
            <Body size="sm" className="text-primary">
              3 this week
            </Body>
          </div>
        </section>

        {/* Progress Section */}
        <section className="bg-paper rounded-card border border-border shadow-raised p-6 space-y-4">
          <div>
            <Heading size="xl" as="h2" className="mb-2">
              Learning Progress
            </Heading>
            <Muted>
              Your vocabulary growth over time
            </Muted>
          </div>
          <div className="h-48 flex items-center justify-center bg-desk rounded-lg">
            <Muted>Progress chart will be implemented here</Muted>
          </div>
        </section>

        {/* Recent Texts */}
        <section className="bg-paper rounded-card border border-border shadow-raised p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Heading size="xl" as="h2" className="mb-2">
                Recent Texts
              </Heading>
              <Muted>
                Continue reading where you left off
              </Muted>
            </div>
            <button className="px-4 py-2 bg-primary text-white font-sans font-medium text-ui-base rounded hover:opacity-90 active:translate-y-px transition-all">
              Add New Text
            </button>
          </div>

          {/* Sample Text Items */}
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between p-4 bg-desk rounded-lg hover:bg-border transition-colors cursor-pointer"
              >
                <div className="flex-1">
                  <Content size="lg" weight="semibold" className="mb-1">
                    El gato en la casa
                  </Content>
                  <div className="flex items-center gap-4">
                    <Muted size="xs">Spanish Short Stories</Muted>
                    <Muted size="xs">•</Muted>
                    <Muted size="xs">234 words</Muted>
                    <Muted size="xs">•</Muted>
                    <Muted size="xs">72% known</Muted>
                  </div>
                </div>
                <div className="text-right">
                  <Muted size="xs">Last read</Muted>
                  <Body size="sm" weight="medium">
                    2 hours ago
                  </Body>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border text-center">
            <button className="text-primary font-sans font-medium text-ui-base hover:underline">
              View All Texts →
            </button>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-paper border border-border rounded-card shadow-raised p-6 hover:shadow-raised-hover transition-shadow text-left">
            <div className="text-3xl mb-3">📚</div>
            <Heading size="lg" as="h3" className="mb-2">
              Browse Series
            </Heading>
            <Muted size="sm">
              Explore organized text collections
            </Muted>
          </button>

          <button className="bg-paper border border-border rounded-card shadow-raised p-6 hover:shadow-raised-hover transition-shadow text-left">
            <div className="text-3xl mb-3">📝</div>
            <Heading size="lg" as="h3" className="mb-2">
              Vocabulary List
            </Heading>
            <Muted size="sm">
              Review and practice your words
            </Muted>
          </button>

          <button className="bg-paper border border-border rounded-card shadow-raised p-6 hover:shadow-raised-hover transition-shadow text-left">
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
  );
}
