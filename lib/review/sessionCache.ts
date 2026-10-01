import { todayDateString } from '@/lib/srs/today';
import type { SrsCard } from '@/lib/types/api';

// Lets the Review page survive navigating away and back (or closing the tab)
// without losing in-progress session state, which otherwise lives only in
// component state and is wiped on unmount. Scoped per language, and dropped
// once the stored day no longer matches today so a new day's session always
// reseeds fresh from the server instead of resurrecting a finished queue.
interface StoredReviewSession {
  date: string;
  sessionCards: SrsCard[];
  queue: SrsCard[];
}

function storageKey(languageId: string): string {
  return `verbista_review_session:${languageId}`;
}

export function loadReviewSession(languageId: string): Omit<StoredReviewSession, 'date'> | null {
  try {
    const raw = localStorage.getItem(storageKey(languageId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredReviewSession;
    if (parsed.date !== todayDateString()) {
      localStorage.removeItem(storageKey(languageId));
      return null;
    }
    return { sessionCards: parsed.sessionCards, queue: parsed.queue };
  } catch {
    return null;
  }
}

export function saveReviewSession(languageId: string, data: Omit<StoredReviewSession, 'date'>): void {
  try {
    const payload: StoredReviewSession = { date: todayDateString(), ...data };
    localStorage.setItem(storageKey(languageId), JSON.stringify(payload));
  } catch {
    // Quota exceeded or storage unavailable — progress just won't survive a
    // remount this time, not worth surfacing to the user.
  }
}
