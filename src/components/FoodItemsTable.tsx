import { FoodItem, DailyTotals, calculateTotals, EditableField } from '@/types/food';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EntryBoundary {
  entryId: string;
  startIndex: number;
  endIndex: number;
}

interface FoodItemsTableProps {
  items: FoodItem[];
  editable?: boolean;
  onUpdateItem?: (index: number, field: keyof FoodItem, value: string | number) => void;
  onRemoveItem?: (index: number) => void;
  newItemUids?: Set<string>;
  showHeader?: boolean;
  showTotals?: boolean;
  totalsPosition?: 'top' | 'bottom';
  totals?: DailyTotals;
  entryBoundaries?: EntryBoundary[];
  onDeleteEntry?: (entryId: string) => void;
  onDeleteAll?: () => void;
  entryRawInputs?: Map<string, string>;
  expandedEntryIds?: Set<string>;
  onToggleEntryExpand?: (entryId: string) => void;
}

export function FoodItemsTable({
  items,
  editable = false,
  onUpdateItem,
  onRemoveItem,
  newItemUids,
  showHeader = true,
  showTotals = true,
  totalsPosition = 'bottom',
  totals: externalTotals,
  entryBoundaries,
  onDeleteEntry,
  onDeleteAll,
  entryRawInputs,
  expandedEntryIds,
  onToggleEntryExpand,
}: FoodItemsTableProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      (e.target as HTMLElement).blur(); // Blur to trigger save
    }
  };

  // Check if any field was user-edited (row-level indicator)
  const hasAnyEditedFields = (item: FoodItem): boolean => {
    return (item.editedFields?.length ?? 0) > 0;
  };

  // Format edited fields for tooltip display (reusable helper)
  const formatEditedFields = (item: FoodItem): string | null => {
    if (!item.editedFields || item.editedFields.length === 0) {
      return null;
    }
    const fieldLabels = item.editedFields.map(field => 
      field.charAt(0).toUpperCase() + field.slice(1)
    );
    return `Edited: ${fieldLabels.join(', ')}`;
  };

  // Build tooltip for description (just the description text)
  const getItemTooltip = (item: FoodItem): string => {
    return item.description;
  };

  // Check if this is a newly-added row (for amber background)
  const isNewItem = (item: FoodItem): boolean => {
    return newItemUids?.has(item.uid) ?? false;
  };

  const calculatedTotals = calculateTotals(items);
  const totals = externalTotals || calculatedTotals;

  // Determine if we're in entry-delete mode (grouped items with entry deletion)
  const hasEntryDeletion = entryBoundaries && onDeleteEntry;
  
  // Show dividers between entries when there are multiple entries
  const showEntryDividers = entryBoundaries && entryBoundaries.length > 1;

  // Grid columns based on mode
  const getGridCols = (showDelete: boolean, hasExpandColumn: boolean) => {
    const expandCol = hasExpandColumn ? '16px_' : '';
    if (showDelete) {
      return `grid-cols-[${expandCol}1fr_56px_50px_44px_32px_24px]`;
    }
    return `grid-cols-[${expandCol}1fr_56px_50px_44px_32px]`;
  };

  // For entry-deletion mode, check if this index is the last item in its entry
  const isLastItemInEntry = (index: number): EntryBoundary | null => {
    if (!entryBoundaries) return null;
    const boundary = entryBoundaries.find(b => b.endIndex === index);
    return boundary || null;
  };

  // Check if this is the first item in an entry (for visual grouping)
  const isFirstItemInEntry = (index: number): boolean => {
    if (!entryBoundaries) return false;
    return entryBoundaries.some(b => b.startIndex === index);
  };

  // Get the entry ID for the current item
  const getEntryIdForItem = (index: number): string | null => {
    if (!entryBoundaries) return null;
    const boundary = entryBoundaries.find(
      b => index >= b.startIndex && index <= b.endIndex
    );
    return boundary?.entryId || null;
  };

  const hasDeleteColumn = editable || hasEntryDeletion;
  const gridCols = getGridCols(!!hasDeleteColumn, !!showEntryDividers);

  const TotalsRow = () => (
    <div className={cn(
      'grid gap-0.5 items-center text-body font-semibold group',
      totalsPosition === 'top' && 'bg-muted/30 rounded py-1',
      totalsPosition === 'bottom' && 'pt-1 border-t text-muted-foreground',
      gridCols
    )}>
      {showEntryDividers && <span></span>}
      <span className="px-2">Total</span>
      <span className="px-1">{Math.round(totals.calories)}</span>
      <span className="px-1">{Math.round(totals.protein)}</span>
      <span className="px-1">{Math.round(totals.carbs)}</span>
      <span className="px-1">{Math.round(totals.fat)}</span>
      {hasDeleteColumn && (
        onDeleteAll ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive md:opacity-0 md:group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all entries?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove all food entries for today.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={onDeleteAll}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <span></span>
        )
      )}
    </div>
  );

  // Get cell classes for description (new-item highlight only)
  const getDescriptionClasses = (item: FoodItem) => {
    return cn(
      "hover:bg-muted/50 focus:bg-muted/50",
      isNewItem(item) && "animate-highlight-fade"
    );
  };

  // Get cell classes for macro inputs (no edit indicator, just new-item highlight)
  const getMacroClasses = (item: FoodItem) => {
    return cn(
      "h-full min-h-7 !text-size-compact px-1 border-0 bg-transparent",
      isNewItem(item) && "animate-highlight-fade",
      "hover:bg-muted/50 focus:bg-muted/50"
    );
  };

  return (
    <div className="space-y-1">
      {/* Header row */}
      {showHeader && (
        <div className={cn('grid gap-0.5 text-muted-foreground items-center', gridCols)}>
          {showEntryDividers && <span></span>}
          <span className="text-size-compact px-2"></span>
          <span className="text-size-compact px-1">Calories</span>
          <span className="text-size-compact px-1">Protein</span>
          <span className="text-size-compact px-1">Carbs</span>
          <span className="text-size-compact px-1">Fat</span>
          {hasDeleteColumn && <span></span>}
        </div>
      )}

      {/* Totals at top */}
      {showTotals && totalsPosition === 'top' && <TotalsRow />}

      {/* Data rows */}
      {items.map((item, index) => {
        const entryBoundary = isLastItemInEntry(index);
        const isFirstInEntry = isFirstItemInEntry(index);
        const isLastInEntry = !!entryBoundary;
        const currentEntryId = getEntryIdForItem(index);
        const isCurrentExpanded = currentEntryId ? expandedEntryIds?.has(currentEntryId) : false;
        const currentRawInput = currentEntryId ? entryRawInputs?.get(currentEntryId) : null;
        
        return (
          <div key={item.uid || index} className="contents">
            <div
              className={cn(
                'grid gap-0.5 items-stretch group',
                gridCols
              )}
            >
            {/* Expand column cell */}
            {showEntryDividers && (
              <div className="flex items-center justify-center">
                {isLastInEntry ? (
                  <button
                    onClick={() => currentEntryId && onToggleEntryExpand?.(currentEntryId)}
                    className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                  >
                    <ChevronRight className={cn(
                      "h-3 w-3 transition-transform",
                      isCurrentExpanded && "rotate-90"
                    )} />
                  </button>
                ) : null}
              </div>
            )}
            {/* Description cell */}
            {editable ? (
              <div className="flex items-baseline min-w-0">
                <div
                  contentEditable
                  suppressContentEditableWarning
                  spellCheck={false}
                  title={getItemTooltip(item)}
                  ref={(el) => {
                    // Only sync content when element exists and is NOT being edited
                    if (el && el.textContent !== item.description && document.activeElement !== el) {
                      el.textContent = item.description;
                    }
                  }}
                  onInput={(e) => {
                    const newDescription = e.currentTarget.textContent || '';
                    if (newDescription !== item.description) {
                      onUpdateItem?.(index, 'description', newDescription);
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    "text-size-compact pl-2 pr-0 py-1 border-0 bg-transparent focus:outline-none line-clamp-2 cursor-text rounded shrink min-w-0",
                    getDescriptionClasses(item)
                  )}
                />
                {hasAnyEditedFields(item) && (
                  <span className="text-edited font-bold text-size-compact shrink-0 ml-1" title={formatEditedFields(item) || 'Edited'}>*</span>
                )}
                <div className="flex-1" />
              </div>
            ) : (
              <div className="flex items-baseline min-w-0">
                <span 
                  title={getItemTooltip(item)}
                  className="text-size-compact pl-2 pr-0 py-1 line-clamp-2 shrink min-w-0"
                >
                  {item.description}
                </span>
                {hasAnyEditedFields(item) && (
                  <span className="text-edited font-bold text-size-compact shrink-0 ml-1" title={formatEditedFields(item) || 'Edited'}>*</span>
                )}
                <div className="flex-1" />
              </div>
            )}

            {/* Macro cells */}
            {editable ? (
              <>
                <Input
                  type="number"
                  value={item.calories}
                  onChange={(e) => onUpdateItem?.(index, 'calories', Number(e.target.value))}
                  onKeyDown={handleKeyDown}
                  className={getMacroClasses(item)}
                />
                <Input
                  type="number"
                  value={Math.round(item.protein)}
                  onChange={(e) => onUpdateItem?.(index, 'protein', Number(e.target.value))}
                  onKeyDown={handleKeyDown}
                  className={getMacroClasses(item)}
                />
                <Input
                  type="number"
                  value={Math.round(item.carbs)}
                  onChange={(e) => onUpdateItem?.(index, 'carbs', Number(e.target.value))}
                  onKeyDown={handleKeyDown}
                  className={getMacroClasses(item)}
                />
                <Input
                  type="number"
                  value={Math.round(item.fat)}
                  onChange={(e) => onUpdateItem?.(index, 'fat', Number(e.target.value))}
                  onKeyDown={handleKeyDown}
                  className={getMacroClasses(item)}
                />
              </>
            ) : (
              <>
                <span className="text-size-compact px-1 py-1 text-muted-foreground">{item.calories}</span>
                <span className="text-size-compact px-1 py-1 text-muted-foreground">{Math.round(item.protein)}</span>
                <span className="text-size-compact px-1 py-1 text-muted-foreground">{Math.round(item.carbs)}</span>
                <span className="text-size-compact px-1 py-1 text-muted-foreground">{Math.round(item.fat)}</span>
              </>
            )}

            {/* Delete button */}
            {editable && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveItem?.(index)}
                className="h-6 w-6 text-muted-foreground hover:text-destructive md:opacity-0 md:group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            
            {/* Entry delete button (only on last item of each entry) */}
            {!editable && hasEntryDeletion && (
              entryBoundary ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove this meal and all its items.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => onDeleteEntry!(entryBoundary.entryId)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <span></span>
              )
            )}
            </div>
            
            {/* Expanded raw input - shows after last item in entry */}
            {showEntryDividers && isLastInEntry && isCurrentExpanded && currentRawInput && (
              <div className={cn('grid gap-0.5', gridCols)}>
                <span></span>
                <div className="col-span-5 pl-2 py-1 text-size-compact text-muted-foreground whitespace-pre-wrap italic">
                  {currentRawInput}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Totals at bottom */}
      {showTotals && totalsPosition === 'bottom' && <TotalsRow />}
    </div>
  );
}
