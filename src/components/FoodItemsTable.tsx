import { useState } from 'react';
import { EntryExpandedPanel } from '@/components/EntryExpandedPanel';
import { DescriptionCell } from '@/components/DescriptionCell';
import { useHasHover } from '@/hooks/use-has-hover';
import { FoodItem, DailyTotals, calculateTotals, scaleMacrosByCalories, ScaledMacros } from '@/types/food';
import { isMultiItemEntry } from '@/lib/entry-boundaries';
import { stepMultiplier, scaleItemByMultiplier, scalePortion } from '@/lib/portion-scaling';
import { Minus, Plus } from 'lucide-react';
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
import { getTargetDotColor, type CalorieTargetComponents } from '@/lib/calorie-target';
import { CalorieTargetTooltipContent } from '@/components/CalorieTargetTooltipContent';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { type EntryBoundary, isFirstInBoundary, isLastInBoundary, isEntryNew, getEntryHighlightClasses, hasAnyEditedFields, formatEditedFields } from '@/lib/entry-boundaries';
import { EntryChevron } from '@/components/EntryChevron';
import { DeleteAllDialog } from '@/components/DeleteAllDialog';
import { useInlineEdit } from '@/hooks/useInlineEdit';


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
  /** Map of entryId to group display name for collapsed multi-item entries */
  entryGroupNames?: Map<string, string>;
  /** Map of entryId to cumulative portion multiplier for group scaling */
  entryPortionMultipliers?: Map<string, number>;
  /** Callback to atomically scale all items in a group and persist multiplier */
  onScaleGroupPortion?: (entryId: string, multiplier: number) => void;
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
  dailyBurn?: number;
  calorieTargetComponents?: CalorieTargetComponents | null;
  /** Callback to persist updated group name via inline editing */
  onUpdateGroupName?: (entryId: string, newName: string) => void;
  /** Callback when user clicks "Details" on an entry's expanded panel */
  onShowDetails?: (entryId: string, startIndex: number, endIndex?: number) => void;
  /** Callback to copy an entry to today's date */
  onCopyEntryToToday?: (entryId: string) => void;
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
  entryGroupNames,
  entryPortionMultipliers,
  onScaleGroupPortion,
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
  dailyBurn = 0,
  calorieTargetComponents,
  onUpdateGroupName,
  onShowDetails,
  onCopyEntryToToday,
}: FoodItemsTableProps) {
  // Read-only mode blocks saves
  const { isReadOnly, triggerOverlay } = useReadOnlyContext();

  // Shared inline editing hook
  const inlineEdit = useInlineEdit<'calories'>({
    onSaveNumeric: (index, _field, value) => {
      const item = items[index];
      const scaled = scaleMacrosByCalories(
        item.calories, item.protein, item.carbs, item.fat, value
      );
      onUpdateItemBatch?.(index, {
        calories: scaled.calories,
        protein: scaled.protein,
        carbs: scaled.carbs,
        fat: scaled.fat,
      });
    },
    isReadOnly,
    triggerOverlay,
  });

  const { editingCell } = inlineEdit;

  // Portion scaling stepper state (individual items)
  const [portionScalingIndex, setPortionScalingIndex] = useState<number | null>(null);
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1.0);

  // Group-level portion scaling state
  const [groupScalingEntryId, setGroupScalingEntryId] = useState<string | null>(null);
  const [groupPortionMultiplier, setGroupPortionMultiplier] = useState<number>(1.0);


  // Get preview macros when editing calories (uses same helper as save)
  const getPreviewMacros = (item: FoodItem, index: number): ScaledMacros | null => {
    if (editingCell?.index === index && editingCell?.field === 'calories') {
      return scaleMacrosByCalories(
        item.calories, item.protein, item.carbs, item.fat, Number(editingCell.value)
      );
    }
    return null;
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

  const hasDeleteColumn = editable || hasEntryDeletion;
  const gridCols = getGridCols(!!hasDeleteColumn, selectable);

  const TotalsRow = () => {
    const hasHover = useHasHover();
    const [tooltipOpen, setTooltipOpen] = useState(false);

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
        {(() => {
          const showDot = showCalorieTargetDot && dailyCalorieTarget && dailyCalorieTarget > 0;

          if (showDot) {
            return (
              <TooltipProvider delayDuration={150}>
                <Tooltip open={hasHover ? undefined : tooltipOpen}>
                  <TooltipTrigger asChild>
                    <span
                      className={cn("px-1 text-center inline-flex items-center justify-center", compact ? "text-xs" : "text-heading")}
                      tabIndex={0}
                      role="button"
                      onClick={hasHover ? undefined : () => setTooltipOpen(o => !o)}
                    >
                      {Math.round(totals.calories)}
                      <span className={`text-[10px] ml-0.5 leading-none relative top-[-0.5px] ${getTargetDotColor(totals.calories, dailyCalorieTarget)}`}>●</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    sideOffset={5}
                    onPointerDownOutside={() => setTooltipOpen(false)}
                  >
                    <CalorieTargetTooltipContent
                      label=""
                      intake={Math.round(totals.calories)}
                      target={dailyCalorieTarget}
                      burn={dailyBurn}
                      targetComponents={calorieTargetComponents ?? null}
                    />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return (
            <span className={cn("px-1 text-center inline-flex items-center justify-center", compact ? "text-xs" : "text-heading")}>
              {Math.round(totals.calories)}
            </span>
          );
        })()}
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
          <DeleteAllDialog itemLabel="entries" onConfirm={onDeleteAll} />
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
      {(() => {
        // Build a set of indices that belong to collapsed groups (skip individual rendering)
        const collapsedGroupIndices = new Set<number>();
        const groupHeaders: { boundary: EntryBoundary; groupName: string }[] = [];

        if (entryBoundaries && entryGroupNames) {
          for (const boundary of entryBoundaries) {
            const groupName = entryGroupNames.get(boundary.entryId);
            if (groupName && isMultiItemEntry(boundary)) {
              const isExpanded = expandedEntryIds?.has(boundary.entryId);
              groupHeaders.push({ boundary, groupName });
              if (!isExpanded) {
                // Mark all indices in this boundary as collapsed (don't render individually)
                for (let i = boundary.startIndex; i <= boundary.endIndex; i++) {
                  collapsedGroupIndices.add(i);
                }
              }
            }
          }
        }

        const rows: React.ReactNode[] = [];

        items.forEach((item, index) => {
          // If this is the start of a collapsed group, render its header row inline
          const collapsedHeader = groupHeaders.find(g => g.boundary.startIndex === index && !expandedEntryIds?.has(g.boundary.entryId));
          if (collapsedHeader) {
            const { boundary, groupName } = collapsedHeader;
            const groupItems = items.slice(boundary.startIndex, boundary.endIndex + 1);
            const groupCalories = groupItems.reduce((sum, gi) => sum + gi.calories, 0);
            const groupProtein = groupItems.reduce((sum, gi) => sum + gi.protein, 0);
            const groupCarbs = groupItems.reduce((sum, gi) => sum + gi.carbs, 0);
            const groupFat = groupItems.reduce((sum, gi) => sum + gi.fat, 0);
            const entryIsNew = isEntryNew(boundary.entryId, newEntryIds);
            const highlightClasses = getEntryHighlightClasses(entryIsNew, true, true);

            rows.push(
              <div key={`group-collapsed-${boundary.entryId}`} className="contents">
                <div className={cn('grid gap-0.5 items-center group', gridCols, highlightClasses)}>
                  {selectable && <span></span>}
                  <div className="flex min-w-0">
                    {showEntryDividers && (
                      <div className="w-6 shrink-0 relative flex items-center justify-center self-stretch overflow-hidden">
                        <EntryChevron
                          expanded={false}
                          onToggle={() => onToggleEntryExpand?.(boundary.entryId)}
                        />
                      </div>
                    )}
                    <div className={cn("flex-1 min-w-0 rounded pl-1 py-1 flex items-baseline gap-1 flex-wrap focus-within:ring-2 focus-within:ring-focus-ring focus-within:bg-focus-bg", compact && "text-sm")}>
                       <DescriptionCell
                         value={groupName}
                         onSave={(newName) => onUpdateGroupName?.(boundary.entryId, newName)}
                         readOnly={isReadOnly}
                         onReadOnlyAttempt={triggerOverlay}
                         title={groupName}
                         className="line-clamp-2"
                       >
                        {(() => {
                          const cumulative = entryPortionMultipliers?.get(boundary.entryId) ?? 1.0;
                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setGroupScalingEntryId(groupScalingEntryId === boundary.entryId ? null : boundary.entryId);
                                setGroupPortionMultiplier(1.0);
                              }}
                              className="shrink-0 ml-1 text-xs text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground transition-colors"
                            >({scalePortion("1 portion", cumulative)})</button>
                          );
                        })()}
                      </DescriptionCell>
                    </div>
                  </div>
                  <span className={cn("px-1 py-1 text-center", compact ? "text-xs" : "")}>
                    {Math.round(groupCalories)}
                  </span>
                  <span className={cn("px-1 py-1 text-center text-muted-foreground", compact && "text-xs")}>
                    {Math.round(groupProtein)}/{Math.round(groupCarbs)}/{Math.round(groupFat)}
                  </span>
                  {hasDeleteColumn && (
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
                            This will permanently remove {groupName} ({groupItems.length} items).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => onDeleteEntry?.(boundary.entryId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                {/* Group-level portion scaling stepper */}
                {groupScalingEntryId === boundary.entryId && (
                  <div className={cn('grid gap-0.5', gridCols)}>
                    <div
                      className="col-span-full pl-6 pr-2 py-1.5 flex items-center gap-2"
                      tabIndex={-1}
                      ref={(el) => { if (el) el.focus(); }}
                      onBlur={(e) => {
                        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                        setGroupScalingEntryId(null);
                        setGroupPortionMultiplier(1.0);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.stopPropagation();
                          setGroupScalingEntryId(null);
                          setGroupPortionMultiplier(1.0);
                        }
                      }}
                    >
                      <button type="button" disabled={groupPortionMultiplier <= 0.25}
                        onClick={() => setGroupPortionMultiplier(stepMultiplier(groupPortionMultiplier, 'down'))}
                        className="h-7 w-7 rounded-full border border-input bg-background flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Decrease portion"
                      ><Minus className="h-3.5 w-3.5" /></button>
                      <span className={cn("text-sm font-medium min-w-[3rem] text-center tabular-nums", groupPortionMultiplier !== 1.0 && "text-primary")}>
                        {groupPortionMultiplier}x
                      </span>
                      <button type="button" disabled={groupPortionMultiplier >= 5.0}
                        onClick={() => setGroupPortionMultiplier(stepMultiplier(groupPortionMultiplier, 'up'))}
                        className="h-7 w-7 rounded-full border border-input bg-background flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Increase portion"
                      ><Plus className="h-3.5 w-3.5" /></button>
                      <button type="button"
                        onClick={() => {
                           if (groupPortionMultiplier !== 1.0) {
                             if (isReadOnly) {
                               triggerOverlay();
                             } else {
                               onScaleGroupPortion?.(boundary.entryId, groupPortionMultiplier);
                             }
                           }
                           setGroupScalingEntryId(null);
                           setGroupPortionMultiplier(1.0);
                        }}
                        className="text-xs font-medium text-primary hover:underline"
                      >Done</button>
                      {(() => {
                        const existingMult = entryPortionMultipliers?.get(boundary.entryId) ?? 1.0;
                        if (groupPortionMultiplier !== 1.0) {
                          const previewMult = existingMult * groupPortionMultiplier;
                          return (
                            <span className="text-xs text-muted-foreground tabular-nums">
                              ({scalePortion("1 portion", previewMult)}, {Math.round(groupCalories * groupPortionMultiplier)} cal)
                            </span>
                          );
                        }
                        if (existingMult !== 1.0) {
                          return (
                            <button type="button"
                              onClick={() => {
                                if (isReadOnly) { triggerOverlay(); return; }
                                onScaleGroupPortion?.(boundary.entryId, 1 / existingMult);
                                setGroupScalingEntryId(null);
                                setGroupPortionMultiplier(1.0);
                              }}
                              className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
                            >Reset to 1x</button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            );
            return; // Skip individual item rendering
          }

          // Skip items that are part of a collapsed group
          if (collapsedGroupIndices.has(index)) return;

          const entryBoundary = entryBoundaries ? isLastInBoundary(index, entryBoundaries) : null;
          const isFirstInEntry = entryBoundaries ? !!isFirstInBoundary(index, entryBoundaries) : false;
          const isLastInEntry = !!entryBoundary;
          const currentEntryId = item.entryId || null;
          const isCurrentExpanded = currentEntryId ? expandedEntryIds?.has(currentEntryId) : false;
          const currentRawInput = currentEntryId ? entryRawInputs?.get(currentEntryId) : null;

          // Check if this is the first item in an expanded group — render group header before it
          const groupHeader = groupHeaders.find(g => g.boundary.startIndex === index);
          if (groupHeader && isCurrentExpanded) {
            const { boundary, groupName } = groupHeader;
            const groupItems = items.slice(boundary.startIndex, boundary.endIndex + 1);
            const groupCalories = groupItems.reduce((sum, gi) => sum + gi.calories, 0);
            const groupProtein = groupItems.reduce((sum, gi) => sum + gi.protein, 0);
            const groupCarbs = groupItems.reduce((sum, gi) => sum + gi.carbs, 0);
            const groupFat = groupItems.reduce((sum, gi) => sum + gi.fat, 0);
            const entryIsNew = isEntryNew(currentEntryId, newEntryIds);
            const highlightClasses = getEntryHighlightClasses(entryIsNew, true, false);

            rows.push(
              <div key={`group-header-${boundary.entryId}`} className="contents">
                <div className={cn('grid gap-0.5 items-center group', gridCols, highlightClasses)}>
                  {selectable && <span></span>}
                  <div className="flex min-w-0">
                    {showEntryDividers && (
                      <div className="w-6 shrink-0 relative flex items-center justify-center self-stretch overflow-hidden">
                        <EntryChevron
                          expanded={true}
                          onToggle={() => onToggleEntryExpand?.(boundary.entryId)}
                        />
                      </div>
                    )}
                    <div className={cn("flex-1 min-w-0 rounded pl-1 py-1 flex items-baseline gap-1 flex-wrap focus-within:ring-2 focus-within:ring-focus-ring focus-within:bg-focus-bg", compact && "text-sm")}>
                       <DescriptionCell
                         value={groupName}
                         onSave={(newName) => onUpdateGroupName?.(boundary.entryId, newName)}
                         readOnly={isReadOnly}
                         onReadOnlyAttempt={triggerOverlay}
                         title={groupName}
                         className="line-clamp-2"
                       >
                        {(() => {
                          const cumulative = entryPortionMultipliers?.get(boundary.entryId) ?? 1.0;
                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setGroupScalingEntryId(groupScalingEntryId === boundary.entryId ? null : boundary.entryId);
                                setGroupPortionMultiplier(1.0);
                              }}
                              className="shrink-0 ml-1 text-xs text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground transition-colors"
                            >({scalePortion("1 portion", cumulative)})</button>
                          );
                        })()}
                      </DescriptionCell>
                    </div>
                  </div>
                  <span className={cn("px-1 py-1 text-center", compact ? "text-xs" : "text-heading")}>
                    {Math.round(groupCalories)}
                  </span>
                  <span className={cn("px-1 py-1 text-center text-muted-foreground", compact && "text-xs")}>
                    {Math.round(groupProtein)}/{Math.round(groupCarbs)}/{Math.round(groupFat)}
                  </span>
                  {hasDeleteColumn && (
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
                            This will permanently remove {groupName} ({groupItems.length} items).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => onDeleteEntry?.(boundary.entryId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                {/* Group-level portion scaling stepper */}
                {groupScalingEntryId === boundary.entryId && (
                  <div className={cn('grid gap-0.5', gridCols)}>
                    <div
                      className="col-span-full pl-6 pr-2 py-1.5 flex items-center gap-2"
                      tabIndex={-1}
                      ref={(el) => { if (el) el.focus(); }}
                      onBlur={(e) => {
                        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                        setGroupScalingEntryId(null);
                        setGroupPortionMultiplier(1.0);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.stopPropagation();
                          setGroupScalingEntryId(null);
                          setGroupPortionMultiplier(1.0);
                        }
                      }}
                    >
                      <button type="button" disabled={groupPortionMultiplier <= 0.25}
                        onClick={() => setGroupPortionMultiplier(stepMultiplier(groupPortionMultiplier, 'down'))}
                        className="h-7 w-7 rounded-full border border-input bg-background flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Decrease portion"
                      ><Minus className="h-3.5 w-3.5" /></button>
                      <span className={cn("text-sm font-medium min-w-[3rem] text-center tabular-nums", groupPortionMultiplier !== 1.0 && "text-primary")}>
                        {groupPortionMultiplier}x
                      </span>
                      <button type="button" disabled={groupPortionMultiplier >= 5.0}
                        onClick={() => setGroupPortionMultiplier(stepMultiplier(groupPortionMultiplier, 'up'))}
                        className="h-7 w-7 rounded-full border border-input bg-background flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Increase portion"
                      ><Plus className="h-3.5 w-3.5" /></button>
                      <button type="button"
                        onClick={() => {
                          if (groupPortionMultiplier !== 1.0) {
                            if (isReadOnly) {
                              triggerOverlay();
                             } else {
                               onScaleGroupPortion?.(boundary.entryId, groupPortionMultiplier);
                             }
                          }
                          setGroupScalingEntryId(null);
                          setGroupPortionMultiplier(1.0);
                        }}
                        className="text-xs font-medium text-primary hover:underline"
                      >Done</button>
                      {(() => {
                        const existingMult = entryPortionMultipliers?.get(boundary.entryId) ?? 1.0;
                        if (groupPortionMultiplier !== 1.0) {
                          const previewMult = existingMult * groupPortionMultiplier;
                          return (
                            <span className="text-xs text-muted-foreground tabular-nums">
                              ({scalePortion("1 portion", previewMult)}, {Math.round(groupCalories * groupPortionMultiplier)} cal)
                            </span>
                          );
                        }
                        if (existingMult !== 1.0) {
                          return (
                            <button type="button"
                              onClick={() => {
                                if (isReadOnly) { triggerOverlay(); return; }
                                onScaleGroupPortion?.(boundary.entryId, 1 / existingMult);
                                setGroupScalingEntryId(null);
                                setGroupPortionMultiplier(1.0);
                              }}
                              className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
                            >Reset to 1x</button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // For expanded group sub-items, check if this item is part of an expanded group
          const isInExpandedGroup = groupHeader || groupHeaders.some(g => 
            index > g.boundary.startIndex && index <= g.boundary.endIndex && expandedEntryIds?.has(g.boundary.entryId)
          );

          const isCaloriesEditing = editingCell?.index === index && editingCell?.field === 'calories';
          const previewMacros = getPreviewMacros(item, index);

          // Check if this entry should have grouped highlighting
          const entryIsNew = isEntryNew(currentEntryId, newEntryIds);
          // For items in expanded groups, adjust highlight classes
          const isGroupSubItem = isInExpandedGroup && groupHeaders.some(g => 
            index >= g.boundary.startIndex && index <= g.boundary.endIndex
          );
          const highlightClasses = isGroupSubItem 
            ? '' // Group header handles highlight for expanded groups
            : getEntryHighlightClasses(entryIsNew, isFirstInEntry, isLastInEntry);

          rows.push(
            <div key={item.uid || index} className="contents">
              <div
                className={cn(
                  'grid gap-0.5 items-center group',
                  gridCols,
                  highlightClasses,
                  isGroupSubItem && "pl-4 text-sm text-muted-foreground"
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
                  {showEntryDividers && !isGroupSubItem && (
                    <div className="w-6 shrink-0 relative flex items-center justify-center self-stretch overflow-hidden">
                      {isLastInEntry ? (
                        <EntryChevron
                          expanded={!!isCurrentExpanded}
                          onToggle={() => currentEntryId && onToggleEntryExpand?.(currentEntryId)}
                        />
                      ) : null}
                    </div>
                  )}
                  <div className={cn(
                    "flex-1 min-w-0 rounded pl-1 py-1",
                    "flex items-baseline gap-1 flex-wrap",
                    "focus-within:ring-2 focus-within:ring-focus-ring focus-within:bg-focus-bg"
                  )}>
                    <DescriptionCell
                      value={item.description}
                      onSave={(desc) => {
                        onUpdateItem?.(index, 'description', desc);
                      }}
                      title={getItemTooltip(item)}
                      className="line-clamp-2"
                    >
                      {item.portion && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPortionScalingIndex(portionScalingIndex === index ? null : index);
                            setPortionMultiplier(1.0);
                          }}
                          className="shrink-0 ml-1 text-xs text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground transition-colors"
                        >({item.portion})</button>
                      )}
                      {hasAnyEditedFields(item) && (
                        <span className="shrink-0 text-focus-ring font-bold whitespace-nowrap" title={formatEditedFields(item) || 'Edited'}> *</span>
                      )}
                    </DescriptionCell>
                  </div>
                </div>
              ) : (
                <div className="flex items-baseline min-w-0">
                  {/* Always reserve chevron space when showing entry dividers */}
                  {showEntryDividers && !isGroupSubItem && (
                    <div className="w-6 shrink-0 relative flex items-center justify-center self-stretch overflow-hidden">
                      {isLastInEntry ? (
                        <EntryChevron
                          expanded={!!isCurrentExpanded}
                          onToggle={() => currentEntryId && onToggleEntryExpand?.(currentEntryId)}
                        />
                      ) : null}
                    </div>
                  )}
                  <div className={cn("flex gap-1 flex-wrap flex-1 min-w-0 pl-1 pr-0 py-1", compact && "text-sm")}>
                    <span
                      title={getItemTooltip(item)}
                      className="line-clamp-2 min-w-0"
                    >
                      {item.description}
                    </span>
                    {item.portion && (
                      editable ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPortionScalingIndex(portionScalingIndex === index ? null : index);
                            setPortionMultiplier(1.0);
                          }}
                          className="shrink-0 ml-1 text-xs text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground transition-colors"
                        >({item.portion})</button>
                      ) : (
                        <span className="shrink-0 ml-1 text-xs text-muted-foreground whitespace-nowrap">({item.portion})</span>
                      )
                    )}
                    {hasAnyEditedFields(item) && (
                      <span className="shrink-0 text-focus-ring font-bold" title={formatEditedFields(item) || 'Edited'}> *</span>
                    )}
                  </div>
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
                    onFocus={() => inlineEdit.startEditing(index, 'calories', item.calories)}
                    onChange={(e) => inlineEdit.updateEditingValue(e.target.value)}
                    onBlur={() => inlineEdit.handleNumericBlur()}
                    onKeyDown={(e) => inlineEdit.handleNumericKeyDown(e)}
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
              
              {/* Entry delete button (only on last item of each entry, NOT for group sub-items) */}
              {!editable && hasEntryDeletion && !isGroupSubItem && (
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
              {/* For group sub-items, show delete button per item */}
              {!editable && hasEntryDeletion && isGroupSubItem && (
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
              </div>

              {/* Portion scaling stepper - inline below the item */}
              {portionScalingIndex === index && (
                <div className={cn('grid gap-0.5', gridCols)}>
                  <div
                    className="col-span-full pl-6 pr-2 py-1.5 flex items-center gap-2"
                    tabIndex={-1}
                    ref={(el) => { if (el) el.focus(); }}
                    onBlur={(e) => {
                      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                      setPortionScalingIndex(null);
                      setPortionMultiplier(1.0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.stopPropagation();
                        setPortionScalingIndex(null);
                        setPortionMultiplier(1.0);
                      }
                    }}
                  >
                    <button
                      type="button"
                      disabled={portionMultiplier <= 0.25}
                      onClick={() => setPortionMultiplier(stepMultiplier(portionMultiplier, 'down'))}
                      className="h-7 w-7 rounded-full border border-input bg-background flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Decrease portion"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className={cn(
                      "text-sm font-medium min-w-[3rem] text-center tabular-nums",
                      portionMultiplier !== 1.0 && "text-primary"
                    )}>
                      {portionMultiplier}x
                    </span>
                    <button
                      type="button"
                      disabled={portionMultiplier >= 5.0}
                      onClick={() => setPortionMultiplier(stepMultiplier(portionMultiplier, 'up'))}
                      className="h-7 w-7 rounded-full border border-input bg-background flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Increase portion"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (portionMultiplier !== 1.0) {
                          if (isReadOnly) {
                            triggerOverlay();
                          } else {
                            onUpdateItemBatch?.(index, scaleItemByMultiplier(item, portionMultiplier));
                          }
                        }
                        setPortionScalingIndex(null);
                        setPortionMultiplier(1.0);
                      }}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Done
                    </button>
                    {portionMultiplier !== 1.0 && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        ({item.portion ? scalePortion(item.portion, portionMultiplier) + ', ' : ''}{Math.round(item.calories * portionMultiplier)} cal)
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Expanded raw input - shows after last item in entry */}
              {showEntryDividers && isLastInEntry && isCurrentExpanded && (() => {
                const isFromSavedMeal = currentEntryId && entrySourceMealIds?.has(currentEntryId);
                const mealName = currentEntryId && entryMealNames?.get(currentEntryId);
                const entryItems = items.filter(i => i.entryId === currentEntryId);

                return (
                  <EntryExpandedPanel
                    rawInput={currentRawInput ?? null}
                    savedItemInfo={{
                      type: 'meal',
                      name: mealName ?? null,
                      isFromSaved: !!isFromSavedMeal,
                    }}
                    onSaveAs={onSaveAsMeal && currentEntryId
                      ? () => onSaveAsMeal(currentEntryId!, currentRawInput ?? null, entryItems)
                      : undefined}
                    gridCols={gridCols}
                    onCopyToToday={onCopyEntryToToday && currentEntryId
                      ? () => onCopyEntryToToday(currentEntryId!)
                      : undefined}
                    onShowDetails={onShowDetails && currentEntryId
                      ? () => {
                          const boundary = entryBoundaries?.find(b => b.entryId === currentEntryId);
                          onShowDetails(currentEntryId!, boundary?.startIndex ?? index, boundary?.endIndex);
                        }
                      : undefined}
                  />
                );
              })()}
            </div>
          );
        });




        return rows;
      })()}

      {/* Totals at bottom */}
      {showTotals && totalsPosition === 'bottom' && <TotalsRow />}
    </div>
  );
}
