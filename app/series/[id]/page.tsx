'use client';

import { useState, useMemo, useEffect, useRef, use } from 'react';
import { notFound } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Heading, Muted } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { SeriesHeader } from '@/components/series/SeriesHeader';
import { TextCard } from '@/components/series/TextCard';
import { TextCardSkeleton } from '@/components/series/TextCardSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Plus, Upload, ChevronDown } from 'lucide-react';

// ============================================================================
// Hardcoded Data
// ============================================================================

interface Text {
  id: string;
  title: string;
  wordCount: number;
  uniqueWordCount: number;
  knownPercentage: number;
  lastRead: string;
  preview: string;
}

interface SeriesDetail {
  id: string;
  name: string;
  description: string;
  textCount: number;
  totalWords: number;
  overallProgress: number;
  lastUpdated: string;
  texts: Text[];
}

const TEMP_SERIES_DETAILS: Record<string, SeriesDetail> = {
  '1': {
    id: '1',
    name: 'Russian News Articles',
    description: 'A collection of current events and breaking news from Russian sources',
    textCount: 10,
    totalWords: 24583,
    overallProgress: 72,
    lastUpdated: '2 days ago',
    texts: [
      {
        id: 't1',
        title: 'Breaking: New Economic Reforms Announced',
        wordCount: 2847,
        uniqueWordCount: 892,
        knownPercentage: 78,
        lastRead: '1 day ago',
        preview: 'The government has announced a comprehensive package of economic reforms aimed at boosting growth...',
      },
      {
        id: 't2',
        title: 'Climate Summit Reaches Historic Agreement',
        wordCount: 1923,
        uniqueWordCount: 645,
        knownPercentage: 82,
        lastRead: '2 days ago',
        preview: 'World leaders gathered in Moscow to finalize a landmark agreement on climate action and sustainability...',
      },
      {
        id: 't3',
        title: 'Tech Giant Unveils Revolutionary AI System',
        wordCount: 3156,
        uniqueWordCount: 1024,
        knownPercentage: 65,
        lastRead: '3 days ago',
        preview: 'A leading technology company has revealed its latest artificial intelligence breakthrough that promises...',
      },
      {
        id: 't4',
        title: 'Cultural Festival Attracts Millions of Visitors',
        wordCount: 1567,
        uniqueWordCount: 523,
        knownPercentage: 89,
        lastRead: '4 days ago',
        preview: 'The annual international cultural festival drew record crowds this year with performances and exhibitions...',
      },
      {
        id: 't5',
        title: 'Space Program Announces Mars Mission Timeline',
        wordCount: 2645,
        uniqueWordCount: 786,
        knownPercentage: 71,
        lastRead: '5 days ago',
        preview: 'Officials from the space agency provided detailed plans for the upcoming crewed mission to Mars...',
      },
      {
        id: 't6',
        title: 'Healthcare System Undergoes Major Transformation',
        wordCount: 2234,
        uniqueWordCount: 712,
        knownPercentage: 76,
        lastRead: '1 week ago',
        preview: 'A sweeping overhaul of the national healthcare system aims to improve access and reduce costs...',
      },
      {
        id: 't7',
        title: 'Education Reform: New Curriculum Standards',
        wordCount: 1876,
        uniqueWordCount: 598,
        knownPercentage: 68,
        lastRead: '1 week ago',
        preview: 'The Ministry of Education has introduced updated curriculum standards for primary and secondary schools...',
      },
      {
        id: 't8',
        title: 'Transportation Infrastructure Investment Plan',
        wordCount: 2987,
        uniqueWordCount: 923,
        knownPercentage: 73,
        lastRead: '2 weeks ago',
        preview: 'A massive infrastructure investment plan focuses on modernizing railways, highways, and public transit...',
      },
      {
        id: 't9',
        title: 'Regional Elections: Voter Turnout Analysis',
        wordCount: 2156,
        uniqueWordCount: 687,
        knownPercentage: 61,
        lastRead: '2 weeks ago',
        preview: 'Political analysts examine the factors behind record voter participation in recent regional elections...',
      },
      {
        id: 't10',
        title: 'Agricultural Sector Embraces Smart Farming',
        wordCount: 1192,
        uniqueWordCount: 412,
        knownPercentage: 85,
        lastRead: '3 weeks ago',
        preview: 'Modern technology is transforming traditional farming practices with drones, sensors, and data analytics...',
      },
    ],
  },
  '2': {
    id: '2',
    name: 'Spanish Short Stories',
    description: 'Classic and contemporary short fiction from Spanish-speaking authors',
    textCount: 8,
    totalWords: 18456,
    overallProgress: 45,
    lastUpdated: '5 days ago',
    texts: [
      {
        id: 't11',
        title: 'El jardín de senderos que se bifurcan',
        wordCount: 3245,
        uniqueWordCount: 1123,
        knownPercentage: 52,
        lastRead: '5 days ago',
        preview: 'En la tercera página de mi narración se lee que «Liddell Hart conjetura que el próximo...',
      },
      {
        id: 't12',
        title: 'La casa de Asterión',
        wordCount: 1567,
        uniqueWordCount: 542,
        knownPercentage: 48,
        lastRead: '1 week ago',
        preview: 'Sé que me acusan de soberbia, y tal vez de misantropía, y tal vez de locura...',
      },
      {
        id: 't13',
        title: 'Continuidad de los parques',
        wordCount: 987,
        uniqueWordCount: 378,
        knownPercentage: 61,
        lastRead: '1 week ago',
        preview: 'Había empezado a leer la novela unos días antes. La abandonó por negocios urgentes...',
      },
      {
        id: 't14',
        title: 'La noche boca arriba',
        wordCount: 2834,
        uniqueWordCount: 892,
        knownPercentage: 43,
        lastRead: '2 weeks ago',
        preview: 'Y salían en ciertas épocas a cazar enemigos; le llamaban la guerra florida...',
      },
      {
        id: 't15',
        title: 'Casa tomada',
        wordCount: 2156,
        uniqueWordCount: 723,
        knownPercentage: 39,
        lastRead: '2 weeks ago',
        preview: 'Nos gustaba la casa porque aparte de espaciosa y antigua guardaba los recuerdos...',
      },
      {
        id: 't16',
        title: 'El Sur',
        wordCount: 2678,
        uniqueWordCount: 856,
        knownPercentage: 46,
        lastRead: '3 weeks ago',
        preview: 'El hombre que desembarcó en Buenos Aires en 1871 se llamaba Johannes Dahlmann...',
      },
      {
        id: 't17',
        title: 'Las ruinas circulares',
        wordCount: 2345,
        uniqueWordCount: 789,
        knownPercentage: 35,
        lastRead: '3 weeks ago',
        preview: 'Nadie lo vio desembarcar en la unánime noche, nadie vio la canoa de bambú...',
      },
      {
        id: 't18',
        title: 'El Aleph',
        wordCount: 2644,
        uniqueWordCount: 912,
        knownPercentage: 41,
        lastRead: '1 month ago',
        preview: 'La candente mañana de febrero en que Beatriz Viterbo murió, después de una imperiosa...',
      },
    ],
  },
};

type SortOption = 'title-asc' | 'progress-desc' | 'progress-asc' | 'recent';

// ============================================================================
// Series Detail Page Component
// ============================================================================

interface SeriesDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function SeriesDetailPage({ params }: SeriesDetailPageProps) {
  // Unwrap the params Promise using React.use()
  const { id } = use(params);
  const [isLoading, setIsLoading] = useState(true);
  const seriesData = TEMP_SERIES_DETAILS[id];

  // If series not found after loading, show 404
  if (!seriesData && !isLoading) {
    notFound();
  }

  const router = useRouter();
  const [seriesName, setSeriesName] = useState(seriesData?.name || '');
  const [sortBy, setSortBy] = useState<SortOption>('title-asc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [deleteSeriesTarget, setDeleteSeriesTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteTextTarget, setDeleteTextTarget] = useState<{ id: string; title: string } | null>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Simulate data loading with 2-second delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }

    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSortOpen]);

  // Sort texts based on selected option
  const sortedTexts = useMemo(() => {
    if (!seriesData) return [];
    const texts = [...seriesData.texts];

    switch (sortBy) {
      case 'title-asc':
        texts.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'progress-desc':
        texts.sort((a, b) => b.knownPercentage - a.knownPercentage);
        break;
      case 'progress-asc':
        texts.sort((a, b) => a.knownPercentage - b.knownPercentage);
        break;
      case 'recent':
        // Simple sorting by lastRead string (in real app, would use dates)
        texts.sort((a, b) => {
          const getOrder = (str: string) => {
            if (str.includes('day ago')) return parseInt(str) || 1;
            if (str.includes('days ago')) return parseInt(str) || 2;
            if (str.includes('week ago')) return 7;
            if (str.includes('weeks ago')) return parseInt(str) * 7 || 14;
            if (str.includes('month ago')) return 30;
            if (str.includes('months ago')) return parseInt(str) * 30 || 60;
            return 999;
          };
          return getOrder(a.lastRead) - getOrder(b.lastRead);
        });
        break;
    }

    return texts;
  }, [seriesData.texts, sortBy]);

  const handleTitleUpdate = (newTitle: string) => {
    setSeriesName(newTitle);
    console.log('Updated series title:', newTitle);
    // TODO: Update via API
  };

  const handleAddText = () => {
    console.log('Add new text to series:', id);
    // TODO: Implement add text modal
  };

  const handleImport = () => {
    console.log('Import texts to series:', id);
    // TODO: Implement import modal
  };

  const handleConfirmDeleteSeries = () => {
    if (deleteSeriesTarget) {
      console.log('Deleted series:', deleteSeriesTarget.id);
      // TODO: Implement actual delete via API
      setDeleteSeriesTarget(null);
      router.push('/series');
    }
  };

  const handleConfirmDeleteText = () => {
    if (deleteTextTarget) {
      console.log('Deleted text:', deleteTextTarget.id);
      // TODO: Implement actual delete via API
      setDeleteTextTarget(null);
    }
  };

  const sortOptions = [
    { value: 'title-asc', label: 'Title (A-Z)' },
    { value: 'progress-desc', label: 'Progress (High-Low)' },
    { value: 'progress-asc', label: 'Progress (Low-High)' },
    { value: 'recent', label: 'Recently Read' },
  ] as const;

  const currentSortLabel = sortOptions.find((opt) => opt.value === sortBy)?.label;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Series Header */}
        {!isLoading && seriesData && (
          <SeriesHeader
            id={seriesData.id}
            name={seriesName}
            description={seriesData.description}
            textCount={seriesData.textCount}
            totalWords={seriesData.totalWords}
            overallProgress={seriesData.overallProgress}
            lastUpdated={seriesData.lastUpdated}
            onTitleUpdate={handleTitleUpdate}
            onDelete={setDeleteSeriesTarget}
          />
        )}

        {/* Action Buttons Row */}
        {!isLoading && (
          <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="primary"
            size="lg"
            leftIcon={<Plus size={18} strokeWidth={2} />}
            onClick={handleAddText}
            className="sm:flex-1"
          >
            Add Text
          </Button>
          <Button
            variant="secondary"
            size="lg"
            leftIcon={<Upload size={18} strokeWidth={1.5} />}
            onClick={handleImport}
            className="sm:flex-1"
          >
            Import
          </Button>

          {/* Sort Dropdown */}
          <div ref={sortRef} className="relative sm:flex-1">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="w-full justify-between rounded"
            >
              <span className="text-muted text-ui-sm">Sort:</span>
              <span className="flex-1 text-left">{currentSortLabel}</span>
              <ChevronDown size={16} className="text-muted" strokeWidth={2} />
            </Button>

            {isSortOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-paper border border-border rounded-card shadow-modal overflow-hidden z-10">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setIsSortOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left font-sans text-ui-base transition-colors ${
                      sortBy === option.value
                        ? 'bg-primary text-white font-medium'
                        : 'text-ink hover:bg-desk'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Texts Grid, Loading State, or Empty State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <TextCardSkeleton key={i} />
            ))}
          </div>
        ) : sortedTexts.length === 0 ? (
          <EmptyState
            illustration="books"
            title="No texts in this series"
            description="Add your first text to start building your collection and tracking your progress"
            primaryAction={{
              label: "Add Text",
              onClick: handleAddText,
              icon: <Plus size={18} strokeWidth={2} />,
            }}
            secondaryAction={{
              label: "Import Texts",
              onClick: handleImport,
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTexts.map((text) => (
              <TextCard
                key={text.id}
                id={text.id}
                title={text.title}
                wordCount={text.wordCount}
                knownPercentage={text.knownPercentage}
                lastRead={text.lastRead}
                preview={text.preview}
                onDelete={setDeleteTextTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete series confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteSeriesTarget !== null}
        onClose={() => setDeleteSeriesTarget(null)}
        onConfirm={handleConfirmDeleteSeries}
        title="Delete Series"
        message={`Are you sure you want to delete "${deleteSeriesTarget?.name}"? All texts in this series will also be deleted. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Delete text confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteTextTarget !== null}
        onClose={() => setDeleteTextTarget(null)}
        onConfirm={handleConfirmDeleteText}
        title="Delete Text"
        message={`Are you sure you want to delete "${deleteTextTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
