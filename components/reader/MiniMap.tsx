'use client';

import { useState, useRef } from 'react';
import { Muted } from '@/components/ui/Typography';
import { cn } from '@/lib/utils';

// ============================================================================
// MiniMap Component
// Compact segmented progress bar with detailed popup on hover/click
// ============================================================================

interface MiniMapProps {
  paragraphs: Array<{
    id: string;
    progress: number; // 0-100
  }>;
  currentParagraphIndex: number;
  onBarClick: (index: number) => void;
}

export function MiniMap({ 
  paragraphs, 
  currentParagraphIndex, 
  onBarClick 
}: MiniMapProps) {
  
  const [showDetails, setShowDetails] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle mouse enter - show popup immediately and clear any hide timeout
  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowDetails(true);
  };
  
  // Handle mouse leave - hide popup after a delay
  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setShowDetails(false);
    }, 300); // 300ms delay before hiding
  };
  
  /**
   * Calculate progress-based color with red-to-green gradient
   * @param percentage Progress percentage (0-100)
   * @returns CSS color string
   */
  const getProgressColor = (percentage: number): string => {
    if (percentage === 0) return '#DD3C3C'; // Red (NEWLY_SEEN)
    if (percentage < 40) return '#E57A3C'; // Red-orange
    if (percentage < 70) return '#EEBD2B'; // Orange (FAMILIAR)
    if (percentage < 90) return '#8BC34A'; // Yellow-green
    return '#29A35C'; // Green (KNOWN)
  };

  // Calculate overall reading progress
  const overallProgress = Math.round(
    paragraphs.reduce((sum, p) => sum + p.progress, 0) / paragraphs.length
  );

  return (
    <div className="pt-3 border-t border-border">
      <div className="mb-2 flex items-center justify-between">
        <Muted className="text-ui-xs">Reading Progress</Muted>
        <Muted className="text-ui-xs text-primary font-medium">
          {overallProgress}% • ¶{currentParagraphIndex + 1}/{paragraphs.length}
        </Muted>
      </div>
      
      {/* Segmented Progress Bar */}
      <div className="relative">
        <div 
          className="h-2 flex rounded-full overflow-hidden border border-border cursor-pointer hover:h-2.5 transition-all"
          onClick={() => setShowDetails(!showDetails)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {paragraphs.map((para, index) => {
            const isActive = index === currentParagraphIndex;
            
            return (
              <button
                key={para.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onBarClick(index);
                }}
                className={cn(
                  "transition-all hover:brightness-110",
                  isActive && "ring-2 ring-primary ring-inset"
                )}
                style={{ 
                  width: `${100 / paragraphs.length}%`,
                  backgroundColor: getProgressColor(para.progress),
                  opacity: isActive ? 1 : 0.8,
                }}
                aria-label={`Paragraph ${index + 1}, ${para.progress}% complete`}
              />
            );
          })}
        </div>

        {/* Detailed Popup */}
        {showDetails && (
          <div 
            className="absolute top-full left-0 right-0 mt-2 bg-paper border border-border rounded-lg shadow-modal z-50 p-3 max-h-64 overflow-y-auto"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="space-y-1.5">
              {paragraphs.map((para, index) => {
                const isActive = index === currentParagraphIndex;
                
                return (
                  <button
                    key={para.id}
                    onClick={() => {
                      onBarClick(index);
                      setShowDetails(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-desk transition-colors text-left",
                      isActive && "bg-desk ring-1 ring-primary"
                    )}
                  >
                    <span className={cn(
                      "font-sans text-ui-xs font-medium min-w-[32px]",
                      isActive ? "text-primary" : "text-muted"
                    )}>
                      ¶{index + 1}
                    </span>
                    <div className="flex-1 h-1.5 bg-desk rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all"
                        style={{ 
                          width: `${para.progress}%`,
                          backgroundColor: getProgressColor(para.progress)
                        }}
                      />
                    </div>
                    <span className={cn(
                      "font-sans text-ui-xs font-medium min-w-[36px] text-right",
                      isActive ? "text-ink" : "text-muted"
                    )}>
                      {para.progress}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      <Muted className="text-ui-xs mt-1.5 text-center">
        Hover for details
      </Muted>
    </div>
  );
}
