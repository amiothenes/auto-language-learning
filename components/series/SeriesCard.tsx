'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Content, Muted } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MoreVertical, BookOpen, Edit, Trash2, Plus } from 'lucide-react';

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
  onDelete?: (series: { id: string; name: string }) => void;
  onEdit?: (series: { id: string; name: string; description: string }) => void;
  onAddText?: (series: { id: string; name: string }) => void;
}

export function SeriesCard({
  id,
  name,
  description,
  textCount,
  progress,
  lastUpdated,
  onDelete,
  onEdit,
  onAddText,
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
    setIsMenuOpen(false);

    if (action === 'edit' && onEdit) {
      onEdit({ id, name, description });
    }
    if (action === 'add-text' && onAddText) {
      onAddText({ id, name });
    }
    if (action === 'delete' && onDelete) {
      onDelete({ id, name });
    }
  };

  return (
    <Card
      variant="interactive"
      padding="md"
      onClick={handleCardClick}
      className="relative"
    >
      {/* Header: Series Name + Menu Button */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <Content size="lg" weight="semibold" className="flex-1 line-clamp-1">
          {name}
        </Content>
        
        {/* Menu Button - Always visible on mobile, hover-only on desktop */}
        <div ref={menuRef} className="relative">
          <button
            onClick={handleMenuToggle}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-desk transition-all shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer"
            aria-label="Series options"
          >
            <MoreVertical size={18} className="text-ink" strokeWidth={2} />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-paper border border-border rounded-card shadow-modal overflow-hidden z-10">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Edit size={16} className="text-muted" strokeWidth={1.5} />}
                onClick={(e) => handleMenuAction(e, 'edit')}
                className="w-full px-4 py-3 text-left rounded-none justify-start"
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Plus size={16} className="text-muted" strokeWidth={1.5} />}
                onClick={(e) => handleMenuAction(e, 'add-text')}
                className="w-full px-4 py-3 text-left rounded-none justify-start"
              >
                Add Text
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Trash2 size={16} className="text-muted" strokeWidth={1.5} />}
                onClick={(e) => handleMenuAction(e, 'delete')}
                className="w-full px-4 py-3 text-left rounded-none justify-start"
              >
                Delete
              </Button>
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
          <Muted size="xs">{textCount} {textCount === 1 ? 'text' : 'texts'}</Muted>
        </div>
        <Muted size="xs" className="text-primary font-medium">
          {progress}% complete
        </Muted>
      </div>

      {/* Progress Bar */}
      <ProgressBar value={progress} className="mb-3" />

      {/* Last Updated */}
      <Muted size="xs">Updated {lastUpdated}</Muted>
    </Card>
  );
}
