import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
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
import { useReadOnlyContext } from '@/contexts/ReadOnlyContext';
import { getTargetDotColor } from '@/lib/calorie-target';

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
  newEntryIds?: Set<string>;
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
  entryMealNames?: Map<string, string>;
  /** Set of entry IDs that originated from a saved meal (even if meal was deleted) */
  entrySourceMealIds?: Set<string>;
  /** When true, show inline labels after numeric values (e.g., "250 cal") */
  showInlineLabels?: boolean;
  /** When false, hide the macro percentages row in totals (default: true) */
  showMacroPercentages?: boolean;
  /** When false, hide the divider line above totals row (default: true) */
  showTotalsDivider?: boolean;
  /** When true, use smaller text for compact preview contexts */
  compact?: boolean;
  /** When true, show a checkbox column on the left for selection */
  selectable?: boolean;
  /** Which row indices are currently selected (controlled) */
  selectedIndices?: Set<number>;
  /** Callback when a row's checkbox is toggled */
  onSelectionChange?: (index: number, selected: boolean) => void;
  dailyCalorieTarget?: number;
  showCalorieTargetDot?: boolean;
}

export function FoodItemsTable({
  items,
  editable = false,
  onUpdateItem,
  onUpdateItemBatch,
  onRemoveItem,
  newEntryIds,
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
  entryMealNames,
  entrySourceMealIds,
  showInlineLabels = false,
  showMacroPercentages = true,
  showTotalsDivider = true,
  compact = false,
  selectable = false,
  selectedIndices,
  onSelectionChange,
  dailyCalorieTarget,
  showCalorieTargetDot = false,
}: FoodItemsTableProps) {
  // Read-only mode blocks saves
  const { isReadOnly, triggerOverlay } = useReadOnlyContext();

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
      
      // Block save for read-only users
      if (isReadOnly) {
        triggerOverlay();
        setEditingCell(null);
        (e.target as HTMLElement).blur();
        return;
      }
      
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
    e: React.KeyboardEvent<HTMLSpanElement>,
    index: number,
    item: FoodItem
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Block save for read-only users
      if (isReadOnly) {
        triggerOverlay();
        e.currentTarget.textContent = descriptionOriginalRef.current;
        (e.target as HTMLElement).blur();
        return;
      }
      
      const newDescription = e.currentTarget.textContent || '';
      if (newDescription !== descriptionOriginalRef.current) {
        onUpdateItem?.(index, 'description', newDescription);
        // Clear portion when description is edited to prevent stale data
        if (item.portion) {
          onUpdateItem?.(index, 'portion', '');
        }
      }
      (e.target as HTMLElement).blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Revert to original
      e.currentTarget.textContent = descriptionOriginalRef.current;
      (e.target as HTMLElement).blur();
    }
  };

  const handleDescriptionFocus = (e: React.FocusEvent<HTMLSpanElement>, item: FoodItem) => {
    descriptionOriginalRef.current = item.description;
  };

  const handleDescriptionBlur = (
    e: React.FocusEvent<HTMLSpanElement>,
    index: number,
    item: FoodItem
  ) => {
    // Read-only mode always reverts
    if (isReadOnly) {
      e.currentTarget.textContent = descriptionOriginalRef.current;
      return;
    }
    
    const newDescription = (e.currentTarget.textContent || '').trim();
    
    // Revert if empty, otherwise save
    if (!newDescription) {
      e.currentTarget.textContent = descriptionOriginalRef.current;
    } else if (newDescription !== descriptionOriginalRef.current) {
      onUpdateItem?.(index, 'description', newDescription);
      // Clear portion when description is edited to prevent stale data
      if (item.portion) {
        onUpdateItem?.(index, 'portion', '');
      }
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

  // Build tooltip for description (include portion if present)
  const getItemTooltip = (item: FoodItem): string => {
    if (item.portion) {
      return `${item.description} (${item.portion})`;
    }
    return item.description;
  };

  const calculatedTotals = calculateTotals(items);
  const totals = externalTotals || calculatedTotals;

  // Determine if we're in entry-delete mode (grouped items with entry deletion)
  const hasEntryDeletion = entryBoundaries && onDeleteEntry;
  
  // Show dividers between entries when there are multiple entries
  const showEntryDividers = entryBoundaries && entryBoundaries.length > 0;

  // Grid columns: [Checkbox] | Description | Calories | P/C/F (combined) | [Delete]
  const getGridCols = (showDelete: boolean, showCheckbox: boolean) => {
    if (showCheckbox && showDelete) {
      return 'grid-cols-[24px_1fr_50px_90px_24px]';
    } else if (showCheckbox) {
      return 'grid-cols-[24px_1fr_50px_90px]';
    } else if (showDelete) {
      return 'grid-cols-[1fr_50px_90px_24px]';
    }
    return 'grid-cols-[1fr_50px_90px]';
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

  // Note: entryBoundaries is kept for visual grouping (isFirstItemInEntry, isLastItemInEntry)
  // but data lookups use item.entryId directly to avoid race conditions

  const hasDeleteColumn = editable || hasEntryDeletion;
  const gridCols = getGridCols(!!hasDeleteColumn, selectable);

  // Check if an entry ID is in the "new" set for grouped highlighting
  const isNewEntry = (entryId: string | null): boolean => {
    return entryId ? (newEntryIds?.has(entryId) ?? false) : false;
  };

  const TotalsRow = () => {
    // Calculate calorie contribution from each macro
    const proteinCals = totals.protein * 4;
    const carbsCals = totals.carbs * 4;
    const fatCals = totals.fat * 9;
    const totalMacroCals = proteinCals + carbsCals + fatCals;
    
    // Calculate percentages (handle zero case)
    const proteinPct = totalMacroCals > 0 ? Math.round((proteinCals / totalMacroCals) * 100) : 0;
    const carbsPct = totalMacroCals > 0 ? Math.round((carbsCals / totalMacroCals) * 100) : 0;
    const fatPct = totalMacroCals > 0 ? Math.round((fatCals / totalMacroCals) * 100) : 0;

    return (
      <div className={cn(
        'grid gap-0.5 items-center group',
        totalsPosition === 'top' && 'bg-slate-200 dark:bg-slate-700 rounded py-1.5 border border-slate-300 dark:border-slate-600',
        totalsPosition === 'bottom' && showTotalsDivider && 'pt-1.5 border-t-2 border-slate-300 dark:border-slate-600',
        gridCols
      )}>
        {selectable && <span></span>}
        <span className={cn("px-1 font-semibold", showEntryDividers && "pl-4", compact && "text-sm")}>Total</span>
        <span className={cn("px-1 text-center inline-flex items-center justify-center", compact ? "text-xs" : "text-heading")}>
          {Math.round(totals.calories)}
          {showCalorieTargetDot && dailyCalorieTarget && dailyCalorieTarget > 0 && (
            <span className={`text-[10px] ml-0.5 leading-none relative top-[-0.5px] ${getTargetDotColor(totals.calories, dailyCalorieTarget)}`}>●</span>
          )}
        </span>
        <span className={cn("px-1 text-center", compact ? "text-xs" : "text-heading")}>
          <div>{Math.round(totals.protein)}/{Math.round(totals.carbs)}/{Math.round(totals.fat)}</div>
          {showMacroPercentages && (
            <div className={cn("text-muted-foreground font-normal", compact ? "text-[8px]" : "text-[9px]")}>
              {proteinPct}%/{carbsPct}%/{fatPct}%
            </div>
          )}
        </span>
      {hasDeleteColumn && (
        onDeleteAll ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                aria-label="Delete all entries"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="left-4 right-4 translate-x-0 w-auto max-w-[calc(100vw-32px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-lg">
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
  };

  // Get cell classes for calories input
  const getCaloriesClasses = (item: FoodItem, isEditing: boolean) => {
    return cn(
      "h-auto min-h-7 px-1 py-1 border-0 bg-transparent transition-all text-center",
      isEditing
        ? "ring-2 ring-focus-ring bg-focus-bg focus-visible:ring-focus-ring"
        : "hover:bg-muted/50 focus:bg-muted/50"
    );
  };

  return (
    <div className="space-y-1">
      {/* Totals at top */}
      {showTotals && totalsPosition === 'top' && <TotalsRow />}

      {/* Header row */}
      {showHeader && (
        <div className={cn('grid gap-0.5 text-muted-foreground items-center text-xs', gridCols)}>
          {selectable && <span></span>}
          <span className={cn("px-1", showEntryDividers && "pl-4")}></span>
          <span className="px-1 text-center">Calories</span>
          <span className="px-1 text-center">Protein/Carbs/Fat</span>
          {hasDeleteColumn && <span></span>}
        </div>
      )}

      {/* Mini header when main header is hidden but labels requested */}
      {!showHeader && showInlineLabels && items.length > 0 && (
        <div className={cn('grid gap-0.5 items-center text-muted-foreground', compact ? 'text-[9px]' : 'text-[10px]', gridCols)}>
          {selectable && <span></span>}
          <span></span>
          <span className="px-1 text-center">Cal</span>
          <span className="px-1 text-center">P/C/F</span>
          {hasDeleteColumn && <span></span>}
        </div>
      )}

      {/* Data rows */}
      {items.map((item, index) => {
        const entryBoundary = isLastItemInEntry(index);
        const isFirstInEntry = isFirstItemInEntry(index);
        const isLastInEntry = !!entryBoundary;
        const currentEntryId = item.entryId || null;
        const isCurrentExpanded = currentEntryId ? expandedEntryIds?.has(currentEntryId) : false;
        const currentRawInput = currentEntryId ? entryRawInputs?.get(currentEntryId) : null;
        
        const isCaloriesEditing = editingCell?.index === index && editingCell?.field === 'calories';
        const previewMacros = getPreviewMacros(item, index);
        
        // Check if this entry should have grouped highlighting
        const entryIsNew = isNewEntry(currentEntryId);
        
        return (
          <div key={item.uid || index} className="contents">
            <div
              className={cn(
                'grid gap-0.5 items-center group',
                gridCols,
                // Add padding for inset shadow when entry is new
                entryIsNew && "pl-0.5",
                entryIsNew && isLastInEntry && "pb-0.5",
                // Grouped highlight: apply segmented outline to create connected visual
                entryIsNew && isFirstInEntry && !isLastInEntry && "rounded-t-md animate-outline-fade-top",
                entryIsNew && !isFirstInEntry && isLastInEntry && "rounded-b-md animate-outline-fade-bottom",
                entryIsNew && !isFirstInEntry && !isLastInEntry && "animate-outline-fade-middle",
                entryIsNew && isFirstInEntry && isLastInEntry && "rounded-md animate-outline-fade"
              )}
            >
            {/* Checkbox cell for selection mode */}
            {selectable && (
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedIndices?.has(index) ?? false}
                  onChange={(e) => onSelectionChange?.(index, e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
              </div>
            )}
            {/* Description cell (with chevron space when showing entry dividers) */}
            {editable ? (
              <div className="flex min-w-0">
                {/* Always reserve chevron space when showing entry dividers */}
                {showEntryDividers && (
                  <div className="w-3 shrink-0 relative flex items-center justify-center self-stretch">
                    {isLastInEntry ? (
                      <button
                        onClick={() => currentEntryId && onToggleEntryExpand?.(currentEntryId)}
                        aria-label={isCurrentExpanded ? "Collapse entry" : "Expand entry"}
                        className={cn(
                          "absolute inset-0 w-[44px] -left-3 flex items-center justify-center text-muted-foreground/60 hover:text-muted-foreground transition-transform text-xl focus:outline-none focus-visible:outline-none",
                          isCurrentExpanded && "rotate-90"
                        )}
                      >
                        ›
                      </button>
                    ) : null}
                  </div>
                )}
                <div className={cn(
                  "flex-1 min-w-0 rounded pl-1 py-1",
                  "overflow-hidden max-h-[3rem]",
                  "focus-within:ring-2 focus-within:ring-focus-ring focus-within:bg-focus-bg"
                )}>
                  <span
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
                    onBlur={(e) => handleDescriptionBlur(e, index, item)}
                    onKeyDown={(e) => handleDescriptionKeyDown(e, index, item)}
                    className="border-0 bg-transparent focus:outline-none cursor-text hover:bg-muted/50"
                  />
                  {item.portion && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap"> ({item.portion})</span>
                  )}
                  {hasAnyEditedFields(item) && (
                    <span className="text-focus-ring font-bold whitespace-nowrap" title={formatEditedFields(item) || 'Edited'}> *</span>
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
                        aria-label={isCurrentExpanded ? "Collapse entry" : "Expand entry"}
                        className={cn(
                          "absolute inset-0 w-[44px] -left-3 flex items-center justify-center text-muted-foreground/60 hover:text-muted-foreground transition-transform text-xl focus:outline-none focus-visible:outline-none",
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
                  className={cn("pl-1 pr-0 py-1 line-clamp-2 shrink min-w-0", compact && "text-sm")}
                >
                  {item.description}
                  {item.portion && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap"> ({item.portion})</span>
                  )}
                  {hasAnyEditedFields(item) && (
                    <span className="text-focus-ring font-bold" title={formatEditedFields(item) || 'Edited'}> *</span>
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
                  onBlur={() => {
                    // Save on blur if value changed and valid (non-zero)
                    if (editingCell && editingCell.value !== editingCell.originalValue && !isReadOnly) {
                      const numValue = Number(editingCell.value);
                      if (numValue > 0) {
                        const scaled = scaleMacrosByCalories(
                          item.calories,
                          item.protein,
                          item.carbs,
                          item.fat,
                          numValue
                        );
                        onUpdateItemBatch?.(index, {
                          calories: scaled.calories,
                          protein: scaled.protein,
                          carbs: scaled.carbs,
                          fat: scaled.fat,
                        });
                      }
                    }
                    setEditingCell(null);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, index, 'calories')}
                  className={getCaloriesClasses(item, isCaloriesEditing)}
                />
                {/* P/C/F combined - read-only with preview when editing calories */}
                <span className={cn(
                  "px-1 py-1 text-center",
                  isCaloriesEditing ? "text-focus-ring" : "text-muted-foreground"
                )}>
                  {previewMacros 
                    ? `${previewMacros.protein}/${previewMacros.carbs}/${previewMacros.fat}`
                    : `${Math.round(item.protein)}/${Math.round(item.carbs)}/${Math.round(item.fat)}`
                  }
                </span>
              </>
            ) : (
              <>
                <span className={cn("px-1 py-1 text-muted-foreground text-center", compact && "text-xs")}>
                  {item.calories}
                </span>
                <span className={cn("px-1 py-1 text-muted-foreground text-center", compact && "text-xs")}>
                  {Math.round(item.protein)}/{Math.round(item.carbs)}/{Math.round(item.fat)}
                </span>
              </>
            )}

            {/* Delete button */}
            {editable && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveItem?.(index)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                aria-label="Delete item"
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
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="left-4 right-4 translate-x-0 w-auto max-w-[calc(100vw-32px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-lg">
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
            {showEntryDividers && isLastInEntry && isCurrentExpanded && (() => {
              // Check if this entry came from a saved meal (by ID, not name lookup)
              const isFromSavedMeal = currentEntryId && entrySourceMealIds?.has(currentEntryId);
              const mealName = currentEntryId && entryMealNames?.get(currentEntryId);
              
              return (
                <div className={cn('grid gap-0.5', gridCols)}>
                  <div className="col-span-full pl-6 py-1 space-y-2">
                    {/* Only show raw input if NOT from a saved meal */}
                    {!isFromSavedMeal && currentRawInput && (
                      <p className="text-sm text-muted-foreground italic">
                        Logged as: {currentRawInput}
                      </p>
                    )}
                    {/* Show meal info if from saved meal, otherwise show "Save as meal" link */}
                    {isFromSavedMeal ? (
                      <p className="text-sm text-muted-foreground italic">
                        From saved meal:{' '}
                        {mealName ? (
                          <Link 
                            to="/settings" 
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {mealName}
                          </Link>
                        ) : (
                          <span>(deleted)</span>
                        )}
                      </p>
                    ) : onSaveAsMeal && currentEntryId && (
                      <button
                        onClick={() => {
                          const entryItems = items.filter(i => i.entryId === currentEntryId);
                          onSaveAsMeal(currentEntryId!, currentRawInput ?? null, entryItems);
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 underline"
                      >
                        Save as meal
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })}

      {/* Totals at bottom */}
      {showTotals && totalsPosition === 'bottom' && <TotalsRow />}
    </div>
  );
}
