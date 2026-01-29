import { useState, useRef, useCallback, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

const PULL_THRESHOLD = 60;
const MAX_PULL = 100;

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const isPullingRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only activate if at the top of the page
    if (window.scrollY === 0 && !isRefreshing) {
      startYRef.current = e.touches[0].clientY;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startYRef.current === null || isRefreshing) return;
    
    // Double-check we're still at top (user might have scrolled)
    if (window.scrollY > 0) {
      startYRef.current = null;
      setPullDistance(0);
      isPullingRef.current = false;
      return;
    }

    const currentY = e.touches[0].clientY;
    const delta = currentY - startYRef.current;

    // Only track downward pulls
    if (delta > 0) {
      isPullingRef.current = true;
      // Apply resistance - the further you pull, the harder it gets
      const resistedDelta = Math.min(delta * 0.5, MAX_PULL);
      setPullDistance(resistedDelta);
      
      // Prevent iOS bounce/scroll during pull
      if (resistedDelta > 5) {
        e.preventDefault();
      }
    } else {
      isPullingRef.current = false;
      setPullDistance(0);
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (startYRef.current === null) return;
    
    startYRef.current = null;
    
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD); // Hold at threshold during refresh
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    
    isPullingRef.current = false;
  }, [pullDistance, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-0 right-0 flex items-center justify-center transition-opacity duration-200 pointer-events-none z-50",
          showIndicator ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: -40,
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 shadow-sm">
          <RefreshCw
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isRefreshing && "animate-spin"
            )}
            style={{
              transform: isRefreshing 
                ? undefined 
                : `rotate(${progress * 180}deg)`,
            }}
          />
          <span className="text-xs text-muted-foreground">
            {isRefreshing 
              ? "Refreshing..." 
              : progress >= 1 
                ? "Release to refresh" 
                : "Pull to refresh"}
          </span>
        </div>
      </div>

      {/* Content with pull offset */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPullingRef.current ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
