import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartVisibilityWrapperProps {
  chartId: string;
  isHidden: boolean;
  customizeMode: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}

/**
 * Wraps any Trends chart to add per-chart hide/show.
 *
 * - Normal view: renders nothing when the chart is hidden, otherwise the chart untouched.
 * - Customize mode: always renders the chart with a corner eye / eye-off toggle,
 *   dimming hidden charts so they can be brought back.
 */
export function ChartVisibilityWrapper({
  chartId,
  isHidden,
  customizeMode,
  onToggle,
  children,
}: ChartVisibilityWrapperProps) {
  if (isHidden && !customizeMode) return null;

  if (!customizeMode) return <>{children}</>;

  return (
    <div className="relative">
      <div className={cn('transition-opacity', isHidden && 'opacity-40')}>
        {children}
      </div>
      <button
        type="button"
        onClick={() => onToggle(chartId)}
        aria-label={isHidden ? 'Show chart' : 'Hide chart'}
        className="absolute right-1 top-1 z-10 rounded-md bg-background/90 p-1 text-[hsl(217_91%_60%)] shadow-sm ring-1 ring-border backdrop-blur-sm transition-colors hover:bg-background"
      >
        {isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
