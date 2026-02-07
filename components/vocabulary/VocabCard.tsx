'use client';

import { useState, useEffect, useRef } from 'react';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { VocabularyStatus } from '@/components/reader/Word';
import { Content, Muted } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { VocabularyItem } from './VocabTable';
import { cn } from '@/lib/utils';

// ============================================================================
// Status Badge Configuration
// ============================================================================

const STATUS_CONFIG = {
  [VocabularyStatus.NEWLY_SEEN]: {
    label: 'Newly Seen',
    bgColor: 'hsla(0, 70%, 55%, 0.6)',
    textColor: '#8B2020',
  },
  [VocabularyStatus.FAMILIAR]: {
    label: 'Familiar',
    bgColor: 'hsla(45, 85%, 55%, 0.6)',
    textColor: '#8B6914',
  },
  [VocabularyStatus.KNOWN]: {
    label: 'Known',
    bgColor: 'hsla(145, 60%, 40%, 0.5)',
    textColor: '#1E6B3E',
  },
  [VocabularyStatus.WELL_KNOWN]: {
    label: 'Well Known',
    bgColor: 'hsla(145, 60%, 40%, 0.3)',
    textColor: '#1E6B3E',
  },
  [VocabularyStatus.IGNORE]: {
    label: 'Ignored',
    bgColor: 'hsla(0, 0%, 50%, 0.2)',
    textColor: '#6E6D6A',
  },
};

// ============================================================================
// VocabCard Component
// ============================================================================

interface VocabCardProps {
  item: VocabularyItem;
  isSelected: boolean;
  onToggle: () => void;
  onDelete?: (item: VocabularyItem) => void;
  isMultiSelectActive?: boolean;
  onEnableMultiSelect?: () => void;
}

export function VocabCard({
  item,
  isSelected,
  onToggle,
  onDelete,
  isMultiSelectActive = false,
  onEnableMultiSelect
}: VocabCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

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

  // Long press detection (mobile only)
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only on mobile (< 768px)
    if (window.innerWidth >= 768) return;

    // Don't trigger if touching the menu button
    const target = e.target as HTMLElement;
    if (target.closest('button[aria-label="Options"]')) return;

    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(true);
      // Enable multi-select mode in parent
      onEnableMultiSelect?.();
      // Select this card
      onToggle();
      // Haptic feedback (if available)
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsLongPressing(false);
  };

  const handleTouchMove = () => {
    // Cancel long press if user moves finger (scrolling)
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsLongPressing(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't handle if clicking the menu or checkbox
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input[type="checkbox"]')) {
      return;
    }

    // Mobile: tap to select and enable multi-select mode
    if (window.innerWidth < 768) {
      e.preventDefault();
      // If multi-select isn't active yet, activate it
      if (!isMultiSelectActive) {
        onEnableMultiSelect?.();
      }
      // Toggle selection
      onToggle();
      return;
    }

    // Desktop: normal click behavior (could navigate to details page in future)
    console.log('Card clicked:', item.id);
  };

  const handleMenuAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (action === 'delete') {
      onDelete?.(item);
    } else {
      console.log(`${action} vocabulary:`, item.id);
    }
  };

  const config = STATUS_CONFIG[item.status];

  return (
    <Card
      variant="default"
      padding="sm"
      onClick={handleCardClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      className={cn(
        'relative transition-all p-2.5! md:p-2!',
        isSelected
          ? 'border-2 border-primary shadow-raised'
          : 'border-2 border-transparent',
        isLongPressing && 'scale-98 transition-transform',
        'cursor-pointer'
      )}
    >

      <div className="flex gap-2 md:gap-2.5 items-center">
        {/* Desktop: Checkbox - Vertically Centered */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="hidden md:block w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer shrink-0"
          aria-label={`Select ${item.lemma}`}
        />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row: Lemma + Status + Menu */}
          <div className="flex items-start justify-between gap-2 mb-1 md:mb-0.5">
            <div className="flex-1 min-w-0">
              <Content size="base" weight="semibold" className="line-clamp-1 leading-tight md:text-ui-base">
                {item.lemma}
              </Content>
            </div>
            <div className="flex items-center gap-1 md:gap-0.5 shrink-0">
              <span
                className="inline-flex px-1.5 py-0.5 md:px-1.5 md:py-0.5 rounded font-sans text-ui-xs font-medium whitespace-nowrap"
                style={{
                  backgroundColor: config.bgColor,
                  color: config.textColor,
                }}
              >
                {config.label}
              </span>
              <div ref={menuRef} className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-desk transition-colors cursor-pointer"
                  aria-label="Options"
                >
                  <MoreVertical size={14} className="text-muted" strokeWidth={2} />
                </button>

                {isMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 w-32 bg-paper border border-border rounded-card shadow-modal overflow-hidden z-10">
                    <button
                      onClick={(e) => handleMenuAction(e, 'edit')}
                      className="w-full px-3 py-2 text-left font-sans text-ui-xs text-ink hover:bg-desk transition-colors flex items-center gap-1.5"
                    >
                      <Edit size={12} className="text-muted" strokeWidth={1.5} />
                      Edit
                    </button>
                    <button
                      onClick={(e) => handleMenuAction(e, 'delete')}
                      className="w-full px-3 py-2 text-left font-sans text-ui-xs text-ink hover:bg-desk transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 size={12} className="text-muted" strokeWidth={1.5} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Translation */}
          <Content size="sm" className="text-ink opacity-75 mb-1.5 md:mb-1 line-clamp-1 leading-snug">
            {item.translation}
          </Content>

          {/* Bottom Row: Frequencies + Tags */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3 md:gap-2.5 text-ui-xs font-sans text-muted">
              <div className="flex items-center gap-1">
                <span className="opacity-60">Dict:</span>
                <span className="font-medium text-ink">{item.dictionaryFrequency}</span>
              </div>
              <span className="opacity-40">•</span>
              <div className="flex items-center gap-1">
                <span className="opacity-60">User:</span>
                <span className="font-medium text-ink">{item.userFrequency}x</span>
              </div>
            </div>
            
            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 bg-desk rounded font-sans text-ui-xs text-muted leading-none"
                  >
                    {tag}
                  </span>
                ))}
                {item.tags.length > 2 && (
                  <span className="px-1 text-ui-xs text-muted">
                    +{item.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// VocabCardList Component
// ============================================================================

interface VocabCardListProps {
  items: VocabularyItem[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onDelete?: (item: VocabularyItem) => void;
  isMultiSelectActive?: boolean;
  onEnableMultiSelect?: () => void;
}

export function VocabCardList({
  items,
  selectedIds,
  onToggleSelection,
  onDelete,
  isMultiSelectActive = false,
  onEnableMultiSelect,
}: VocabCardListProps) {
  if (items.length === 0) {
    return (
      <div className="bg-paper border border-border rounded-card shadow-raised py-12 text-center">
        <Muted>No vocabulary items found</Muted>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <VocabCard
          key={item.id}
          item={item}
          isSelected={selectedIds.has(item.id)}
          onToggle={() => onToggleSelection(item.id)}
          onDelete={onDelete}
          isMultiSelectActive={isMultiSelectActive}
          onEnableMultiSelect={onEnableMultiSelect}
        />
      ))}
    </div>
  );
}
