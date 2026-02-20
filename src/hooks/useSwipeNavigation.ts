import { useRef, useCallback } from 'react';

const MIN_SWIPE_X = 40;
const MAX_SWIPE_Y_RATIO = 0.6;

const INTERACTIVE_SELECTORS = 'input, button, select, textarea, [role="dialog"], [role="listbox"], [role="option"], a';

export function useSwipeNavigation(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  disabled = false,
) {
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const cancelled = useRef<boolean>(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) {
      cancelled.current = true;
      return;
    }
    // Cancel if touch begins on an interactive element
    const target = e.target as Element;
    if (target.closest(INTERACTIVE_SELECTORS)) {
      cancelled.current = true;
      return;
    }
    cancelled.current = false;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, [disabled]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (cancelled.current) return;
    const dx = Math.abs(e.touches[0].clientX - startX.current);
    const dy = Math.abs(e.touches[0].clientY - startY.current);
    // If vertical movement dominates early, cancel the gesture and allow scroll
    if (dy > dx && dy > 10) {
      cancelled.current = true;
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (cancelled.current) return;
    const deltaX = e.changedTouches[0].clientX - startX.current;
    const deltaY = e.changedTouches[0].clientY - startY.current;
    const absDX = Math.abs(deltaX);
    const absDY = Math.abs(deltaY);

    if (absDX < MIN_SWIPE_X) return;
    if (absDY / absDX > MAX_SWIPE_Y_RATIO) return;

    if (deltaX < 0) {
      onSwipeLeft();
    } else {
      onSwipeRight();
    }
  }, [onSwipeLeft, onSwipeRight]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
