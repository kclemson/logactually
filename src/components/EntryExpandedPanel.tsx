import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SavedItemInfo {
  type: 'meal' | 'routine';
  /** Name of the saved item, or null if the saved item was deleted */
  name: string | null;
  /** Whether this entry originated from a saved item */
  isFromSaved: boolean;
}

interface EntryExpandedPanelProps {
  /** Original raw input text the user typed */
  rawInput: string | null;
  /** Info about whether this entry came from a saved meal/routine */
  savedItemInfo: SavedItemInfo;
  /** Callback to save the entry as a meal/routine */
  onSaveAs?: () => void;
  /** Parent grid column class so the panel spans the full grid */
  gridCols: string;
  /** Optional content rendered before the standard panel (e.g. calorie burn estimates) */
  extraContent?: ReactNode;
  /** Callback to open the detail dialog for this entry */
  onShowDetails?: () => void;
}

/**
 * Shared expanded content panel revealed by the entry chevron.
 * Shows "Logged as", saved item link / save button.
 */
export function EntryExpandedPanel({
  rawInput,
  savedItemInfo,
  onSaveAs,
  gridCols,
  extraContent,
  onShowDetails,
}: EntryExpandedPanelProps) {
  const { type, name, isFromSaved } = savedItemInfo;
  const typeLabel = type === 'meal' ? 'meal' : 'routine';

  return (
    <div className={cn('grid gap-0.5', gridCols)}>
      <div className="col-span-full pl-6 pt-2 pb-1 space-y-1.5">
        {extraContent}

        {/* "Logged as" line -- hidden when from a saved item or no raw input */}
        {!isFromSaved && rawInput && (
          <p className="text-xs text-muted-foreground italic">
            Logged as: {rawInput}
          </p>
        )}

        {isFromSaved ? (
          <p className="text-xs text-muted-foreground italic">
            From saved {typeLabel}:{' '}
            {name ? (
              <Link
                to="/settings"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {name}
              </Link>
            ) : (
              <span>(deleted)</span>
            )}
          </p>
        ) : onSaveAs && (
          <button
            onClick={onSaveAs}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Save as {typeLabel}
          </button>
        )}

        {onShowDetails && (
          <button
            onClick={onShowDetails}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Details
          </button>
        )}
      </div>
    </div>
  );
}
