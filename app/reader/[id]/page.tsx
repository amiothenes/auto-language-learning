'use client';

import { use, useState, useRef, useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { X, ChevronLeft, Info } from 'lucide-react';
import { TextInfo } from '@/components/reader/TextInfo';
import { ReaderContent } from '@/components/reader/ReaderContent';
import { WordDetailsPanel } from '@/components/reader/WordDetailsPanel';
import { WordData } from '@/components/reader/Word';

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
  
  // Handle word click - open right panel and set selected word
  const handleWordClick = (wordData: WordData) => {
    setSelectedWord(wordData);
    setIsRightPanelOpen(true);
  };

  // Handle closing word details panel
  const handleCloseWordDetails = () => {
    setIsRightPanelOpen(false);
    // Optionally clear selected word after animation
    setTimeout(() => setSelectedWord(null), 300);
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

    // Only add touch listeners on mobile
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
  }, [router, textData.seriesId]);

  return (
    <div className="min-h-screen bg-desk">
      {/* Mobile: Top Header Bar - Auto-hides on scroll */}
      <header className={cn(
        "fixed top-0 inset-x-0 bg-paper/95 backdrop-blur-sm border-b border-border z-40 md:hidden transition-transform duration-300",
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

      {/* Mobile: Backdrop overlay when panels are open */}
      {(isTextInfoOpen || isRightPanelOpen) && (
        <div 
          className="fixed inset-0 bg-ink/30 z-30 md:hidden backdrop-blur-sm"
          onClick={() => {
            setIsTextInfoOpen(false);
            setIsRightPanelOpen(false);
          }}
        />
      )}

      {/* Desktop: 3-column grid | Mobile: Stacked layout */}
      <div className={cn(
        "flex flex-col md:grid",
        isRightPanelOpen 
          ? "md:grid-cols-[280px_1fr_380px]" 
          : "md:grid-cols-[280px_1fr]"
      )}>
        {/* ================================================================ */}
        {/* LEFT SIDEBAR - Text Info & Navigation */}
        {/* ================================================================ */}
        <aside className={cn(
          "fixed inset-x-0 bottom-0 h-[90vh] md:order-1 md:sticky md:top-0 md:h-screen md:inset-auto bg-paper border-t md:border-t-0 md:border-r border-border overflow-y-auto z-40 md:z-auto rounded-t-2xl md:rounded-none transition-transform duration-300",
          isTextInfoOpen ? "translate-y-0" : "translate-y-full md:translate-y-0"
        )}>
          {/* Mobile: Close button */}
          <button
            onClick={() => setIsTextInfoOpen(false)}
            className="absolute top-4 right-4 md:hidden text-muted hover:text-ink transition-colors z-10"
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
        <main className="order-1 md:order-2 flex justify-center px-4 pt-20 pb-8 md:pt-12 md:pb-12 md:px-8">
          <ReaderContent
            content={textData.content}
            onWordClick={handleWordClick}
            selectedWordId={selectedWord?.id}
          />
        </main>

        {/* ================================================================ */}
        {/* RIGHT PANEL - Word Details (Conditional) */}
        {/* ================================================================ */}
        {isRightPanelOpen && (
          <WordDetailsPanel
            wordData={selectedWord}
            onClose={handleCloseWordDetails}
          />
        )}
      </div>
    </div>
  );
}
