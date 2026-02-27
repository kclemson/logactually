import { useState, useCallback, useEffect, useRef } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { TypeaheadMatch, TypeaheadCandidate } from '@/hooks/useTypeaheadSuggestions';

interface TypeaheadSuggestionsProps {
  matches: TypeaheadMatch[];
  onSelect: (candidate: TypeaheadCandidate) => void;
  /** Called when user presses Escape or otherwise wants to dismiss */
  onDismiss?: () => void;
}

/**
 * Generic inline dropdown for typeahead suggestions.
 * Renders below the textarea, above the button row.
 * Supports keyboard navigation (arrow keys + Enter) and Escape to dismiss.
 */
export function TypeaheadSuggestions({ matches, onSelect, onDismiss }: TypeaheadSuggestionsProps) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset active index when matches change
  useEffect(() => {
    setActiveIndex(-1);
  }, [matches]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (matches.length === 0) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      onDismiss?.();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, matches.length - 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, -1));
      return;
    }

    if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      onSelect(matches[activeIndex].candidate);
    }
  }, [matches, activeIndex, onSelect, onDismiss]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (matches.length === 0) return null;

  return (
    <div
      ref={listRef}
      role="listbox"
      className="rounded-md border bg-muted/50 shadow-sm overflow-hidden"
    >
      <p className="px-3 pt-2 pb-1 text-[11px] text-muted-foreground/70 select-none">
        Previously logged
      </p>
      {matches.map(({ candidate }, index) => {
        const timeAgo = formatTimeAgo(candidate.timestamp);
        const isActive = index === activeIndex;

        return (
          <button
            key={candidate.id}
            role="option"
            aria-selected={isActive}
            className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors
              ${isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}
            `}
            onClick={() => onSelect(candidate)}
            onMouseEnter={() => setActiveIndex(index)}
          >
            <span className="truncate">
              <span className="font-medium">{candidate.label}</span>
              {candidate.labelDetail && (
                <span className="ml-1 text-xs text-muted-foreground">({candidate.labelDetail})</span>
              )}
            </span>
            <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
              {candidate.subtitle && <span>{candidate.subtitle}</span>}
              <span className="text-muted-foreground/60">{timeAgo}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Format a timestamp as a compact relative time string */
function formatTimeAgo(timestamp: string): string {
  try {
    return formatDistanceToNowStrict(new Date(timestamp), { addSuffix: true });
  } catch {
    return '';
  }
}
