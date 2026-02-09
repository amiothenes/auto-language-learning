'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// ImageWithFallback Component
// Next.js Image with error handling and fallback UI
// Use for external images or user-uploaded content (not local static assets)
// ============================================================================

interface ImageWithFallbackProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
  showIcon?: boolean;
}

export function ImageWithFallback({
  src,
  alt,
  fallbackSrc,
  showIcon = true,
  className,
  ...props
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      // Try fallback image first
      setCurrentSrc(fallbackSrc);
    } else {
      // Show placeholder
      setError(true);
    }
  };

  if (error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-desk border border-border rounded',
          className
        )}
        role="img"
        aria-label={alt}
      >
        {showIcon && <ImageOff size={24} className="text-muted" strokeWidth={1.5} />}
      </div>
    );
  }

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={handleError}
      className={className}
    />
  );
}
