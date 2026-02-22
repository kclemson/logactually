import { format, parseISO, isValid } from 'date-fns';

const STORAGE_KEY = 'selectedDate';
const SWIPE_DIR_KEY = 'swipeDirection';

/**
 * Read the persisted date from localStorage.
 * Returns null if missing, invalid, or in the future.
 */
export function getStoredDate(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = parseISO(stored);
    if (!isValid(parsed)) return null;
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

/**
 * Write the swipe direction hint to sessionStorage.
 * Call this before triggering navigation so the newly-mounted
 * content component can read which direction to animate from.
 */
export function setSwipeDirection(dir: 'left' | 'right' | null): void {
  try {
    if (dir === null) {
      sessionStorage.removeItem(SWIPE_DIR_KEY);
    } else {
      sessionStorage.setItem(SWIPE_DIR_KEY, dir);
    }
  } catch {
    // sessionStorage unavailable -- silently ignore
  }
}

/**
 * Read (and consume) the swipe direction hint from sessionStorage.
 */
export function getSwipeDirection(): 'left' | 'right' | null {
  try {
    const val = sessionStorage.getItem(SWIPE_DIR_KEY);
    if (val === 'left' || val === 'right') return val;
    return null;
  } catch {
    return null;
  }
}
