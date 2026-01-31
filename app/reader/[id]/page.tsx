'use client';

import { use, useState, useRef, useEffect, useCallback } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { X, ChevronLeft, Info } from 'lucide-react';
import { TextInfo } from '@/components/reader/TextInfo';
import { ReaderContent } from '@/components/reader/ReaderContent';
import { WordDetailsPanel } from '@/components/reader/WordDetailsPanel';
import { WordTooltip } from '@/components/reader/WordTooltip';
import { WordData, VocabularyStatus } from '@/components/reader/Word';
import { StatusUpdateFeedback } from '@/components/reader/StatusUpdateFeedback';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';

// ============================================================================
// Hardcoded Data (Temporary)
// ============================================================================

interface TextData {
  id: string;
  title: string;
  seriesId: string;
  seriesName: string;
  wordCount: number;
  uniqueWordCount: number;
  viewCount: number;
  knownPercentage: number;
  tags: string[];
  content: string;
}

const TEMP_TEXT_DATA: Record<string, TextData> = {
  't1': {
    id: 't1',
    title: 'Breaking: New Economic Reforms Announced',
    seriesId: '1',
    seriesName: 'Russian News Articles',
    wordCount: 2847,
    uniqueWordCount: 892,
    viewCount: 3,
    knownPercentage: 78,
    tags: ['Politics', 'News', 'Economics'],
    content: `Правительство объявило о масштабном пакете экономических реформ, направленных на стимулирование роста. Министр финансов подчеркнул, что эти меры призваны укрепить стабильность экономики и улучшить условия для бизнеса.

Новый план включает снижение налогов для малого и среднего бизнеса, упрощение административных процедур и увеличение инвестиций в инфраструктуру. Эксперты считают, что эти шаги могут значительно повысить конкурентоспособность страны на мировом рынке.

Представители деловых кругов приветствовали инициативу, отметив, что давно ожидали подобных изменений. Однако некоторые аналитики выражают осторожность, указывая на необходимость тщательной проработки деталей реализации.

В течение следующих месяцев правительство планирует провести серию консультаций с заинтересованными сторонами для уточнения параметров реформ. Ожидается, что первые изменения вступят в силу уже в следующем квартале.

Международные наблюдатели отмечают, что такие реформы могут служить примером для других развивающихся экономик. Многие страны внимательно следят за развитием ситуации, чтобы извлечь полезные уроки из этого опыта.`,
  },
  't2': {
    id: 't2',
    title: 'Climate Summit Reaches Historic Agreement',
    seriesId: '1',
    seriesName: 'Russian News Articles',
    wordCount: 1923,
    uniqueWordCount: 645,
    viewCount: 5,
    knownPercentage: 82,
    tags: ['Environment', 'Politics', 'International'],
    content: `Мировые лидеры собрались в Москве для заключения исторического соглашения о климатических действиях и устойчивом развитии. Саммит продолжался пять дней и завершился принятием амбициозной программы действий.

Главы государств договорились о конкретных целях по сокращению выбросов парниковых газов и переходу на возобновляемые источники энергии. Соглашение предусматривает создание международного фонда для поддержки развивающихся стран в их усилиях по борьбе с изменением климата.

Экологические организации назвали это соглашение поворотным моментом в глобальных усилиях по защите окружающей среды. Активисты надеются, что страны выполнят свои обязательства и предпримут необходимые действия для достижения поставленных целей.`,
  },
};

// Hardcoded paragraph progress data for mini map
const TEMP_PARAGRAPH_PROGRESS = [
  { id: 'p1', progress: 85 },   // High - green
  { id: 'p2', progress: 72 },   // Medium-high - yellow-green
  { id: 'p3', progress: 45 },   // Medium - orange
  { id: 'p4', progress: 68 },   // Medium-high
  { id: 'p5', progress: 90 },   // High - green
  { id: 'p6', progress: 55 },   // Medium
  { id: 'p7', progress: 30 },   // Low - red-orange
  { id: 'p8', progress: 78 },   // Medium-high
  { id: 'p9', progress: 62 },   // Medium
  { id: 'p10', progress: 82 },  // High
  { id: 'p11', progress: 48 },  // Medium-low
  { id: 'p12', progress: 95 },  // Very high - green
];

// ============================================================================
// Reader Page Component
// ============================================================================

interface ReaderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ReaderPage({ params }: ReaderPageProps) {
  // Unwrap the params Promise using React.use()
  const { id } = use(params);
  const textData = TEMP_TEXT_DATA[id];
  const router = useRouter();

  // State for right panel visibility and selected word
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<WordData | null>(null);
  
  // State for mobile text info panel
  const [isTextInfoOpen, setIsTextInfoOpen] = useState(false);
  
  // State for vocabulary stats tracking
  // NOTE: To test milestones, temporarily set knownWords to values like:
  // - 99 (to trigger 100 milestone on next word marked as known)
  // - 249 (to trigger 250 milestone)
  // - 499 (to trigger 500 milestone)
  // - 999 (to trigger 1000 milestone)
  const [vocabularyStats, setVocabularyStats] = useState({
    totalWords: textData.uniqueWordCount,
    knownWords: Math.round(textData.uniqueWordCount * (textData.knownPercentage / 100)),
    textKnownPercentage: textData.knownPercentage,
  });
  
  // State for status update feedback
  const [feedbackState, setFeedbackState] = useState<{
    isVisible: boolean;
    message: string;
    oldStats: { knownWords: number; textProgress: number };
    newStats: { knownWords: number; textProgress: number };
    isMilestone: boolean;
  } | null>(null);
  
  // Desktop detection for tooltip vs side panel behavior
  const isDesktop = useMediaQuery('(min-width: 1280px)');

  // State for word tooltip (desktop only)
  const [tooltipWord, setTooltipWord] = useState<WordData | null>(null);
  const [tooltipAnchorRect, setTooltipAnchorRect] = useState<DOMRect | null>(null);
  const [isTooltipExiting, setIsTooltipExiting] = useState(false);

  // State for mobile header visibility (auto-hide on scroll)
  const [showMobileHeader, setShowMobileHeader] = useState(true);
  const lastScrollY = useRef(0);
  
  // State for current paragraph tracking
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const paragraphRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  
  // Touch gesture tracking for swipe back
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);

  // If text not found, show 404
  if (!textData) {
    notFound();
  }

  // Split content into paragraphs
  const paragraphs = textData.content.split('\n\n').filter(p => p.trim());
  
  // Handle word click - desktop: tooltip, mobile: side panel
  const handleWordClick = (wordData: WordData, anchorRect: DOMRect) => {
    setSelectedWord(wordData);

    if (isDesktop) {
      // If clicking the same word, close tooltip
      if (tooltipWord?.id === wordData.id && !isTooltipExiting) {
        handleTooltipClose();
        return;
      }
      // Swap immediately if different word (no exit animation)
      setIsTooltipExiting(false);
      setTooltipWord(wordData);
      setTooltipAnchorRect(anchorRect);
    } else {
      // Mobile/tablet: open side panel directly
      setIsRightPanelOpen(true);
    }
  };

  // Handle closing word details panel
  const handleCloseWordDetails = () => {
    setIsRightPanelOpen(false);
    // Optionally clear selected word after animation
    setTimeout(() => setSelectedWord(null), 300);
  };

  // Handle tooltip close with exit animation — also deselects the word
  const handleTooltipClose = useCallback(() => {
    setIsTooltipExiting(true);
    setTimeout(() => {
      setTooltipWord(null);
      setTooltipAnchorRect(null);
      setIsTooltipExiting(false);
      setSelectedWord(null);
    }, 120);
  }, []);

  // Handle "View Full Details" from tooltip
  const handleTooltipViewDetails = () => {
    setTooltipWord(null);
    setTooltipAnchorRect(null);
    setIsTooltipExiting(false);
    setIsRightPanelOpen(true);
  };
  
  /**
   * Check if a number is a milestone
   */
  const checkMilestone = (knownWords: number): boolean => {
    const milestones = [100, 250, 500, 1000, 2000, 5000];
    return milestones.includes(knownWords);
  };
  
  /**
   * Check if a status is considered "known" (KNOWN or WELL_KNOWN)
   */
  const isKnownStatus = (status: VocabularyStatus): boolean => {
    return status === VocabularyStatus.KNOWN || status === VocabularyStatus.WELL_KNOWN;
  };
  
  /**
   * Handle status change for a word
   */
  const handleStatusChange = (wordId: string, newStatus: VocabularyStatus) => {
    if (!selectedWord) return;
    
    const oldStatus = selectedWord.status;
    const wasKnown = isKnownStatus(oldStatus);
    const isNowKnown = isKnownStatus(newStatus);
    
    // Calculate stat changes
    let knownWordsDelta = 0;
    if (!wasKnown && isNowKnown) {
      knownWordsDelta = 1; // Word became known
    } else if (wasKnown && !isNowKnown) {
      knownWordsDelta = -1; // Word became unknown
    }
    
    // Calculate new stats
    const oldStats = {
      knownWords: vocabularyStats.knownWords,
      textProgress: vocabularyStats.textKnownPercentage,
    };
    
    const newKnownWords = vocabularyStats.knownWords + knownWordsDelta;
    const newTextProgress = Math.round((newKnownWords / vocabularyStats.totalWords) * 100);
    
    const newStats = {
      knownWords: newKnownWords,
      textProgress: newTextProgress,
    };
    
    // Update vocabulary stats
    setVocabularyStats({
      ...vocabularyStats,
      knownWords: newKnownWords,
      textKnownPercentage: newTextProgress,
    });
    
    // Update selected word status (optimistic update)
    setSelectedWord({
      ...selectedWord,
      status: newStatus,
    });
    
    // Check if milestone reached
    const isMilestone = knownWordsDelta > 0 && checkMilestone(newKnownWords);
    
    // Determine message
    let message = 'Status updated!';
    if (isMilestone) {
      message = `Amazing! You've reached ${newKnownWords.toLocaleString()} known words!`;
    }
    
    // Debug logging
    console.log('Status Change Details:', {
      wordId,
      oldStatus,
      newStatus,
      knownWordsDelta,
      oldKnownWords: oldStats.knownWords,
      newKnownWords,
      isMilestone,
      nextMilestones: [100, 250, 500, 1000, 2000, 5000].filter(m => m > newKnownWords).slice(0, 3),
    });
    
    // Show feedback only if stats changed
    if (knownWordsDelta !== 0) {
      setFeedbackState({
        isVisible: true,
        message,
        oldStats,
        newStats,
        isMilestone,
      });
    }
    
    // TODO: In real app, make API call to update word status
    console.log(`Status changed: ${selectedWord.surface} -> ${newStatus}`);
  };
  
  /**
   * Handle dismissing the feedback toast
   */
  const handleDismissFeedback = () => {
    setFeedbackState(null);
  };
  
  // Handle click on mini map bar to scroll to paragraph
  const handleParagraphNavigate = (index: number) => {
    const element = paragraphRefs.current[index];
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  };
  
  // Track current paragraph position with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = paragraphRefs.current.indexOf(entry.target as HTMLParagraphElement);
            if (index !== -1) {
              setCurrentParagraphIndex(index);
            }
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

  // Auto-hide mobile header on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        // Always show at top
        setShowMobileHeader(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling down - hide header
        setShowMobileHeader(false);
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolling up - show header
        setShowMobileHeader(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle swipe gestures for navigation
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
      
      // Check if horizontal swipe (more horizontal than vertical)
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Swipe right (from left edge) - go back
        if (deltaX > 100 && touchStartX.current < 50) {
          router.push(`/series/${textData.seriesId}`);
        }
      }
    };

    // Only add touch listeners on mobile/tablet/small desktop
    if (window.innerWidth < 1280) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [router, textData.seriesId]);

  return (
    <div className="min-h-screen bg-desk">
      {/* Mobile/Tablet/Small Desktop: Top Header Bar - Auto-hides on scroll */}
      <header className={cn(
        "fixed top-0 inset-x-0 bg-paper/95 backdrop-blur-sm border-b border-border z-40 xl:hidden transition-transform duration-300",
        showMobileHeader ? "translate-y-0" : "-translate-y-full"
      )}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Back Button */}
          <button
            onClick={() => router.push(`/series/${textData.seriesId}`)}
            className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
            aria-label="Back to series"
          >
            <ChevronLeft size={20} strokeWidth={2} />
            <span className="font-sans text-ui-sm font-medium">Back</span>
          </button>
          
          {/* Title - Truncated */}
          <h1 className="flex-1 px-4 font-serif text-content-sm text-ink truncate text-center">
            {textData.title}
          </h1>
          
          {/* Info Button */}
          <button
            onClick={() => setIsTextInfoOpen(true)}
            className="text-muted hover:text-ink transition-colors p-1"
            aria-label="Text information"
          >
            <Info size={20} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Mobile/Tablet/Small Desktop: Backdrop overlay when panels are open */}
      {(isTextInfoOpen || isRightPanelOpen) && (
        <div 
          className="fixed inset-0 bg-ink/30 z-30 xl:hidden backdrop-blur-sm"
          onClick={() => {
            setIsTextInfoOpen(false);
            setIsRightPanelOpen(false);
          }}
        />
      )}

      {/* Large Desktop: 3-column grid | Mobile/Tablet/Small Desktop: Stacked layout */}
      <div className="flex flex-col xl:grid xl:grid-cols-[280px_1fr_25rem]">
        {/* ================================================================ */}
        {/* LEFT SIDEBAR - Text Info & Navigation */}
        {/* ================================================================ */}
        <aside className={cn(
          "fixed inset-x-0 bottom-0 h-[90vh] xl:order-1 xl:sticky xl:top-0 xl:h-screen xl:inset-auto bg-paper border-t xl:border-t-0 xl:border-r border-border overflow-y-auto z-40 xl:z-auto rounded-t-2xl xl:rounded-none transition-transform duration-300",
          isTextInfoOpen ? "translate-y-0" : "translate-y-full xl:translate-y-0"
        )}>
          {/* Mobile: Close button */}
          <button
            onClick={() => setIsTextInfoOpen(false)}
            className="absolute top-4 right-4 xl:hidden text-muted hover:text-ink transition-colors z-10"
            aria-label="Close text information"
          >
            <X size={24} strokeWidth={1.5} />
          </button>
          
          <TextInfo
            title={textData.title}
            wordCount={textData.wordCount}
            uniqueWordCount={textData.uniqueWordCount}
            viewCount={textData.viewCount}
            knownPercentage={textData.knownPercentage}
            seriesId={textData.seriesId}
            seriesName={textData.seriesName}
            tags={textData.tags}
            paragraphProgress={TEMP_PARAGRAPH_PROGRESS}
            currentParagraphIndex={currentParagraphIndex}
            onParagraphNavigate={handleParagraphNavigate}
            onRightPanelToggle={() => setIsRightPanelOpen(!isRightPanelOpen)}
            isRightPanelOpen={isRightPanelOpen}
          />
        </aside>

        {/* ================================================================ */}
        {/* MAIN READER AREA - Centered Content */}
        {/* ================================================================ */}
        <main className="order-1 xl:order-2 flex justify-center px-4 pt-20 pb-8 xl:pt-12 xl:pb-12 xl:px-8">
          <ReaderContent
            content={textData.content}
            onWordClick={handleWordClick}
            selectedWordId={selectedWord?.id}
          />
        </main>

        {/* ================================================================ */}
        {/* RIGHT PANEL SPACE - Reserved on Large Desktop (≥1280px), Hidden on smaller screens */}
        {/* ================================================================ */}
        <aside className="hidden xl:block xl:order-3 relative">
          {/* Reserved space - panel slides over this area */}
          {isRightPanelOpen && (
            <WordDetailsPanel
              wordData={selectedWord}
              onClose={handleCloseWordDetails}
              onStatusChange={handleStatusChange}
              isDesktop={true}
            />
          )}
        </aside>
      </div>
      
      {/* ================================================================ */}
      {/* MOBILE/TABLET/SMALL DESKTOP WORD DETAILS - Slides from right, overlaps content */}
      {/* ================================================================ */}
      {isRightPanelOpen && (
        <WordDetailsPanel
          wordData={selectedWord}
          onClose={handleCloseWordDetails}
          onStatusChange={handleStatusChange}
          isDesktop={false}
        />
      )}
      
      {/* ================================================================ */}
      {/* DESKTOP WORD TOOLTIP */}
      {/* ================================================================ */}
      {tooltipWord && tooltipAnchorRect && (
        <WordTooltip
          wordData={tooltipWord}
          anchorRect={tooltipAnchorRect}
          onClose={handleTooltipClose}
          onStatusChange={handleStatusChange}
          onViewDetails={handleTooltipViewDetails}
          isExiting={isTooltipExiting}
        />
      )}

      {/* ================================================================ */}
      {/* STATUS UPDATE FEEDBACK - Toast Notification */}
      {/* ================================================================ */}
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
