import { format, parseISO, isFuture, isValid } from 'date-fns';

const STORAGE_KEY = 'selectedDate';

/**
 * Read the persisted date from localStorage.
 * Returns null if missing, invalid, or in the future.
 */
export function getStoredDate(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = parseISO(stored);
    if (!isValid(parsed) || isFuture(parsed)) return null;
    return stored;
  } catch {
    return null;
  }
}

/**
 * Persist the selected date. Clears storage if the date is today
 * (so that navigating to a new page defaults to "today" naturally).
 */
export function setStoredDate(dateStr: string): void {
  try {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (dateStr === todayStr) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, dateStr);
    }
  } catch {
    // localStorage unavailable -- silently ignore
  }
}
