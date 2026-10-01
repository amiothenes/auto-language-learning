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
import { useUpdateReviewCard } from '@/lib/hooks/useUpdateReviewCard';
import { loadReviewSession, saveReviewSession } from '@/lib/review/sessionCache';
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
import type { TranslationMeaning } from '@/lib/db/schema/wordTranslations';

const INSIGHTS_STORAGE_KEY = 'verbista_review_insights_open';
// How many cards later a missed card reappears in the queue (Anki's "Again" spacing, simplified).
const REQUEUE_OFFSET = 3;

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
  const editCardMutation = useUpdateReviewCard();

  // sessionCards is an immutable snapshot of the session as fetched at start
  // (drives the progress bar's segment colors); queue is the working copy —
  // "Knew" drops a card for good, "Didn't Know" requeues it a few cards later
  // (see handleGrade), so it can repeat a word within the session. Neither is
  // a live view of the query: grading invalidates due-count/vocabulary but
  // deliberately not the session query, so re-fetches elsewhere (e.g. window
  // refocus) can't reshuffle an in-progress play-through. Seeded once per
  // languageId when data first arrives (from localStorage if a session for
  // today was already in progress, see lib/review/sessionCache), and mirrored
  // back to localStorage as it changes so navigating away and back restores it.
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
    if (session && languageId && seededForLanguage.current !== languageId) {
      const stored = loadReviewSession(languageId);
      if (stored) {
        setSessionCards(stored.sessionCards);
        setQueue(stored.queue);
      } else {
        setSessionCards(session.cards);
        setQueue(session.cards);
      }
      setRevealed(false);
      seededForLanguage.current = languageId;
    }
  }, [session, languageId]);

  // Mirrors sessionCards/queue into localStorage so navigating away from
  // /review and back (or closing the tab) restores in-progress state instead
  // of reseeding from scratch. Guarded on seededForLanguage so this never
  // fires before the effect above has actually seeded this language.
  useEffect(() => {
    if (!languageId || seededForLanguage.current !== languageId || sessionCards.length === 0) return;
    saveReviewSession(languageId, { sessionCards, queue });
  }, [languageId, sessionCards, queue]);

  const currentCard = queue[0];
  const nextCard = queue[1];
  const totalCards = sessionCards.length;
  const dueCount = sessionCards.filter((c) => !c.isNew).length;
  const newCount = sessionCards.filter((c) => c.isNew).length;
  // A card can now reappear in `queue` after a miss (see handleGrade), so
  // "remaining" is the count of distinct words still owed, not raw queue length.
  const uniqueRemaining = new Set(queue.map((c) => c.wordId)).size;
  const completedCount = totalCards - uniqueRemaining;

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
          onSuccess: (data) => {
            // Anki-style "again": a miss doesn't leave the session, it comes
            // back a few cards later so it gets re-drilled today instead of
            // just being rescheduled for tomorrow. Patched with the server's
            // freshly-computed status/preview so captions never go stale.
            setQueue((q) => {
              const rest = q.slice(1);
              if (grade === 'KNEW') return rest;
              const updated: SrsCard = { ...currentCard, status: data.status, isNew: false, preview: data.preview };
              const insertAt = Math.min(rest.length, REQUEUE_OFFSET);
              return [...rest.slice(0, insertAt), updated, ...rest.slice(insertAt)];
            });
            setRevealed(false);
          },
        }
      );
    },
    [currentCard, reviewMutation]
  );

  const handleEditCard = useCallback(
    (wordId: string, data: { translation: string; meanings: TranslationMeaning[] }) => {
      editCardMutation.mutate(
        { wordId, ...data },
        {
          onSuccess: () => {
            // queue/sessionCards are a local snapshot (see comment above), so
            // the edit is applied directly rather than relying on a refetch.
            const patch = (cards: SrsCard[]) =>
              cards.map((c) => (c.wordId === wordId ? { ...c, translation: data.translation, meanings: data.meanings } : c));
            setQueue(patch);
            setSessionCards(patch);
          },
        }
      );
    },
    [editCardMutation]
  );

  // Keyboard shortcuts: Space reveals the answer, then grades as "Did Know";
  // 1/2 grade explicitly once revealed.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!currentCard || reviewMutation.isPending) return;
      // Don't hijack Space/1/2 while the user is typing in the edit form.
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.code === 'Space') {
        // Always consumed, even post-reveal, so Space never falls through to
        // scrolling the page.
        e.preventDefault();
        if (!revealed) {
          setRevealed(true);
        } else {
          handleGrade('KNEW');
        }
        return;
      }
      if (!revealed) return;
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
            <SessionProgressBar cards={sessionCards} completedCount={completedCount} />
            <Muted>
              {uniqueRemaining} of {totalCards} remaining · {dueCount} due · {newCount} new
            </Muted>
          </>
        )}
        <button
          type="button"
          onClick={toggleInsights}
          aria-expanded={insightsOpen}
          className="inline-flex items-center gap-1 font-sans text-ui-xs text-muted hover:text-ink transition-colors cursor-pointer"
        >
          {insightsOpen ? <ChevronDown size={12} strokeWidth={2} /> : <ChevronRight size={12} strokeWidth={2} />}
          Insights
        </button>
      </header>

      {insightsOpen && (forecastBuckets || activityBuckets) && (
        <div className="space-y-4">
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
          onEdit={handleEditCard}
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
