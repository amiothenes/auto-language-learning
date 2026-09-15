'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, PartyPopper } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useReaderSettings } from '@/lib/contexts/ReaderSettingsContext';
import { useActiveVoice } from '@/lib/hooks/useActiveVoice';
import { useSrsSession } from '@/lib/hooks/useSrsSession';
import { useSrsReview } from '@/lib/hooks/useSrsReview';
import { useSrsSettings } from '@/lib/hooks/useSrsSettings';
import { useSrsForecast } from '@/lib/hooks/useSrsForecast';
import { useSrsActivity } from '@/lib/hooks/useSrsActivity';
import { prefetchWordAudio } from '@/lib/tts/wordAudioCache';
import { prefetchSentenceAudio } from '@/lib/tts/sentenceAudioCache';
import { FlashcardView } from '@/components/review/FlashcardView';
import { FlashcardSkeleton } from '@/components/review/FlashcardSkeleton';
import { SessionProgressBar } from '@/components/review/SessionProgressBar';
import { ForecastChart } from '@/components/review/ForecastChart';
import { ActivityChart } from '@/components/review/ActivityChart';
import { Card } from '@/components/ui/Card';
import { SkeletonText } from '@/components/ui/Skeleton';
import { Heading, Muted } from '@/components/ui/Typography';
import type { SrsCard, SrsGrade } from '@/lib/types/api';

const INSIGHTS_STORAGE_KEY = 'verbista_review_insights_open';

export default function ReviewPage() {
  const { currentLanguage } = useLanguage();
  const languageId = currentLanguage?.id;
  const { settings: readerSettings } = useReaderSettings();
  const voiceId = useActiveVoice();

  const { data: session, isLoading } = useSrsSession(languageId);
  const { data: srsSettings } = useSrsSettings(languageId);
  const { data: forecastBuckets } = useSrsForecast(languageId);
  const { data: activityBuckets } = useSrsActivity(languageId);
  const reviewMutation = useSrsReview(languageId);

  // sessionCards is an immutable snapshot of the session as fetched at start
  // (drives the progress bar's segment colors); queue is the shrinking
  // working copy. Neither is a live view of the query: grading invalidates
  // due-count/vocabulary but deliberately not the session query, so
  // re-fetches elsewhere (e.g. window refocus) can't reshuffle an
  // in-progress play-through. Seeded once per languageId when data first
  // arrives; graded cards are then removed from `queue` locally.
  const [sessionCards, setSessionCards] = useState<SrsCard[]>([]);
  const [queue, setQueue] = useState<SrsCard[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const seededForLanguage = useRef<string | undefined>(undefined);

  // Read the remembered open/closed state client-side only, to avoid an
  // SSR/client hydration mismatch (localStorage isn't available on the server).
  useEffect(() => {
    setInsightsOpen(localStorage.getItem(INSIGHTS_STORAGE_KEY) === 'true');
  }, []);

  function toggleInsights() {
    setInsightsOpen((prev) => {
      const next = !prev;
      localStorage.setItem(INSIGHTS_STORAGE_KEY, String(next));
      return next;
    });
  }

  useEffect(() => {
    if (session && seededForLanguage.current !== languageId) {
      setSessionCards(session.cards);
      setQueue(session.cards);
      setRevealed(false);
      seededForLanguage.current = languageId;
    }
  }, [session, languageId]);

  const currentCard = queue[0];
  const nextCard = queue[1];
  const totalCards = sessionCards.length;
  const dueCount = sessionCards.filter((c) => !c.isNew).length;
  const newCount = sessionCards.filter((c) => c.isNew).length;

  // Preload current + next card's audio so playback has no delay once the
  // user reaches them (same "warm ahead of time" approach the Reader uses).
  useEffect(() => {
    if (!srsSettings) return;
    for (const card of [currentCard, nextCard]) {
      if (!card) continue;
      if (srsSettings.wordAudioEnabled) {
        prefetchWordAudio(card.wordId, readerSettings.playbackSpeed, voiceId);
      }
      if (srsSettings.sentenceAudioEnabled && card.sentence) {
        prefetchSentenceAudio(card.sentence.sentenceId, readerSettings.playbackSpeed, voiceId);
      }
    }
  }, [currentCard, nextCard, srsSettings, readerSettings.playbackSpeed, voiceId]);

  const handleGrade = useCallback(
    (grade: SrsGrade) => {
      if (!currentCard) return;
      reviewMutation.mutate(
        { wordId: currentCard.wordId, grade },
        {
          onSuccess: () => {
            setQueue((q) => q.slice(1));
            setRevealed(false);
          },
        }
      );
    },
    [currentCard, reviewMutation]
  );

  // Keyboard shortcuts: Space reveals the answer, 1/2 grade it once revealed.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!currentCard || reviewMutation.isPending) return;
      if (!revealed) {
        if (e.code === 'Space') {
          e.preventDefault();
          setRevealed(true);
        }
        return;
      }
      if (e.key === '1') {
        e.preventDefault();
        handleGrade('DIDNT_KNOW');
      } else if (e.key === '2') {
        e.preventDefault();
        handleGrade('KNEW');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard, revealed, reviewMutation.isPending, handleGrade]);

  if (!languageId || isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 md:py-12 space-y-6">
        <header className="space-y-1">
          <Heading size="2xl" as="h1">Review</Heading>
          <SkeletonText width="w-48" />
        </header>
        <FlashcardSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 md:py-12 space-y-6">
      <header className="space-y-2">
        <Heading size="2xl" as="h1">Review</Heading>
        {totalCards > 0 && (
          <>
            <SessionProgressBar cards={sessionCards} completedCount={totalCards - queue.length} />
            <Muted>
              {queue.length} of {totalCards} remaining · {dueCount} due · {newCount} new
            </Muted>
          </>
        )}
        <button
          type="button"
          onClick={toggleInsights}
          aria-expanded={insightsOpen}
          className="inline-flex items-center gap-1 font-sans text-ui-xs text-muted hover:text-ink transition-colors"
        >
          {insightsOpen ? <ChevronDown size={12} strokeWidth={2} /> : <ChevronRight size={12} strokeWidth={2} />}
          Insights
        </button>
      </header>

      {insightsOpen && (forecastBuckets || activityBuckets) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {forecastBuckets && (
            <Card padding="sm">
              <p className="font-sans text-ui-sm font-medium text-ink mb-2">Upcoming</p>
              <ForecastChart buckets={forecastBuckets} />
            </Card>
          )}
          {activityBuckets && (
            <Card padding="sm">
              <p className="font-sans text-ui-sm font-medium text-ink mb-2">Recent Activity</p>
              <ActivityChart buckets={activityBuckets} />
            </Card>
          )}
        </div>
      )}

      {totalCards === 0 && (
        <Card padding="lg" className="text-center space-y-2">
          <PartyPopper className="mx-auto text-primary" size={32} strokeWidth={1.5} />
          <Heading size="lg" as="h2">All caught up</Heading>
          <Muted>No cards due for {currentLanguage?.name} right now. Check back later.</Muted>
        </Card>
      )}

      {currentCard && (
        <FlashcardView
          key={currentCard.wordId}
          card={currentCard}
          sentenceAudioEnabled={srsSettings?.sentenceAudioEnabled ?? true}
          wordAudioEnabled={srsSettings?.wordAudioEnabled ?? true}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          onGrade={handleGrade}
          grading={reviewMutation.isPending}
        />
      )}

      {!currentCard && totalCards > 0 && (
        <Card padding="lg" className="text-center space-y-2">
          <CheckCircle2 className="mx-auto text-primary" size={32} strokeWidth={1.5} />
          <Heading size="lg" as="h2">Session complete</Heading>
          <Muted>You reviewed all {totalCards} cards for now.</Muted>
        </Card>
      )}
    </div>
  );
}
