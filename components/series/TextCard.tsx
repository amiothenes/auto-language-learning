'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Content, Muted } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MoreVertical, FileText, Edit, Trash2 } from 'lucide-react';

// ============================================================================
// TextCard Component
// Displays an individual text card with title, stats, preview, and actions
// ============================================================================

interface TextCardProps {
  id: string;
  title: string;
  wordCount: number;
  knownPercentage: number;
  lastRead: string;
  preview: string;
  onDelete?: (text: { id: string; title: string }) => void;
}

export function TextCard({
  id,
  title,
  wordCount,
  knownPercentage,
  lastRead,
  preview,
  onDelete,
}: TextCardProps) {
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
    router.push(`/reader/${id}`);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    setIsMenuOpen(false);

    if (action === 'delete' && onDelete) {
      onDelete({ id, title });
    }
  };

  return (
    <Card
      variant="interactive"
      padding="md"
      onClick={handleCardClick}
      className="relative"
    >
      {/* Header: Text Title + Menu Button */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <Content size="lg" weight="semibold" className="flex-1 line-clamp-1">
          {title}
        </Content>
        
        {/* Menu Button - Always visible on mobile, hover-only on desktop */}
        <div ref={menuRef} className="relative">
          <button
            onClick={handleMenuToggle}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-desk transition-all shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer"
            aria-label="Text options"
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

      {/* Preview Snippet */}
      <Content size="sm" className="mb-4 line-clamp-2 h-[2.8rem] text-muted">
        {preview}
      </Content>

      {/* Metadata Row */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <FileText size={14} className="text-muted" strokeWidth={1.5} />
          <Muted size="xs">{wordCount.toLocaleString('en-US')} words</Muted>
        </div>
        <Muted size="xs" className="text-primary font-medium">
          {knownPercentage}% known
        </Muted>
      </div>

      {/* Progress Bar */}
      <ProgressBar value={knownPercentage} className="mb-3" />

      {/* Last Read */}
      <Muted size="xs">Last read {lastRead}</Muted>
    </Card>
  );
}
