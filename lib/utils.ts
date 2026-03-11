/**
 * Utility function to merge class names
 * @param classes - Variable number of class name strings
 * @returns Merged class names with falsy values filtered out
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Formats a timestamp as a human-readable relative time string.
 * Used in API responses for lastRead, lastUpdated fields.
 *
 * @example
 * formatRelativeTime(new Date()) // "just now"
 * formatRelativeTime(oneDayAgo)  // "1 day ago"
 * formatRelativeTime(null)       // "never"
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return 'never';

  const d = typeof date === 'string' ? new Date(date) : date;
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) return 'just now';
  if (diffSeconds < 3600) {
    const mins = Math.floor(diffSeconds / 60);
    return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  if (diffSeconds < 2592000) {
    const days = Math.floor(diffSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  if (diffSeconds < 31536000) {
    const months = Math.floor(diffSeconds / 2592000);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  const years = Math.floor(diffSeconds / 31536000);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}
