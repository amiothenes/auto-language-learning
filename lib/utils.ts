/**
 * Utility function to merge class names
 * @param classes - Variable number of class name strings
 * @returns Merged class names with falsy values filtered out
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
