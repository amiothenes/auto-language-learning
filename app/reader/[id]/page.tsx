'use client';

import { use, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { X, ChevronLeft, Info, Settings } from 'lucide-react';
import { TextInfo } from '@/components/reader/TextInfo';
import { ReaderContent } from '@/components/reader/ReaderContent';
import { WordDetailsPanel } from '@/components/reader/WordDetailsPanel';
import { WordTooltip } from '@/components/reader/WordTooltip';
import { TextInfoSkeleton, ReaderContentSkeleton } from '@/components/reader/ReaderSkeleton';
import { VocabularyStatus } from '@/lib/types';
import type { WordData, TextData } from '@/lib/types';
import { calculateCompletionPercentage } from '@/lib/utils/textStats';
import type { WordInstanceItem } from '@/lib/types/api';
import { useQueryClient } from '@tanstack/react-query';
import { StatusUpdateFeedback } from '@/components/reader/StatusUpdateFeedback';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { useText } from '@/lib/hooks/useText';
import { useWordInstances } from '@/lib/hooks/useWordInstances';
import { useUpdateWordStatus } from '@/lib/hooks/useUpdateWordStatus';
import { useUpdateWordTranslation } from '@/lib/hooks/useUpdateWordTranslation';
import { useAdjacentTexts } from '@/lib/hooks/useAdjacentTexts';
import { ParagraphScrubber } from '@/components/reader/ParagraphScrubber';
import { ReaderSettingsPanel } from '@/components/reader/ReaderSettingsPanel';
import { useReaderSettings } from '@/lib/contexts/ReaderSettingsContext';
import { useReaderKeyboard } from '@/lib/hooks/useReaderKeyboard';
import { MobileWordSheet } from '@/components/reader/MobileWordSheet';
import { MobileSettingsSheet } from '@/components/reader/MobileSettingsSheet';

// Per-paragraph heat color for the vocabulary density strip.
// Interpolates through the status hues: red → orange → yellow-green → green.
function paraHeatColor(progress: number): string {
  const stops = [
    { at: 0,   h: 2,   s: 75, l: 60 },
    { at: 33,  h: 32,  s: 90, l: 56 },
    { at: 66,  h: 78,  s: 60, l: 48 },
    { at: 100, h: 150, s: 40, l: 42 },
  ];
  const p = Math.max(0, Math.min(100, progress));
  let a = stops[0], b = stops[1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (p >= stops[i].at && p <= stops[i + 1].at) { a = stops[i]; b = stops[i + 1]; break; }
  }
  const t = b.at === a.at ? 0 : (p - a.at) / (b.at - a.at);
  return `hsl(${Math.round(a.h + (b.h - a.h) * t)}, ${Math.round(a.s + (b.s - a.s) * t)}%, ${Math.round(a.l + (b.l - a.l) * t)}%)`;
}

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
  const updateWordTranslation = useUpdateWordTranslation(id);
  const adjacentQuery = useAdjacentTexts(id, adjacentSort);

  useEffect(() => {
    fetch(`/api/texts/${id}/view`, {
      method: 'POST',
    })
      .then((res) => res.json())
      .then((data: { viewCount: number; seriesId: string | null }) => {
        queryClient.setQueryData(['text', id], (old: TextData | undefined) =>
          old ? { ...old, viewCount: data.viewCount } : old
        );
        queryClient.invalidateQueries({ queryKey: ['texts'] });
        if (data.seriesId) {
          queryClient.invalidateQueries({ queryKey: ['series', data.seriesId] });
          queryClient.invalidateQueries({ queryKey: ['series-list'] });
        }
      })
      .catch((err) => console.error('[Reader] View tracking failed:', err));
  }, [id, queryClient]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<WordData | null>(null);
  const [isTextInfoOpen, setIsTextInfoOpen] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [isParaMapOpen, setIsParaMapOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const { settings, toggleImmersionMode } = useReaderSettings();

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

  // Tracks which lemmas the user has already graded this session so we don't
  // show the "Know this word?" test mode on re-taps of the same word.
  const testedLemmasThisSession = useRef(new Set<string>());

  // ── Derived data ──────────────────────────────────────────────────────────
  const textData = textQuery.data;
  const wordInstances = instancesQuery.data;

  const paragraphs = useMemo(
    () => textData?.content.split('\n\n').filter((p) => p.trim()) ?? [],
    [textData]
  );

  // Per-paragraph completion % for the mini-map
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
      return {
        id: `p${index + 1}`,
        progress: Math.round(
          calculateCompletionPercentage(paraInstances.map((inst) => inst.status))
        ),
      };
    });
  }, [wordInstances, textData, paragraphs]);

  // Whole-text completion % for the sidebar — same query, same shared formula as
  // paragraphProgress above, so the sidebar and the ¶ map can never diverge again.
  const textKnownPercentage = useMemo(() => {
    if (!wordInstances) return 0;
    return calculateCompletionPercentage(wordInstances.map((inst) => inst.status));
  }, [wordInstances]);

  // Hard-stop gradient for the 4px vocabulary density strip (mobile only)
  const densityStripGradient = useMemo(() => {
    if (!paragraphProgress.length) return 'transparent';
    const step = 100 / paragraphProgress.length;
    const stops = paragraphProgress.map((p, i) => {
      const color = paraHeatColor(p.progress);
      return `${color} ${i * step}%, ${color} ${(i + 1) * step}%`;
    });
    return `linear-gradient(to right, ${stops.join(', ')})`;
  }, [paragraphProgress]);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!localStorage.getItem('verbista_reader_hint_dismissed')) {
      setShowHint(true);
    }
  }, []);

  useEffect(() => {
    if (textData?.seriesId) {
      const saved = localStorage.getItem(`series-sort-${textData.seriesId}`);
      const valid = ['title-asc', 'progress-desc', 'progress-asc', 'recent'];
      if (saved && valid.includes(saved)) setAdjacentSort(saved);
    }
  }, [textData?.seriesId, id]);

  useEffect(() => {
    if (textData?.title) {
      document.title = `${textData.title} | Verbista`;
      return () => { document.title = 'Verbista'; };
    }
  }, [textData?.title]);

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

  if (!isLoading && !textQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <EmptyState
          illustration="cloudoff"
          title="Text couldn't be loaded"
          description="This text may have been deleted or is unavailable."
          primaryAction={{
            label: 'Back to Series',
            onClick: () => router.back(),
          }}
        />
      </div>
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const checkMilestone = (knownWords: number): boolean =>
    [100, 250, 500, 1000, 2000, 5000].includes(knownWords);

  // Unique-word (deduped by lemma) known-count, for the toast's "X words seen" /
  // milestone thresholds. IGNORE is excluded from both counts, matching
  // calculateCompletionPercentage's rule so this can never drift from the
  // sidebar/map percentages.
  const uniqueWordCompletion = (instances: WordInstanceItem[] | undefined) => {
    if (!instances) return { total: 0, known: 0 };
    const statusByWord = new Map<string, VocabularyStatus>();
    for (const inst of instances) statusByWord.set(inst.wordId, inst.status);
    const gradable = Array.from(statusByWord.values()).filter((s) => s !== VocabularyStatus.IGNORE);
    const known = gradable.filter((s) => s !== VocabularyStatus.UNKNOWN).length;
    return { total: gradable.length, known };
  };

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
    setSelectedWord(null);
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
    if (!selectedWord) return;

    const prevWord = { ...selectedWord };
    const prevInstances = queryClient.getQueryData<WordInstanceItem[]>(['word-instances', id]);
    const nextInstances = prevInstances?.map((inst) =>
      inst.wordId === wordId ? { ...inst, status: newStatus } : inst
    );

    const oldUnique = uniqueWordCompletion(prevInstances);
    const newUnique = uniqueWordCompletion(nextInstances);
    const oldTextProgress = Math.round(calculateCompletionPercentage((prevInstances ?? []).map((i) => i.status)));
    const newTextProgress = Math.round(calculateCompletionPercentage((nextInstances ?? []).map((i) => i.status)));
    const knownWordsDelta = newUnique.known - oldUnique.known;

    // Optimistic update — patch cache so Word components re-render immediately
    setSelectedWord({ ...selectedWord, status: newStatus });
    queryClient.setQueryData<WordInstanceItem[]>(['word-instances', id], nextInstances ?? prevInstances);

    const isMilestone = knownWordsDelta > 0 && checkMilestone(newUnique.known);
    const message = isMilestone
      ? `Amazing! You've seen ${newUnique.known.toLocaleString()} words!`
      : 'Status updated!';

    if (knownWordsDelta !== 0 || oldTextProgress !== newTextProgress) {
      setFeedbackState({
        isVisible: true,
        message,
        oldStats: { knownWords: oldUnique.known, textProgress: oldTextProgress },
        newStats: { knownWords: newUnique.known, textProgress: newTextProgress },
        isMilestone,
      });
    }

    // Persist to DB — rollback optimistic update on error
    updateWordStatus.mutate(
      { wordId, status: newStatus },
      {
        onError: () => {
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
      {/* Mobile/Tablet: Top Header Bar + vocabulary density strip (move together on scroll) */}
      <div
        className={cn(
          'fixed top-0 inset-x-0 z-40 xl:hidden transition-transform duration-300',
          showMobileHeader ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <header className="bg-paper/95 backdrop-blur-sm border-b border-border">
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
              {!settings.isImmersionMode && (
                <button
                  onClick={() => setIsTextInfoOpen(true)}
                  className="text-muted hover:text-ink transition-colors p-1"
                  aria-label="Text information"
                >
                  <Info size={20} strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* 10px vocabulary density strip — tappable to open ¶ map */}
        {!settings.isImmersionMode && (
          <div
            className="h-2.5 cursor-pointer"
            style={{ background: densityStripGradient }}
            onClick={() => setIsParaMapOpen(true)}
            role="button"
            aria-label="View paragraph map"
          />
        )}
      </div>

      {/* Mobile/Tablet: Backdrop overlay when text info panel is open */}
      {isTextInfoOpen && (
        <div
          className="fixed inset-0 bg-ink/30 z-30 xl:hidden backdrop-blur-sm"
          onClick={() => setIsTextInfoOpen(false)}
        />
      )}

      {/* Large Desktop: 2-column | Mobile/Tablet: Stacked */}
      <div className={cn(
        'flex flex-col',
        !settings.isImmersionMode && 'xl:grid xl:grid-cols-[280px_1fr_188px]',
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
                knownPercentage={textKnownPercentage}
                seriesId={textData.seriesId}
                seriesName={textData.seriesName}
                tags={textData.tags}
              />
            )
          )}
        </aside>

        {/* ── MAIN READER AREA ── */}
        <main
          className="order-1 xl:order-2 flex flex-col items-center px-4 md:px-6 lg:px-8 pt-21 pb-[50vh] xl:pt-12 xl:px-8"
        >
          {/* ── STATUS HINT BANNER — first visit only ── */}
          {showHint && (
            <div className="relative w-full max-w-prose mb-4 bg-primary/5 border border-primary/20 rounded-card px-4 py-2.5 pr-9">
              <button
                onClick={() => {
                  localStorage.setItem('verbista_reader_hint_dismissed', 'true');
                  setShowHint(false);
                }}
                className="absolute top-2 right-2 p-1 text-muted hover:text-ink transition-colors cursor-pointer rounded"
                aria-label="Dismiss hint"
              >
                <X size={14} strokeWidth={2} />
              </button>
              <div className="flex items-start gap-x-3 gap-y-2 flex-wrap font-sans text-ui-xs text-ink">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'hsl(205,80%,58%)' }} />
                  Unknown
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'hsl(2,75%,60%)' }} />
                  Newly Seen
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'hsl(32,90%,56%)' }} />
                  Familiar
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'hsl(78,60%,48%)' }} />
                  Known
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0 border border-ink/70" />
                    Well Known
                  </span>
                  <span className="text-[9px] text-muted pl-3.5 leading-tight">I know this perfectly</span>
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0 opacity-35" style={{ background: 'hsl(0,0%,50%)' }} />
                    <span className="border-b border-dashed" style={{ borderColor: 'hsl(0,0%,55%)' }}>Ignored</span>
                  </span>
                  <span className="text-[9px] text-muted pl-3.5 leading-tight">proper noun or skip</span>
                </span>
                <span className="text-muted self-center">tap any word to grade it</span>
              </div>
            </div>
          )}

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
                seriesId={textData.seriesId}
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

        {/* ── PARAGRAPH SCRUBBER — reserved right-gutter column, xl+ only ── */}
        <ParagraphScrubber
          paragraphs={paragraphProgress}
          currentIndex={currentParagraphIndex}
          onNavigate={handleParagraphNavigate}
          hidden={isRightPanelOpen || settings.isImmersionMode}
        />

      </div>

      {/* ── WORD DETAILS PANEL — centered modal (desktop only) ── */}
      {isRightPanelOpen && isDesktop && selectedWord && (
        <WordDetailsPanel
          wordData={selectedWord}
          onClose={handleCloseWordDetails}
          onStatusChange={handleStatusChange}
          onTranslationChange={(wordId, translation) => {
            updateWordTranslation.mutate({ wordId, translation });
          }}
        />
      )}

      {/* ── MOBILE WORD SHEET — bottom sheet (<1280px) ── */}
      {isRightPanelOpen && !isDesktop && selectedWord && (
        <MobileWordSheet
          wordData={selectedWord}
          onClose={handleCloseWordDetails}
          onStatusChange={handleStatusChange}
          isFirstTest={!testedLemmasThisSession.current.has(selectedWord.lemma)}
          onGraded={(lemma) => { testedLemmasThisSession.current.add(lemma); }}
          onTranslationChange={(wordId, newTranslation) => {
            updateWordTranslation.mutate({ wordId, translation: newTranslation });
          }}
        />
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

      {/* ── READER SETTINGS — desktop popover (xl+) / mobile bottom sheet ── */}
      {settingsAnchorEl && isDesktop && (
        <ReaderSettingsPanel
          anchorEl={settingsAnchorEl}
          onClose={() => setSettingsAnchorEl(null)}
        />
      )}
      {settingsAnchorEl && !isDesktop && (
        <MobileSettingsSheet onClose={() => setSettingsAnchorEl(null)} />
      )}

      {/* ── DESKTOP WORD TOOLTIP ── */}
      {tooltipWord && tooltipAnchorRect && (
        <WordTooltip
          wordData={tooltipWord}
          anchorRect={tooltipAnchorRect}
          onClose={handleTooltipClose}
          onStatusChange={(wordId, newStatus) => {
            handleStatusChange(wordId, newStatus);
            // WordTooltip manages close timing: stays open after first-test grade
          }}
          isFirstTest={!testedLemmasThisSession.current.has(tooltipWord.lemma)}
          onGraded={(lemma) => { testedLemmasThisSession.current.add(lemma); }}
          onTranslationChange={(wordId, translation) => {
            updateWordTranslation.mutate({ wordId, translation });
          }}
          isExiting={isTooltipExiting}
          onMoreClick={() => {
            // Close tooltip without clearing selectedWord — the modal takes over
            setIsTooltipExiting(true);
            setTimeout(() => {
              setTooltipWord(null);
              setTooltipAnchorRect(null);
              setIsTooltipExiting(false);
            }, 120);
            setIsRightPanelOpen(true);
          }}
        />
      )}

      {/* ── PARAGRAPH MAP — mobile bottom sheet, opened by tapping density strip ── */}
      {isParaMapOpen && (
        <>
          <div
            className="fixed inset-0 z-45 bg-ink/30 xl:hidden"
            onClick={() => setIsParaMapOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed bottom-0 inset-x-0 z-48 bg-paper rounded-t-2xl shadow-modal max-h-[80dvh] flex flex-col xl:hidden animate-slide-up">
            <div className="shrink-0 pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="font-sans text-ui-sm font-semibold text-ink">Paragraph Map</p>
              <button
                onClick={() => setIsParaMapOpen(false)}
                className="text-muted hover:text-ink transition-colors p-1 -mr-1"
                aria-label="Close paragraph map"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {paragraphs.map((para, i) => {
                const progress = paragraphProgress[i]?.progress ?? 0;
                const preview = para.slice(0, 80).trim() + (para.length > 80 ? '…' : '');
                return (
                  <button
                    key={i}
                    onClick={() => { handleParagraphNavigate(i); setIsParaMapOpen(false); }}
                    className={cn(
                      'w-full text-left p-3 rounded-card border transition-colors',
                      currentParagraphIndex === i
                        ? 'border-primary/30 bg-primary-05'
                        : 'border-border hover:bg-desk',
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-sans text-ui-xs text-muted">¶{i + 1}</span>
                      <span className="font-sans text-ui-xs font-medium text-ink">{progress}%</span>
                    </div>
                    <p className="font-serif text-content-sm text-ink leading-snug mb-2 line-clamp-2">
                      {preview}
                    </p>
                    <div className="h-1 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progress}%`, background: paraHeatColor(progress) }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
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
