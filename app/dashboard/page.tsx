'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Share2, Check } from 'lucide-react';
import { Heading, Muted } from '@/components/ui/Typography';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentTextsList } from '@/components/dashboard/RecentTextsList';
import { ActionButtons } from '@/components/dashboard/ActionButtons';
import { EmptyState } from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/client';

// ─── Share button ─────────────────────────────────────────────────────────────
// Generates a public /share/[userId]?lang=xx URL and copies it to clipboard.
function ShareProgressButton({ languageCode }: { languageCode: string }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleShare() {
    if (busy) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId) return;
      const url = `${window.location.origin}/share/${userId}?lang=${languageCode}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={busy}
      className="inline-flex items-center gap-1.5 font-sans text-ui-sm text-muted hover:text-ink border border-border bg-paper rounded px-3 py-1.5 transition-colors hover:border-border disabled:opacity-50"
    >
      {copied ? (
        <>
          <Check size={13} strokeWidth={2.5} className="text-primary" />
          Link copied
        </>
      ) : (
        <>
          <Share2 size={13} strokeWidth={2} />
          Share progress
        </>
      )}
    </button>
  );
}

// ─── Dashboard page ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  const { currentLanguage } = useLanguage();

  if (!currentLanguage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <EmptyState
          illustration="compass"
          title="Choose your first language"
          description="Head to Settings to add a language and start tracking your vocabulary."
          primaryAction={{
            label: 'Open Settings',
            onClick: () => router.push('/settings/languages'),
            icon: <Settings size={18} strokeWidth={2} />,
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Page Header */}
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Heading size="2xl" as="h1">
              {currentLanguage.name}
            </Heading>
            <Muted>
              Track your language learning progress and recent activity
            </Muted>
          </div>
          <div className="pt-1 shrink-0">
            <ShareProgressButton languageCode={currentLanguage.code} />
          </div>
        </header>

        {/* Two Column Layout: Left (Chart + Stats) | Right (Recent Texts) */}
        <div className="flex flex-col xl:grid xl:grid-cols-[35%_1fr] gap-6">
          {/* LEFT COLUMN: Chart + Stats — first on mobile, left on desktop */}
          <div className="space-y-6">
            <StatsCard />
          </div>

          {/* RIGHT COLUMN: Recent Texts — second on mobile, right on desktop */}
          <div className="space-y-6">
            <RecentTextsList />
            <div className="hidden xl:block">
              <ActionButtons />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
