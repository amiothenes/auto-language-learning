'use client';

import { use, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { X, ChevronLeft, Info, Settings } from 'lucide-react';
import { TextInfo } from '@/components/reader/TextInfo';
import { ReaderContent } from '@/components/reader/ReaderContent';
import { WordDetailsPanel } from '@/components/reader/WordDetailsPanel';
import { WordTooltip } from '@/components/reader/WordTooltip';
import { TextInfoSkeleton, ReaderContentSkeleton, WordDetailsPanelSkeleton } from '@/components/reader/ReaderSkeleton';
import { VocabularyStatus } from '@/lib/types';
import type { WordData, TextData } from '@/lib/types';
import type { WordInstanceItem } from '@/lib/types/api';
import { useQueryClient } from '@tanstack/react-query';
import { StatusUpdateFeedback } from '@/components/reader/StatusUpdateFeedback';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import Link from 'next/link';
import { useText } from '@/lib/hooks/useText';
import { useWordInstances } from '@/lib/hooks/useWordInstances';
import { useUpdateWordStatus } from '@/lib/hooks/useUpdateWordStatus';
import { useAdjacentTexts } from '@/lib/hooks/useAdjacentTexts';
import { ParagraphScrubber } from '@/components/reader/ParagraphScrubber';
import { ReaderSettingsPanel } from '@/components/reader/ReaderSettingsPanel';
import { useReaderSettings } from '@/lib/contexts/ReaderSettingsContext';
import { useReaderKeyboard } from '@/lib/hooks/useReaderKeyboard';

const isDemo = !process.env.NEXT_PUBLIC_ADMIN_API_KEY;

// ============================================================================
// Reader Page Component
// ============================================================================

interface ReaderPageProps {
  params: Promise<{ id: string }>;
}

export default function ReaderPage({ params }: ReaderPageProps) {
  const { id } = use(params);
  const router = useRouter();

  // ── Data queries ──────────────────────────────────────────────────────────
  const queryClient = useQueryClient();
  const [adjacentSort, setAdjacentSort] = useState<string>(() => {
    const cachedText = queryClient.getQueryData<TextData>(['text', id]);
    if (cachedText?.seriesId) {
      const saved = localStorage.getItem(`series-sort-${cachedText.seriesId}`);
      const valid = ['title-asc', 'progress-desc', 'progress-asc', 'recent'];
      if (saved && valid.includes(saved)) return saved;
    }
    return 'title-asc';
  });
  const textQuery = useText(id);
  const instancesQuery = useWordInstances(id);
  const updateWordStatus = useUpdateWordStatus(id);
  const adjacentQuery = useAdjacentTexts(id, adjacentSort);

  useEffect(() => {
    if (isDemo) return;
    fetch(`/api/texts/${id}/view`, {
      method: 'POST',
      headers: { 'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? '' },
    })
      .then((res) => res.json())
      .then((data: { viewCount: number }) => {
        queryClient.setQueryData(['text', id], (old: TextData | undefined) =>
          old ? { ...old, viewCount: data.viewCount } : old
        );
        queryClient.invalidateQueries({ queryKey: ['texts'] });
      })
      .catch(() => {});
  }, [id, queryClient]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<WordData | null>(null);
  const [isTextInfoOpen, setIsTextInfoOpen] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<HTMLButtonElement | null>(null);

  const { settings, toggleImmersionMode } = useReaderSettings();

  const [vocabularyStats, setVocabularyStats] = useState({
    totalWords: 0,
    knownWords: 0,
    textKnownPercentage: 0,
  });
  const statsInitialized = useRef(false);

  const [feedbackState, setFeedbackState] = useState<{
    isVisible: boolean;
    message: string;
    oldStats: { knownWords: number; textProgress: number };
    newStats: { knownWords: number; textProgress: number };
    isMilestone: boolean;
  } | null>(null);

  const isDesktop = useMediaQuery('(min-width: 1280px)');
  const shouldShowTooltip = useMediaQuery('(min-width: 768px)');

  const [tooltipWord, setTooltipWord] = useState<WordData | null>(null);
  const [tooltipAnchorRect, setTooltipAnchorRect] = useState<DOMRect | null>(null);
  const [isTooltipExiting, setIsTooltipExiting] = useState(false);

  const [showMobileHeader, setShowMobileHeader] = useState(true);
  const lastScrollY = useRef(0);

  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const paragraphRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);

  // ── Derived data ──────────────────────────────────────────────────────────
  const textData = textQuery.data;
  const wordInstances = instancesQuery.data;

  const paragraphs = useMemo(
    () => textData?.content.split('\n\n').filter((p) => p.trim()) ?? [],
    [textData]
  );

  // Per-paragraph known% for the mini-map
  const paragraphProgress = useMemo(() => {
    if (!wordInstances || !textData) return [];
    const content = textData.content;
    const rawParagraphs = content.split('\n\n');
    let charOffset = 0;
    const paraStarts: number[] = [];

    for (let i = 0; i < rawParagraphs.length; i++) {
      const para = rawParagraphs[i];
      if (para.trim()) paraStarts.push(charOffset);
      charOffset += para.length + (i < rawParagraphs.length - 1 ? 2 : 0);
    }

    return paragraphs.map((para, index) => {
      const start = paraStarts[index] ?? 0;
      const end = start + para.length;
      const paraInstances = wordInstances.filter(
        (inst) => inst.position >= start && inst.position < end
      );
      if (paraInstances.length === 0) return { id: `p${index + 1}`, progress: 0 };
      const knownCount = paraInstances.filter(
        (inst) =>
          inst.status === VocabularyStatus.KNOWN ||
          inst.status === VocabularyStatus.WELL_KNOWN
      ).length;
      return {
        id: `p${index + 1}`,
        progress: Math.round((knownCount / paraInstances.length) * 100),
      };
    });
  }, [wordInstances, textData, paragraphs]);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (textData?.seriesId) {
      const saved = localStorage.getItem(`series-sort-${textData.seriesId}`);
      const valid = ['title-asc', 'progress-desc', 'progress-asc', 'recent'];
      if (saved && valid.includes(saved)) setAdjacentSort(saved);
    }
  }, [textData?.seriesId, id]);

  useEffect(() => {
    if (textData?.title) {
      document.title = `Verbista — ${textData.title}`;
      return () => { document.title = 'Verbista'; };
    }
  }, [textData?.title]);

  // Initialize vocabulary stats once when text data first loads
  useEffect(() => {
    if (textData && !statsInitialized.current) {
      statsInitialized.current = true;
      setVocabularyStats({
        totalWords: textData.uniqueWordCount,
        knownWords: Math.round(textData.uniqueWordCount * (textData.knownPercentage / 100)),
        textKnownPercentage: textData.knownPercentage,
      });
    }
  }, [textData]);

  // Track current paragraph with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = paragraphRefs.current.indexOf(
              entry.target as HTMLParagraphElement
            );
            if (index !== -1) setCurrentParagraphIndex(index);
          }
        });
      },
      { threshold: 0.5, rootMargin: '-20% 0px -20% 0px' }
    );

    paragraphRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [paragraphs.length]);

  // Auto-hide mobile header on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 10) {
        setShowMobileHeader(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setShowMobileHeader(false);
      } else if (currentScrollY < lastScrollY.current) {
        setShowMobileHeader(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Swipe-back gesture (mobile)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
      touchEndY.current = e.touches[0].clientY;
    };
    const handleTouchEnd = () => {
      const deltaX = touchEndX.current - touchStartX.current;
      const deltaY = touchEndY.current - touchStartY.current;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 100 && touchStartX.current < 50) {
          router.push(`/series/${textData?.seriesId ?? ''}`);
        }
      }
    };

    if (window.innerWidth < 768) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [router, textData?.seriesId]);

  // ── Post-hooks: loading / error gates ────────────────────────────────────
  const isLoading = textQuery.isLoading || instancesQuery.isLoading;

  if (textQuery.isError) notFound();

  // ── Helpers ───────────────────────────────────────────────────────────────
  const checkMilestone = (knownWords: number): boolean =>
    [100, 250, 500, 1000, 2000, 5000].includes(knownWords);

  const isKnownStatus = (status: VocabularyStatus): boolean =>
    status === VocabularyStatus.KNOWN || status === VocabularyStatus.WELL_KNOWN;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleWordClick = (wordData: WordData, anchorRect: DOMRect) => {
    setSelectedWord(wordData);

    if (shouldShowTooltip) {
      if (tooltipWord?.id === wordData.id && !isTooltipExiting) {
        handleTooltipClose();
        return;
      }
      setIsTooltipExiting(false);
      setTooltipWord(wordData);
      setTooltipAnchorRect(anchorRect);
    } else {
      setIsRightPanelOpen(true);
    }
  };

  const handleCloseWordDetails = () => {
    setIsRightPanelOpen(false);
    setTimeout(() => setSelectedWord(null), 300);
  };

  const handleTooltipClose = useCallback(() => {
    setIsTooltipExiting(true);
    setTimeout(() => {
      setTooltipWord(null);
      setTooltipAnchorRect(null);
      setIsTooltipExiting(false);
      setSelectedWord(null);
    }, 120);
  }, []);

  const handleStatusChange = (wordId: string, newStatus: VocabularyStatus) => {
    if (isDemo || !selectedWord) return;

    const oldStatus = selectedWord.status;
    const wasKnown = isKnownStatus(oldStatus);
    const isNowKnown = isKnownStatus(newStatus);

    let knownWordsDelta = 0;
    if (!wasKnown && isNowKnown) knownWordsDelta = 1;
    else if (wasKnown && !isNowKnown) knownWordsDelta = -1;

    // Capture pre-update values for rollback
    const prevStats = { ...vocabularyStats };
    const prevWord = { ...selectedWord };
    const prevInstances = queryClient.getQueryData<WordInstanceItem[]>(['word-instances', id]);

    const newKnownWords = vocabularyStats.knownWords + knownWordsDelta;
    const newTextProgress = Math.round((newKnownWords / vocabularyStats.totalWords) * 100);

    // Optimistic update — patch cache so Word components re-render immediately
    setVocabularyStats({
      ...vocabularyStats,
      knownWords: newKnownWords,
      textKnownPercentage: newTextProgress,
    });
    setSelectedWord({ ...selectedWord, status: newStatus });
    queryClient.setQueryData<WordInstanceItem[]>(['word-instances', id], (old) =>
      old?.map((inst) => inst.wordId === wordId ? { ...inst, status: newStatus } : inst) ?? old
    );

    const isMilestone = knownWordsDelta > 0 && checkMilestone(newKnownWords);
    const message = isMilestone
      ? `Amazing! You've reached ${newKnownWords.toLocaleString()} known words!`
      : 'Status updated!';

    if (knownWordsDelta !== 0) {
      setFeedbackState({
        isVisible: true,
        message,
        oldStats: { knownWords: prevStats.knownWords, textProgress: prevStats.textKnownPercentage },
        newStats: { knownWords: newKnownWords, textProgress: newTextProgress },
        isMilestone,
      });
    }

    // Persist to DB — rollback optimistic update on error
    updateWordStatus.mutate(
      { wordId, status: newStatus },
      {
        onError: () => {
          setVocabularyStats(prevStats);
          setSelectedWord(prevWord);
          queryClient.setQueryData(['word-instances', id], prevInstances);
          setFeedbackState(null);
        },
      }
    );
  };

  const handleDismissFeedback = useCallback(() => setFeedbackState(null), []);

  useReaderKeyboard({
    currentStatus: tooltipWord?.status ?? selectedWord?.status ?? null,
    isActive: !isRightPanelOpen,
    onStatusChange: (newStatus) => {
      const wordId = tooltipWord?.wordId ?? selectedWord?.wordId;
      if (wordId) handleStatusChange(wordId, newStatus);
    },
  });

  const handleParagraphNavigate = (index: number) => {
    paragraphRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-desk">
      {/* Mobile/Tablet: Top Header Bar */}
      <header
        className={cn(
          'fixed top-0 inset-x-0 bg-paper/95 backdrop-blur-sm border-b border-border z-40 xl:hidden transition-transform duration-300',
          showMobileHeader ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push(`/series/${textData?.seriesId ?? ''}`)}
            className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
            aria-label="Back to series"
          >
            <ChevronLeft size={20} strokeWidth={2} />
            <span className="font-sans text-ui-sm font-medium">Back</span>
          </button>

          <h1 className="flex-1 px-4 font-serif text-content-sm text-ink truncate text-center">
            {textData?.title ?? ''}
          </h1>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => setSettingsAnchorEl(settingsAnchorEl ? null : e.currentTarget)}
              className="text-muted hover:text-ink transition-colors p-1"
              aria-label="Reader settings"
              aria-expanded={!!settingsAnchorEl}
            >
              <Settings size={20} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => setIsTextInfoOpen(true)}
              className="text-muted hover:text-ink transition-colors p-1"
              aria-label="Text information"
            >
              <Info size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile/Tablet: Backdrop overlay when panels are open */}
      {(isTextInfoOpen || (isRightPanelOpen && !isDesktop)) && (
        <div
          className="fixed inset-0 bg-ink/30 z-30 xl:hidden backdrop-blur-sm"
          onClick={() => {
            setIsTextInfoOpen(false);
            setIsRightPanelOpen(false);
          }}
        />
      )}

      {/* Large Desktop: 2-column | Mobile/Tablet: Stacked */}
      <div className={cn(
        'flex flex-col',
        !settings.isImmersionMode && 'xl:grid xl:grid-cols-[280px_1fr]',
      )}>
        {/* ── LEFT SIDEBAR ── */}
        <aside
          className={cn(
            'fixed inset-x-0 bottom-0 h-[90vh] xl:order-1 xl:sticky xl:top-0 xl:h-screen xl:inset-auto bg-paper border-t xl:border-t-0 xl:border-r border-border overflow-y-auto z-40 xl:z-auto rounded-t-2xl xl:rounded-none transition-transform duration-300',
            isTextInfoOpen ? 'translate-y-0' : 'translate-y-full xl:translate-y-0',
            settings.isImmersionMode && 'xl:hidden',
          )}
        >
          <button
            onClick={() => setIsTextInfoOpen(false)}
            className="absolute top-4 right-4 xl:hidden text-muted hover:text-ink transition-colors z-10"
            aria-label="Close text information"
          >
            <X size={24} strokeWidth={1.5} />
          </button>

          {isLoading ? (
            <TextInfoSkeleton />
          ) : (
            textData && (
              <TextInfo
                textId={id}
                title={textData.title}
                wordCount={textData.wordCount}
                uniqueWordCount={textData.uniqueWordCount}
                viewCount={textData.viewCount}
                knownPercentage={vocabularyStats.textKnownPercentage}
                seriesId={textData.seriesId}
                seriesName={textData.seriesName}
                tags={textData.tags}
                onRightPanelToggle={() => setIsRightPanelOpen(!isRightPanelOpen)}
                isRightPanelOpen={isRightPanelOpen}
              />
            )
          )}
        </aside>

        {/* ── MAIN READER AREA ── */}
        <main className="order-1 xl:order-2 flex flex-col items-center px-4 pt-20 pb-[50vh] xl:pt-12 xl:px-8">
          {adjacentQuery.isPending && (textData?.wordCount ?? 0) >= 226 ? (
            <nav className="invisible flex justify-between w-full max-w-prose mb-6 pb-4 border-b border-border" aria-hidden="true">
              <span className="font-sans text-ui-sm">.</span>
            </nav>
          ) : (adjacentQuery.data?.prev || adjacentQuery.data?.next) && (textData?.wordCount ?? 0) >= 226 ? (
            <nav className="flex justify-between w-full max-w-prose mb-6 pb-4 border-b border-border">
              {adjacentQuery.data?.prev ? (
                <Link
                  href={`/reader/${adjacentQuery.data.prev.id}`}
                  className="font-sans text-ui-sm text-primary hover:text-primary/80 transition-colors"
                >
                  ← {adjacentQuery.data.prev.title}
                </Link>
              ) : <span />}
              {adjacentQuery.data?.next ? (
                <Link
                  href={`/reader/${adjacentQuery.data.next.id}`}
                  className="font-sans text-ui-sm text-primary hover:text-primary/80 transition-colors"
                >
                  {adjacentQuery.data.next.title} →
                </Link>
              ) : <span />}
            </nav>
          ) : null}

          {isLoading ? (
            <ReaderContentSkeleton />
          ) : (
            textData && (
              <ReaderContent
                content={textData.content}
                onWordClick={handleWordClick}
                selectedWordId={selectedWord?.id}
                wordInstances={wordInstances}
                isLoading={instancesQuery.isLoading}
                loadError={instancesQuery.error?.message ?? null}
              />
            )
          )}

          {adjacentQuery.data && (adjacentQuery.data.prev || adjacentQuery.data.next) && (
            <nav className="flex justify-between w-full max-w-prose mt-8 pt-4 border-t border-border">
              {adjacentQuery.data.prev ? (
                <Link
                  href={`/reader/${adjacentQuery.data.prev.id}`}
                  className="font-sans text-ui-sm text-primary hover:text-primary/80 transition-colors"
                >
                  ← {adjacentQuery.data.prev.title}
                </Link>
              ) : <span />}
              {adjacentQuery.data.next ? (
                <Link
                  href={`/reader/${adjacentQuery.data.next.id}`}
                  className="font-sans text-ui-sm text-primary hover:text-primary/80 transition-colors"
                >
                  {adjacentQuery.data.next.title} →
                </Link>
              ) : <span />}
            </nav>
          )}
        </main>

      </div>

      {/* ── WORD DETAILS PANEL — fixed overlay, desktop + mobile ── */}
      {isRightPanelOpen && (
        isLoading ? (
          <div className="fixed top-0 right-0 h-screen w-full max-w-100 bg-paper border-l border-border overflow-y-auto z-50">
            <WordDetailsPanelSkeleton />
          </div>
        ) : (
          <WordDetailsPanel
            wordData={selectedWord}
            onClose={handleCloseWordDetails}
            onStatusChange={handleStatusChange}
            isDesktop={isDesktop}
          />
        )
      )}

      {/* ── DESKTOP TOP BAR — fixed, xl only ── */}
      <div className="hidden xl:flex fixed top-0 right-0 z-40 items-center gap-1 px-4 py-2.5">
        <button
          onClick={toggleImmersionMode}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-sans text-ui-xs transition-all',
            settings.isImmersionMode
              ? 'bg-primary-10 text-primary border border-primary/30'
              : 'text-muted hover:text-ink hover:bg-desk border border-transparent hover:border-border',
          )}
          aria-label="Toggle immersion mode"
          aria-pressed={settings.isImmersionMode}
        >
          {settings.isImmersionMode ? 'Immersion' : 'Study'}
        </button>
        <button
          onClick={(e) => setSettingsAnchorEl(settingsAnchorEl ? null : e.currentTarget)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-muted hover:text-ink hover:bg-desk border border-transparent hover:border-border transition-all"
          aria-label="Reader settings"
          aria-expanded={!!settingsAnchorEl}
        >
          <Settings size={16} strokeWidth={1.5} />
          <span className="font-sans text-ui-xs">Settings</span>
        </button>
      </div>

      {/* ── READER SETTINGS PANEL ── */}
      {settingsAnchorEl && (
        <ReaderSettingsPanel
          anchorEl={settingsAnchorEl}
          onClose={() => setSettingsAnchorEl(null)}
        />
      )}

      {/* ── PARAGRAPH SCRUBBER — top-right corner card ── */}
      <ParagraphScrubber
        paragraphs={paragraphProgress}
        currentIndex={currentParagraphIndex}
        onNavigate={handleParagraphNavigate}
        hidden={isRightPanelOpen}
      />

      {/* ── DESKTOP WORD TOOLTIP ── */}
      {tooltipWord && tooltipAnchorRect && (
        <WordTooltip
          wordData={tooltipWord}
          anchorRect={tooltipAnchorRect}
          onClose={handleTooltipClose}
          onStatusChange={(wordId, newStatus) => {
            handleStatusChange(wordId, newStatus);
          }}
          isExiting={isTooltipExiting}
          onMoreClick={() => {
            handleTooltipClose();
            setIsRightPanelOpen(true);
          }}
        />
      )}

      {/* ── STATUS UPDATE FEEDBACK ── */}
      {feedbackState && (
        <StatusUpdateFeedback
          isVisible={feedbackState.isVisible}
          message={feedbackState.message}
          oldStats={feedbackState.oldStats}
          newStats={feedbackState.newStats}
          isMilestone={feedbackState.isMilestone}
          onDismiss={handleDismissFeedback}
        />
      )}
    </div>
  );
}
