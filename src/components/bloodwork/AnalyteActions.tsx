import { Pin, HelpCircle } from 'lucide-react';
import { usePinnedBloodworkCharts } from '@/hooks/usePinnedBloodworkCharts';
import { cn } from '@/lib/utils';

type Size = 'sm' | 'md';

const BOX: Record<Size, string> = {
  sm: 'h-4 w-4',
  md: 'h-7 w-7',
};
const ICON: Record<Size, string> = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
};

/**
 * Pin/unpin a bloodwork analyte to Custom Trends. Shared between the bloodwork
 * list rows and the trend popover header so the behavior stays in one place.
 */
export function AnalytePinButton({
  canonicalKey,
  displayName,
  isReadOnly,
  size = 'sm',
}: {
  canonicalKey: string;
  displayName: string;
  isReadOnly: boolean;
  size?: Size;
}) {
  const { pinnedKeys, pin, unpin } = usePinnedBloodworkCharts();
  const pinned = pinnedKeys.has(canonicalKey);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (isReadOnly) return;
        if (pinned) unpin.mutate(canonicalKey);
        else pin.mutate({ canonicalKey, displayName });
      }}
      disabled={isReadOnly}
      aria-label={pinned ? 'Unpin from Trends' : 'Pin to Trends'}
      title={pinned ? 'Pinned to Trends' : 'Pin to Trends'}
      className={cn(
        'inline-flex shrink-0 items-center justify-center transition-colors',
        BOX[size],
        pinned ? 'text-teal-500 dark:text-teal-400' : 'text-muted-foreground/40 hover:text-foreground',
        isReadOnly && 'opacity-30 cursor-not-allowed',
      )}
    >
      <Pin className={cn(ICON[size], pinned && 'fill-current')} />
    </button>
  );
}

/**
 * Opens a Google search for the analyte. Shared between the list rows and the
 * trend popover header.
 */
export function AnalyteLookupLink({
  displayName,
  size = 'sm',
  alwaysVisible = false,
}: {
  displayName: string;
  size?: Size;
  alwaysVisible?: boolean;
}) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(`${displayName} blood test`)}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      aria-label={`Look up ${displayName}`}
      title={`Look up "${displayName} blood test"`}
      className={cn(
        'inline-flex shrink-0 items-center justify-center text-muted-foreground/40 hover:text-foreground transition-opacity',
        BOX[size],
        !alwaysVisible && 'md:opacity-0 md:group-hover/row:opacity-100',
      )}
    >
      <HelpCircle className={ICON[size]} />
    </a>
  );
}
