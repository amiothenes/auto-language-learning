'use client';

import Link from 'next/link';
import { Heading, Muted } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MiniMap } from './MiniMap';
import { 
  ChevronLeft, 
  BookOpen, 
  Library, 
  Download, 
  Settings 
} from 'lucide-react';

// ============================================================================
// TextInfo Component
// Displays text metadata, progress, series info, tags, and actions in the
// reader's left sidebar
// ============================================================================

interface TextInfoProps {
  title: string;
  wordCount: number;
  uniqueWordCount: number;
  viewCount: number;
  knownPercentage: number;
  seriesId: string;
  seriesName: string;
  tags: string[];
  paragraphProgress: Array<{ id: string; progress: number }>;
  currentParagraphIndex: number;
  onParagraphNavigate: (index: number) => void;
  onRightPanelToggle?: () => void;
  isRightPanelOpen?: boolean;
}

export function TextInfo({
  title,
  wordCount,
  uniqueWordCount,
  viewCount,
  knownPercentage,
  seriesId,
  seriesName,
  tags,
  paragraphProgress,
  currentParagraphIndex,
  onParagraphNavigate,
  onRightPanelToggle,
  isRightPanelOpen = false,
}: TextInfoProps) {
  
  const handleExport = () => {
    console.log('Export text:', title);
    // TODO: Implement export functionality
  };

  const handleSettings = () => {
    console.log('Open settings for text:', title);
    // TODO: Implement settings modal
  };

  return (
    <div className="p-6 space-y-6 h-full">
      {/* Back Navigation */}
      <Link 
        href={`/series/${seriesId}`}
        className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-sans text-ui-base font-medium"
      >
        <ChevronLeft size={18} strokeWidth={2} />
        <span>Back to Series</span>
      </Link>

      {/* Text Title */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-muted">
          <BookOpen size={16} strokeWidth={1.5} />
          <span className="font-sans text-ui-sm uppercase tracking-wide">Reading</span>
        </div>
        <Heading size="lg" as="h1" className="font-serif">
          {title}
        </Heading>
      </div>

      {/* Series Info */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center gap-2 mb-2">
          <Library size={14} strokeWidth={1.5} className="text-muted" />
          <Muted className="text-ui-xs">Series</Muted>
        </div>
        <Link 
          href={`/series/${seriesId}`}
          className="font-sans text-ui-base text-primary hover:text-primary/80 transition-colors font-medium"
        >
          {seriesName}
        </Link>
      </div>

      {/* Progress Section */}
      <div className="pt-4 border-t border-border space-y-3">
        <div>
          <Muted className="text-ui-xs mb-1">Reading Progress</Muted>
          <Heading size="sm" as="h3" className="text-primary">
            {knownPercentage}% Known
          </Heading>
          <ProgressBar 
            value={knownPercentage} 
            className="mt-2"
          />
        </div>
      </div>

      {/* Statistics Section */}
      <div className="pt-4 border-t border-border space-y-2">
        <Muted className="text-ui-xs mb-2">Text Statistics</Muted>
        <div className="flex justify-between items-center">
          <span className="font-sans text-ui-sm text-muted">Total Words</span>
          <span className="font-sans text-ui-base text-ink font-medium">
            {wordCount.toLocaleString('en-US')}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-sans text-ui-sm text-muted">Unique Words</span>
          <span className="font-sans text-ui-base text-ink font-medium">
            {uniqueWordCount.toLocaleString('en-US')}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-sans text-ui-sm text-muted">Times Read</span>
          <span className="font-sans text-ui-base text-ink font-medium">
            {viewCount}
          </span>
        </div>
      </div>

      {/* Mini Map */}
      <MiniMap
        paragraphs={paragraphProgress}
        currentParagraphIndex={currentParagraphIndex}
        onBarClick={onParagraphNavigate}
      />

      {/* Tags Section */}
      {tags.length > 0 && (
        <div className="pt-4 border-t border-border">
          <Muted className="text-ui-xs mb-2">Tags</Muted>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-desk border border-border rounded-full font-sans text-ui-xs text-ink"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-4 border-t border-border flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Download size={16} strokeWidth={1.5} />}
          onClick={handleExport}
          className="flex-1"
        >
          Export
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Settings size={16} strokeWidth={1.5} />}
          onClick={handleSettings}
          className="flex-1"
        >
          Settings
        </Button>
      </div>

      {/* Toggle Word Details Panel (Desktop only) */}
      {onRightPanelToggle && (
        <div className="pt-4 border-t border-border hidden md:block">
          <Button
            variant={isRightPanelOpen ? "primary" : "secondary"}
            size="md"
            onClick={onRightPanelToggle}
            className="w-full"
          >
            {isRightPanelOpen ? 'Hide' : 'Show'} Word Details
          </Button>
        </div>
      )}
    </div>
  );
}
