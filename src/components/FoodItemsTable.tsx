import { useState, useRef } from 'react';
import { FoodItem, DailyTotals, calculateTotals, scaleMacrosByCalories, ScaledMacros } from '@/types/food';
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
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type EditableFieldKey = 'description' | 'calories';

interface EditingCell {
  index: number;
  field: EditableFieldKey;
  value: string | number;
  originalValue: string | number;
}

interface EntryBoundary {
  entryId: string;
  startIndex: number;
  endIndex: number;
}

interface FoodItemsTableProps {
  items: FoodItem[];
  editable?: boolean;
  onUpdateItem?: (index: number, field: keyof FoodItem, value: string | number) => void;
  onUpdateItemBatch?: (index: number, updates: Partial<FoodItem>) => void;
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
  onSaveAsMeal?: (entryId: string, rawInput: string | null, foodItems: FoodItem[]) => void;
}

export function FoodItemsTable({
  items,
  editable = false,
  onUpdateItem,
  onUpdateItemBatch,
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
  onSaveAsMeal,
}: FoodItemsTableProps) {
  // Local editing state - only saved on Enter
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const descriptionOriginalRef = useRef<string>('');

  // Get preview macros when editing calories (uses same helper as save)
  const getPreviewMacros = (item: FoodItem, index: number): ScaledMacros | null => {
    if (editingCell?.index === index && editingCell?.field === 'calories') {
      return scaleMacrosByCalories(
        item.calories,
        item.protein,
        item.carbs,
        item.fat,
        Number(editingCell.value)
      );
    }
    return null;
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    field: EditableFieldKey
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Save the edit
      if (editingCell && editingCell.value !== editingCell.originalValue) {
        // If editing calories, batch all 4 fields with scaled values in one atomic call
        if (field === 'calories') {
          const item = items[index];
          const scaled = scaleMacrosByCalories(
            item.calories,
            item.protein,
            item.carbs,
            item.fat,
            Number(editingCell.value)
          );
          onUpdateItemBatch?.(index, {
            calories: scaled.calories,
            protein: scaled.protein,
            carbs: scaled.carbs,
            fat: scaled.fat,
          });
        } else {
          onUpdateItem?.(index, field, editingCell.value);
        }
      }
      setEditingCell(null);
      (e.target as HTMLElement).blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Cancel - revert to original (state will be cleared, input will show item value)
      setEditingCell(null);
      (e.target as HTMLElement).blur();
    }
  };

  const handleDescriptionKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    index: number,
    item: FoodItem
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newDescription = e.currentTarget.textContent || '';
      if (newDescription !== descriptionOriginalRef.current) {
        onUpdateItem?.(index, 'description', newDescription);
      }
      (e.target as HTMLElement).blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Revert to original
      e.currentTarget.textContent = descriptionOriginalRef.current;
      (e.target as HTMLElement).blur();
    }
  };

  const handleDescriptionFocus = (e: React.FocusEvent<HTMLDivElement>, item: FoodItem) => {
    descriptionOriginalRef.current = item.description;
  };

  const handleDescriptionBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    // Revert to original on blur (cancel)
    e.currentTarget.textContent = descriptionOriginalRef.current;
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
  const showEntryDividers = entryBoundaries && entryBoundaries.length > 0;

  // Grid columns: Description | Calories | P/C/F (combined) | Delete
  const getGridCols = (showDelete: boolean) => {
    if (showDelete) {
      return `grid-cols-[1fr_50px_90px_24px]`;
    }
    return `grid-cols-[1fr_50px_90px]`;
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
  const gridCols = getGridCols(!!hasDeleteColumn);

  const TotalsRow = () => (
    <div className={cn(
      'grid gap-0.5 items-center group',
      totalsPosition === 'top' && 'bg-slate-200 dark:bg-slate-700 rounded py-1.5 border border-slate-300 dark:border-slate-600',
      totalsPosition === 'bottom' && 'pt-1.5 border-t-2 border-slate-300 dark:border-slate-600',
      gridCols
    )}>
      <span className={cn("px-1 font-semibold", showEntryDividers && "pl-4")}>Total</span>
      <span className="px-1 text-heading text-center">{Math.round(totals.calories)}</span>
      <span className="px-1 text-heading text-center">
        {Math.round(totals.protein)} / {Math.round(totals.carbs)} / {Math.round(totals.fat)}
      </span>
      {hasDeleteColumn && (
        onDeleteAll ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 -m-2.5 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
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

  // Get cell classes for calories input
  const getCaloriesClasses = (item: FoodItem, isEditing: boolean) => {
    return cn(
      "h-auto min-h-7 px-1 py-1 border-0 bg-transparent transition-all text-center",
      isNewItem(item) && "animate-highlight-fade",
      isEditing
        ? "ring-2 ring-focus-ring bg-focus-bg focus-visible:ring-focus-ring"
        : "hover:bg-muted/50 focus:bg-muted/50"
    );
  };

  return (
    <div className="space-y-1">
      {/* Header row */}
      {showHeader && (
        <div className={cn('grid gap-0.5 text-muted-foreground items-center text-xs', gridCols)}>
          <span className={cn("px-1", showEntryDividers && "pl-4")}></span>
          <span className="px-1 text-center">Calories</span>
          <span className="px-1 text-center">Protein/Carbs/Fat</span>
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
        
        const isCaloriesEditing = editingCell?.index === index && editingCell?.field === 'calories';
        const previewMacros = getPreviewMacros(item, index);
        
        return (
          <div key={item.uid || index} className="contents">
            <div
              className={cn(
                'grid gap-0.5 items-center group',
                gridCols
              )}
            >
            {/* Description cell (with chevron space when showing entry dividers) */}
            {editable ? (
              <div className="flex items-baseline min-w-0">
                {/* Always reserve chevron space when showing entry dividers */}
                {showEntryDividers && (
                  <div className="w-3 shrink-0 relative flex items-center justify-center self-stretch">
                    {isLastInEntry ? (
                      <button
                        onClick={() => currentEntryId && onToggleEntryExpand?.(currentEntryId)}
                        className={cn(
                          "absolute inset-0 w-[44px] -left-3 flex items-center justify-center text-muted-foreground/60 hover:text-muted-foreground transition-transform",
                          isCurrentExpanded && "rotate-90"
                        )}
                      >
                        ›
                      </button>
                    ) : null}
                  </div>
                )}
                <div className={cn(
                  "flex-1 min-w-0 flex items-baseline rounded",
                  "focus-within:ring-2 focus-within:ring-focus-ring focus-within:bg-focus-bg",
                  isNewItem(item) && "animate-highlight-fade"
                )}>
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
                    onFocus={(e) => handleDescriptionFocus(e, item)}
                    onBlur={handleDescriptionBlur}
                    onKeyDown={(e) => handleDescriptionKeyDown(e, index, item)}
                    className="pl-1 py-1 border-0 bg-transparent focus:outline-none line-clamp-2 cursor-text min-w-0 hover:bg-muted/50"
                  />
                  {hasAnyEditedFields(item) && (
                    <span className="text-focus-ring font-bold shrink-0 ml-0.5 pr-1" title={formatEditedFields(item) || 'Edited'}>*</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-baseline min-w-0">
                {/* Always reserve chevron space when showing entry dividers */}
                {showEntryDividers && (
                  <div className="w-3 shrink-0 relative flex items-center justify-center self-stretch">
                    {isLastInEntry ? (
                      <button
                        onClick={() => currentEntryId && onToggleEntryExpand?.(currentEntryId)}
                        className={cn(
                          "absolute inset-0 w-[44px] -left-3 flex items-center justify-center text-muted-foreground/60 hover:text-muted-foreground transition-transform",
                          isCurrentExpanded && "rotate-90"
                        )}
                      >
                        ›
                      </button>
                    ) : null}
                  </div>
                )}
                <span 
                  title={getItemTooltip(item)}
                  className="pl-1 pr-0 py-1 line-clamp-2 shrink min-w-0"
                >
                  {item.description}
                  {hasAnyEditedFields(item) && (
                    <span className="text-focus-ring font-bold ml-0.5" title={formatEditedFields(item) || 'Edited'}>*</span>
                  )}
                </span>
                <div className="flex-1" />
              </div>
            )}

            {/* Calories + P/C/F cells */}
            {editable ? (
              <>
                <Input
                  type="number"
                  value={
                    editingCell?.index === index && editingCell?.field === 'calories'
                      ? String(editingCell.value)
                      : item.calories
                  }
                  onFocus={() => setEditingCell({
                    index,
                    field: 'calories',
                    value: item.calories,
                    originalValue: item.calories
                  })}
                onChange={(e) => {
                  if (editingCell) {
                    setEditingCell({ ...editingCell, value: parseInt(e.target.value, 10) || 0 });
                  }
                }}
                  onBlur={() => setEditingCell(null)}
                  onKeyDown={(e) => handleKeyDown(e, index, 'calories')}
                  className={getCaloriesClasses(item, isCaloriesEditing)}
                />
                {/* P/C/F combined - read-only with preview when editing calories */}
                <span className={cn(
                  "px-1 py-1 text-center",
                  isNewItem(item) && "animate-highlight-fade",
                  isCaloriesEditing ? "text-focus-ring" : "text-muted-foreground"
                )}>
                  {previewMacros 
                    ? `${previewMacros.protein} / ${previewMacros.carbs} / ${previewMacros.fat}`
                    : `${Math.round(item.protein)} / ${Math.round(item.carbs)} / ${Math.round(item.fat)}`
                  }
                </span>
              </>
            ) : (
              <>
                <span className="px-1 py-1 text-muted-foreground text-center">{item.calories}</span>
                <span className="px-1 py-1 text-muted-foreground text-center">
                  {Math.round(item.protein)} / {Math.round(item.carbs)} / {Math.round(item.fat)}
                </span>
              </>
            )}

            {/* Delete button */}
            {editable && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveItem?.(index)}
                className="h-11 w-11 -m-2.5 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
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
                      className="h-11 w-11 -m-2.5 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
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
            {showEntryDividers && isLastInEntry && isCurrentExpanded && (
              <div className={cn('grid gap-0.5', gridCols)}>
                <div className="col-span-full pl-6 py-1 space-y-2">
                  {currentRawInput && (
                    <p className="text-muted-foreground whitespace-pre-wrap italic">
                      {currentRawInput}
                    </p>
                  )}
                  {onSaveAsMeal && currentEntryId && (
                    <button
                      onClick={() => {
                        const boundary = entryBoundaries?.find(b => b.entryId === currentEntryId);
                        if (boundary) {
                          const entryItems = items.slice(boundary.startIndex, boundary.endIndex + 1);
                          onSaveAsMeal(currentEntryId, currentRawInput ?? null, entryItems);
                        }
                      }}
                      className="text-sm text-blue-600 dark:text-blue-400 underline"
                    >
                      Save as meal
                    </button>
                  )}
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
