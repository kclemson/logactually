import { type ReactNode, useState, useRef } from 'react';
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
  /** Callback to copy this entry to today's date */
  onCopyToToday?: () => void;
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
  onCopyToToday,
  onShowDetails,
}: EntryExpandedPanelProps) {
  const { type, name, isFromSaved } = savedItemInfo;
  const typeLabel = type === 'meal' ? 'meal' : 'routine';
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleCopyClick = () => {
    onCopyToToday?.();
    setCopied(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('grid gap-0.5', gridCols)}>
      <div className="col-span-full pl-6 pr-4 pt-2 pb-1 flex items-end justify-between gap-2">
        <div className="space-y-1.5 w-full">
          {extraContent}

          {/* "Logged as" line -- hidden when from a saved item or no raw input */}
          {!isFromSaved && rawInput && (
            <p className="text-xs text-muted-foreground italic">
              Logged as: {rawInput}
            </p>
          )}

          {isFromSaved && (
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
          )}

          <div className="flex justify-between items-center">
            <div>
              {!isFromSaved && onSaveAs && (
                <button
                  onClick={onSaveAs}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Save as {typeLabel}
                </button>
              )}
            </div>
            <div className="flex gap-4">
              {onCopyToToday && (
                copied ? (
                  <span className="text-xs text-green-600 dark:text-green-400 py-1">
                    Copied!
                  </span>
                ) : (
                  <button
                    onClick={handleCopyClick}
                    className="text-xs text-blue-600 dark:text-blue-400 py-1 hover:underline"
                  >
                    Copy to today
                  </button>
                )
              )}
              {onShowDetails && (
                <button
                  onClick={onShowDetails}
                  className="text-xs text-blue-600 dark:text-blue-400 py-1 hover:underline"
                >
                  Details
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}