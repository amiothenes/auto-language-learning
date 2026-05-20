'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// StatusUpdateFeedback Component
// Toast-style feedback for vocabulary status changes with animated stats
// ============================================================================

interface StatusUpdateFeedbackProps {
  isVisible: boolean;
  message: string;
  oldStats: { knownWords: number; textProgress: number };
  newStats: { knownWords: number; textProgress: number };
  isMilestone: boolean;
  onDismiss: () => void;
}

export function StatusUpdateFeedback({
  isVisible,
  message,
  oldStats,
  newStats,
  isMilestone,
  onDismiss,
}: StatusUpdateFeedbackProps) {
  const [animatedKnownWords, setAnimatedKnownWords] = useState(oldStats.knownWords);
  const [animatedProgress, setAnimatedProgress] = useState(oldStats.textProgress);
  const [isExiting, setIsExiting] = useState(false);

  // Calculate deltas
  const knownWordsDelta = newStats.knownWords - oldStats.knownWords;
  const progressDelta = newStats.textProgress - oldStats.textProgress;

  // Keep a stable ref to onDismiss so the animation effect never re-runs just
  // because the parent recreated the callback (stale-closure guard).
  const onDismissRef = useRef(onDismiss);
  useEffect(() => { onDismissRef.current = onDismiss; });

  useEffect(() => {
    if (!isVisible) return;

    // Reset animation state
    setAnimatedKnownWords(oldStats.knownWords);
    setAnimatedProgress(oldStats.textProgress);
    setIsExiting(false);

    // Animate numbers with delay
    const animationDelay = setTimeout(() => {
      const duration = 500; // 500ms animation
      const steps = 30;
      const stepDuration = duration / steps;

      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;

        // Easing function (ease-out)
        const easedProgress = 1 - Math.pow(1 - progress, 3);

        // Interpolate values
        const newKnownWords = Math.round(
          oldStats.knownWords + (newStats.knownWords - oldStats.knownWords) * easedProgress
        );
        const newProgress = Math.round(
          oldStats.textProgress + (newStats.textProgress - oldStats.textProgress) * easedProgress
        );

        setAnimatedKnownWords(newKnownWords);
        setAnimatedProgress(newProgress);

        if (currentStep >= steps) {
          clearInterval(interval);
        }
      }, stepDuration);

      return () => clearInterval(interval);
    }, 300); // Start animation after 300ms

    // Auto-dismiss after 3 seconds
    const dismissTimeout = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismissRef.current(), 200); // Wait for fade-out animation
    }, 3000);

    return () => {
      clearTimeout(animationDelay);
      clearTimeout(dismissTimeout);
    };
  }, [isVisible, oldStats.knownWords, oldStats.textProgress, newStats.knownWords, newStats.textProgress]);

  // Sparkle particle positions (semicircle above toast)
  const sparkles = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 9) * Math.PI; // 0 to PI (semicircle)
    const radius = 80;
    const x = Math.cos(angle) * radius;
    const y = -Math.sin(angle) * radius - 20; // Offset upward
    const delay = i * 80; // Stagger animations

    return { x, y, delay };
  });

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-6 md:bottom-8 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50',
        'bg-paper border border-border rounded-xl px-6 py-4',
        'shadow-modal',
        'md:max-w-md md:w-full',
        isExiting ? 'animate-fade-out' : 'animate-fade-slide-up animate-pulse-green'
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Sparkle particles for milestones */}
      {isMilestone && (
        <div className="absolute inset-0 overflow-visible pointer-events-none">
          {sparkles.map((sparkle, i) => (
            <svg
              key={i}
              className="absolute animate-sparkle"
              style={{
                left: '50%',
                top: '50%',
                marginLeft: sparkle.x,
                marginTop: sparkle.y,
                animationDelay: `${sparkle.delay}ms`,
              }}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
            >
              <polygon
                points="6,0 7.5,4.5 12,6 7.5,7.5 6,12 4.5,7.5 0,6 4.5,4.5"
                fill="#183A37"
                opacity="0.8"
              />
            </svg>
          ))}
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Success Icon */}
        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
          <CheckCircle2 size={18} className="text-primary" strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Message */}
          <p className="font-sans text-ui-base text-ink font-medium">
            {message}
          </p>

          {/* Stats Display */}
          <div className="space-y-1">
            {/* Known Words Change */}
            {knownWordsDelta !== 0 && (
              <div className="font-sans text-ui-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span>Known words:</span>
                  <span className="font-serif text-ui-base text-ink font-semibold tabular-nums">
                    {animatedKnownWords.toLocaleString()}
                  </span>
                  {knownWordsDelta > 0 && (
                    <span className="text-primary font-medium">
                      (+{knownWordsDelta})
                    </span>
                  )}
                  {knownWordsDelta < 0 && (
                    <span className="text-muted font-medium">
                      ({knownWordsDelta})
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Text Progress Change */}
            {progressDelta !== 0 && (
              <div className="font-sans text-ui-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span>Text progress:</span>
                  <span className="font-serif text-ui-base text-ink font-semibold tabular-nums">
                    {animatedProgress}%
                  </span>
                  {progressDelta > 0 && (
                    <span className="text-primary font-medium">
                      (+{progressDelta}%)
                    </span>
                  )}
                  {progressDelta < 0 && (
                    <span className="text-muted font-medium">
                      ({progressDelta}%)
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Milestone Message */}
          {isMilestone && (
            <p className="font-sans text-ui-sm text-primary font-medium flex items-center gap-1.5">
              <span>🎉</span>
              <span>Milestone reached!</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
