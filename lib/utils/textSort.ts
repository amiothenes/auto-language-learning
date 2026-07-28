interface RecentlyReadFields {
  hasBeenRead: boolean;
  lastReadAt: string;
  order: number;
}

/**
 * Comparator for the "Recently Read" text sort. Read texts come first (most
 * recently read first); never-read texts come after as a group, in creation
 * sequence (oldest first) so bulk-imported parts stay in order — `order` breaks
 * ties when multiple texts share a `createdAt` (e.g. chunks of one import).
 */
export function compareByRecentlyRead(a: RecentlyReadFields, b: RecentlyReadFields): number {
  if (a.hasBeenRead !== b.hasBeenRead) return a.hasBeenRead ? -1 : 1;
  if (a.hasBeenRead) {
    return new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime();
  }
  const createdDiff = new Date(a.lastReadAt).getTime() - new Date(b.lastReadAt).getTime();
  return createdDiff !== 0 ? createdDiff : a.order - b.order;
}
