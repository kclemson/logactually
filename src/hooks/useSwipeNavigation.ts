import { useRef, useCallback, useEffect } from 'react';
import { setSwipeDirection } from '@/lib/selected-date';

const MIN_SWIPE_X = 40;
const MAX_SWIPE_Y_RATIO = 0.6;
// Once the finger moves this many px horizontally, lock the gesture and prevent scroll
const HORIZONTAL_LOCK_PX = 8;
// If vertical movement exceeds this before the horizontal lock, cancel
const VERTICAL_CANCEL_PX = 10;

const INTERACTIVE_SELECTORS = 'input, button, select, textarea, [role="dialog"], [role="listbox"], [role="option"], a';

export function useSwipeNavigation(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  disabled = false,
) {
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const cancelled = useRef<boolean>(false);
  const locked = useRef<boolean>(false); // true once horizontal intent confirmed

  // Store callbacks in refs so the native listener always sees the latest version
  const onSwipeLeftRef = useRef(onSwipeLeft);
  const onSwipeRightRef = useRef(onSwipeRight);
  const disabledRef = useRef(disabled);
  useEffect(() => { onSwipeLeftRef.current = onSwipeLeft; }, [onSwipeLeft]);
  useEffect(() => { onSwipeRightRef.current = onSwipeRight; }, [onSwipeRight]);
  useEffect(() => { disabledRef.current = disabled; }, [disabled]);

  // Native touchmove handler — must be non-passive to allow preventDefault
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (cancelled.current) return;
    if (locked.current) {
      // Already locked horizontally — keep preventing scroll
      e.preventDefault();
      return;
    }

    const dx = Math.abs(e.touches[0].clientX - startX.current);
    const dy = Math.abs(e.touches[0].clientY - startY.current);

    if (dx >= HORIZONTAL_LOCK_PX && dx >= dy) {
      // Horizontal intent confirmed — lock the gesture
      locked.current = true;
      e.preventDefault();
    } else if (dy >= VERTICAL_CANCEL_PX && dy > dx) {
      // Vertical intent confirmed — cancel gesture, let scroll through
      cancelled.current = true;
    }
    // Otherwise: still ambiguous, wait for more movement
  }, []);

  // Ref callback: attach / detach the native non-passive listener
  const swipeRef = useCallback((node: HTMLElement | null) => {
    if (node) {
      node.addEventListener('touchmove', handleTouchMove, { passive: false });
    }
    return () => {
      if (node) {
        node.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [handleTouchMove]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabledRef.current) {
      cancelled.current = true;
      return;
    }
    const target = e.target as Element;
    if (target.closest(INTERACTIVE_SELECTORS)) {
      cancelled.current = true;
      return;
    }
    cancelled.current = false;
    locked.current = false;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
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
      setSwipeDirection('left');
      onSwipeLeftRef.current();
    } else {
      setSwipeDirection('right');
      onSwipeRightRef.current();
    }
  }, []);

  return { ref: swipeRef, onTouchStart, onTouchEnd };
}
