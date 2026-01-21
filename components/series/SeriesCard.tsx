'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Content, Muted } from '@/components/ui/Typography';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MoreVertical, BookOpen, Edit, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// SeriesCard Component
// Displays a series card with name, description, progress, and actions menu
// ============================================================================

interface SeriesCardProps {
  id: string;
  name: string;
  description: string;
  textCount: number;
  progress: number;
  lastUpdated: string;
}

export function SeriesCard({
  id,
  name,
  description,
  textCount,
  progress,
  lastUpdated,
}: SeriesCardProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  const handleCardClick = () => {
    router.push(`/series/${id}`);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    console.log(`${action} series:`, id);
    setIsMenuOpen(false);
    // TODO: Implement actual actions
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative bg-paper border border-border rounded-card shadow-raised p-6 hover:shadow-raised-hover hover:bg-desk transition-all cursor-pointer active:translate-y-px group"
    >
      {/* Header: Series Name + Menu Button */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <Content size="lg" weight="semibold" className="flex-1 line-clamp-1">
          {name}
        </Content>
        
        {/* Hover Menu Button */}
        <div ref={menuRef} className="relative">
          <button
            onClick={handleMenuToggle}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-desk transition-all"
            aria-label="Series options"
          >
            <MoreVertical size={18} className="text-muted" strokeWidth={1.5} />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-paper border border-border rounded-card shadow-modal overflow-hidden z-10">
              <button
                onClick={(e) => handleMenuAction(e, 'edit')}
                className="w-full px-4 py-3 text-left font-sans text-ui-sm text-ink hover:bg-desk transition-colors flex items-center gap-3"
              >
                <Edit size={16} className="text-muted" strokeWidth={1.5} />
                Edit
              </button>
              <button
                onClick={(e) => handleMenuAction(e, 'add-text')}
                className="w-full px-4 py-3 text-left font-sans text-ui-sm text-ink hover:bg-desk transition-colors flex items-center gap-3"
              >
                <Plus size={16} className="text-muted" strokeWidth={1.5} />
                Add Text
              </button>
              <button
                onClick={(e) => handleMenuAction(e, 'delete')}
                className="w-full px-4 py-3 text-left font-sans text-ui-sm text-ink hover:bg-desk transition-colors flex items-center gap-3"
              >
                <Trash2 size={16} className="text-muted" strokeWidth={1.5} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <Muted size="sm" className="mb-4 line-clamp-2 h-[2.4rem]">
        {description}
      </Muted>

      {/* Metadata Row */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <BookOpen size={14} className="text-muted" strokeWidth={1.5} />
          <Muted size="xs">{textCount} texts</Muted>
        </div>
        <Muted size="xs" className="text-primary font-medium">
          {progress}% complete
        </Muted>
      </div>

      {/* Progress Bar */}
      <ProgressBar value={progress} className="mb-3" />

      {/* Last Updated */}
      <Muted size="xs">Updated {lastUpdated}</Muted>
    </div>
  );
}
