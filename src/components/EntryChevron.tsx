import { cn } from '@/lib/utils';

interface EntryChevronProps {
  expanded: boolean;
  onToggle: () => void;
}

/**
 * The expand/collapse `›` button shown on the last item of each entry group.
 * Handles rotation, 44px mobile tap target, and accessibility label.
 *
 * Used by both FoodItemsTable and WeightItemsTable.
 * Should be placed inside a container div that provides width and positioning.
 */
export function EntryChevron({ expanded, onToggle }: EntryChevronProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={expanded ? "Collapse entry" : "Expand entry"}
      className={cn(
        "w-full h-full flex items-center justify-center text-muted-foreground/60 hover:text-muted-foreground transition-transform text-xl focus:outline-none focus-visible:outline-none",
        expanded && "rotate-90"
      )}
    >
      ›
    </button>
  );
}
