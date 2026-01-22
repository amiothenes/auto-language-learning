'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Content, Heading, Muted } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ArrowLeft, Edit2, Check, X, FileText, Type, Clock, MoreVertical, Edit, Trash2 } from 'lucide-react';

// ============================================================================
// SeriesHeader Component
// Header with back navigation, editable title, stats, and progress bar
// ============================================================================

interface SeriesHeaderProps {
  id: string;
  name: string;
  description: string;
  textCount: number;
  totalWords: number;
  overallProgress: number;
  lastUpdated: string;
  onTitleUpdate: (newTitle: string) => void;
}

export function SeriesHeader({
  id,
  name,
  description,
  textCount,
  totalWords,
  overallProgress,
  lastUpdated,
  onTitleUpdate,
}: SeriesHeaderProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(name);
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

  const handleBackClick = () => {
    router.push('/series');
  };

  const handleEditClick = () => {
    setEditedTitle(name);
    setIsEditing(true);
    setIsMenuOpen(false);
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuAction = (action: string) => {
    console.log(`${action} series:`, id);
    setIsMenuOpen(false);
    
    if (action === 'edit') {
      handleEditClick();
    }
    // TODO: Implement other actions
  };

  const handleSave = () => {
    if (editedTitle.trim()) {
      onTitleUpdate(editedTitle.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedTitle(name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="md"
        leftIcon={<ArrowLeft size={18} strokeWidth={2} />}
        onClick={handleBackClick}
        className="rounded"
      >
        Back to Series
      </Button>

      {/* Title Section */}
      <div className="space-y-3">
        {isEditing ? (
          // Edit Mode
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-4 py-3 bg-paper border border-border rounded font-serif text-2xl md:text-3xl text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              autoFocus
            />
            <Button
              variant="primary"
              size="md"
              iconOnly
              onClick={handleSave}
              className="rounded shrink-0"
              aria-label="Save title"
            >
              <Check size={20} strokeWidth={2} />
            </Button>
            <Button
              variant="secondary"
              size="md"
              iconOnly
              onClick={handleCancel}
              className="rounded shrink-0"
              aria-label="Cancel editing"
            >
              <X size={20} strokeWidth={2} />
            </Button>
          </div>
        ) : (
          // Display Mode
          <div className="flex items-start gap-3 group">
            <Content size="2xl" weight="semibold" className="flex-1">
              {name}
            </Content>
            
            {/* Hover Menu Button */}
            <div ref={menuRef} className="relative">
              <button
                onClick={handleMenuToggle}
                className="p-2 rounded hover:bg-desk transition-all shrink-0 cursor-pointer"
                aria-label="Series options"
              >
                <MoreVertical size={20} className="text-ink" strokeWidth={2} />
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-paper border border-border rounded-card shadow-modal overflow-hidden z-10">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Edit size={16} className="text-muted" strokeWidth={1.5} />}
                    onClick={() => handleMenuAction('edit')}
                    className="w-full px-4 py-3 text-left rounded-none justify-start"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Trash2 size={16} className="text-muted" strokeWidth={1.5} />}
                    onClick={() => handleMenuAction('delete')}
                    className="w-full px-4 py-3 text-left rounded-none justify-start"
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {description && (
          <Muted size="base" className="max-w-3xl">
            {description}
          </Muted>
        )}
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap items-center gap-4 md:gap-6">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-muted" strokeWidth={1.5} />
          <Muted size="sm">
            <span className="font-medium text-ink">{textCount}</span> texts
          </Muted>
        </div>
        <div className="flex items-center gap-2">
          <Type size={18} className="text-muted" strokeWidth={1.5} />
          <Muted size="sm">
            <span className="font-medium text-ink">{totalWords.toLocaleString('en-US')}</span> words
          </Muted>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-muted" strokeWidth={1.5} />
          <Muted size="sm">Updated {lastUpdated}</Muted>
        </div>
      </div>

      {/* Progress Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Heading size="sm" as="h3">
            Overall Progress
          </Heading>
          <Heading size="sm" as="h3" className="text-primary">
            {overallProgress}%
          </Heading>
        </div>
        <ProgressBar value={overallProgress} />
      </div>
    </div>
  );
}
