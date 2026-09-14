'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, PartyPopper } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useReaderSettings } from '@/lib/contexts/ReaderSettingsContext';
import { useActiveVoice } from '@/lib/hooks/useActiveVoice';
import { useSrsSession } from '@/lib/hooks/useSrsSession';
import { useSrsReview } from '@/lib/hooks/useSrsReview';
import { useSrsSettings } from '@/lib/hooks/useSrsSettings';
import { prefetchWordAudio } from '@/lib/tts/wordAudioCache';
import { prefetchSentenceAudio } from '@/lib/tts/sentenceAudioCache';
import { FlashcardView } from '@/components/review/FlashcardView';
import { Card } from '@/components/ui/Card';
import { Heading, Muted } from '@/components/ui/Typography';
import type { SrsCard, SrsGrade } from '@/lib/types/api';

export default function ReviewPage() {
  const { currentLanguage } = useLanguage();
  const languageId = currentLanguage?.id;
  const { settings: readerSettings } = useReaderSettings();
  const voiceId = useActiveVoice();

  const { data: session, isLoading } = useSrsSession(languageId);
  const { data: srsSettings } = useSrsSettings(languageId);
  const reviewMutation = useSrsReview(languageId);

  // The queue is a local snapshot of the session fetched at start, not a
  // live view of the query: grading invalidates due-count/vocabulary but
  // deliberately not the session query, so re-fetches elsewhere (e.g. window
  // refocus) can't reshuffle an in-progress play-through. Seeded once per
  // languageId when data first arrives; graded cards are then removed
  // locally as the user progresses.
  const [queue, setQueue] = useState<SrsCard[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [sessionTotals, setSessionTotals] = useState({ dueCount: 0, newCount: 0 });
  const seededForLanguage = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (session && seededForLanguage.current !== languageId) {
      setQueue(session.cards);
      setSessionTotals({ dueCount: session.dueCount, newCount: session.newCount });
      setRevealed(false);
      seededForLanguage.current = languageId;
    }
  }, [session, languageId]);

  const currentCard = queue[0];
  const nextCard = queue[1];
  const totalCards = sessionTotals.dueCount + sessionTotals.newCount;

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

  function handleGrade(grade: SrsGrade) {
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
  }

  if (!languageId || isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <Muted>Loading review session…</Muted>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 md:py-12 space-y-6">
      <header className="space-y-1">
        <Heading size="2xl" as="h1">Review</Heading>
        {totalCards > 0 && (
          <Muted>
            {queue.length} of {totalCards} remaining · {sessionTotals.dueCount} due · {sessionTotals.newCount} new
          </Muted>
        )}
      </header>

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
