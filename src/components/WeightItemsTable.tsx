import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { WeightSet } from '@/types/weight';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReadOnlyContext } from '@/contexts/ReadOnlyContext';
import { type WeightUnit, formatWeight, parseWeightToLbs, getWeightUnitLabel, formatDurationMmSs } from '@/lib/weight-units';
import { isCardioExercise } from '@/lib/exercise-metadata';
import { estimateCalorieBurn, formatCalorieBurnValue, type CalorieBurnSettings, type ExerciseInput } from '@/lib/calorie-burn';
import { useHasHover } from '@/hooks/use-has-hover';
import { type EntryBoundary, isFirstInBoundary, isLastInBoundary, isEntryNew, getEntryHighlightClasses, hasAnyEditedFields, formatEditedFields } from '@/lib/entry-boundaries';
import { EntryChevron } from '@/components/EntryChevron';
import { DeleteAllDialog } from '@/components/DeleteAllDialog';
import { DeleteGroupDialog } from '@/components/DeleteGroupDialog';
import { EntryExpandedPanel } from '@/components/EntryExpandedPanel';
import { useInlineEdit } from '@/hooks/useInlineEdit';

type EditableFieldKey = 'description' | 'sets' | 'reps' | 'weight_lbs';

interface DiffValues {
  sets?: number;
  reps?: number;
  weight_lbs?: number;
}


interface WeightItemsTableProps {
  items: WeightSet[];
  editable?: boolean;
  onUpdateItem?: (index: number, field: keyof WeightSet, value: string | number) => void;
  onRemoveItem?: (index: number) => void;
  newEntryIds?: Set<string>;
  showHeader?: boolean;
  entryBoundaries?: EntryBoundary[];
  onDeleteEntry?: (entryId: string) => void;
  onDeleteAll?: () => void;
  totalsPosition?: 'top' | 'bottom';
  showTotals?: boolean;
  entryRawInputs?: Map<string, string>;
  expandedEntryIds?: Set<string>;
  onToggleEntryExpand?: (entryId: string) => void;
  /** Callback when user wants to save an entry as a routine */
  onSaveAsRoutine?: (entryId: string, rawInput: string | null, exerciseSets: WeightSet[]) => void;
  /** When true, show inline labels after numeric values (e.g., "3 sets") */
  showInlineLabels?: boolean;
  /** Weight unit preference for display (lbs or kg) */
  weightUnit?: WeightUnit;
  /** Map of entry ID to routine name for entries from saved routines */
  entryRoutineNames?: Map<string, string>;
  /** Set of entry IDs that originated from a saved routine (even if routine was deleted) */
  entrySourceRoutineIds?: Set<string>;
  /** When true, show "cardio" label for cardio items even in read-only mode */
  showCardioLabel?: boolean;
  /** Map of item index to progression diffs for the update routine flow */
  diffs?: Map<number, DiffValues>;
  /** When true, use smaller text for compact preview contexts */
  compact?: boolean;
  /** Calorie burn settings for per-exercise estimation */
  calorieBurnSettings?: CalorieBurnSettings;
  /** When true, show a checkbox column on the left for selection */
  selectable?: boolean;
  /** Which row indices are currently selected (controlled) */
  selectedIndices?: Set<number>;
  /** Callback when a row's checkbox is toggled */
  onSelectionChange?: (index: number, selected: boolean) => void;
  /** Pre-formatted total calorie burn display string, e.g. "(~81-157 cal)" */
  totalCalorieBurnDisplay?: string;
}

/**
 * Helper component to render a diff value with appropriate styling.
 */
const DiffValue = ({ 
  value, 
  weightUnit,
  isWeight = false,
}: { 
  value?: number; 
  weightUnit?: WeightUnit;
  isWeight?: boolean;
}) => {
  if (value === undefined || value === 0) return <span></span>;
  
  // For weight, convert from lbs to display unit
  const displayValue = isWeight && weightUnit === 'kg' 
    ? Math.round(value * 0.453592) 
    : Math.abs(value);
  
  const sign = value > 0 ? '+' : '';
  const formattedValue = isWeight 
    ? `${sign}${value > 0 ? displayValue : -displayValue}`
    : `${sign}${value}`;
  
  return (
    <span className={cn(
      "text-center text-xs font-medium",
      value > 0 
        ? "text-emerald-600 dark:text-emerald-400" 
        : "text-amber-600 dark:text-amber-400"
    )}>
      {formattedValue}
    </span>
  );
};

export function WeightItemsTable({
  items,
  editable = false,
  onUpdateItem,
  onRemoveItem,
  newEntryIds,
  showHeader = true,
  entryBoundaries,
  onDeleteEntry,
  onDeleteAll,
  totalsPosition = 'top',
  showTotals = true,
  entryRawInputs,
  expandedEntryIds,
  onToggleEntryExpand,
  onSaveAsRoutine,
  showInlineLabels = false,
  weightUnit = 'lbs',
  entryRoutineNames,
  entrySourceRoutineIds,
  showCardioLabel = false,
  diffs,
  compact = false,
  selectable = false,
  selectedIndices,
  onSelectionChange,
  calorieBurnSettings,
  totalCalorieBurnDisplay,
}: WeightItemsTableProps) {
  const { isReadOnly, triggerOverlay } = useReadOnlyContext();
  const hasHover = useHasHover();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const inlineEdit = useInlineEdit<'sets' | 'reps' | 'weight_lbs'>({
    onSaveNumeric: (index, field, value) => {
      if (value <= 0) return; // Weight fields require positive values
      if (field === 'weight_lbs') {
        const lbsValue = parseWeightToLbs(value, weightUnit);
        onUpdateItem?.(index, field, lbsValue);
      } else {
        onUpdateItem?.(index, field, value);
      }
    },
    onSaveDescription: (index, newDescription) => {
      onUpdateItem?.(index, 'description', newDescription);
    },
    isReadOnly,
    triggerOverlay,
  });

  const { editingCell } = inlineEdit;
  // Calculate totals - volume stays in stored unit for consistency, convert for display
  const totals = useMemo(() => {
    const volumeLbs = items.reduce((sum, item) => sum + (item.sets * item.reps * item.weight_lbs), 0);
    return {
      sets: items.reduce((sum, item) => sum + item.sets, 0),
      reps: items.reduce((sum, item) => sum + (item.sets * item.reps), 0),
      volume: weightUnit === 'kg' ? volumeLbs * 0.453592 : volumeLbs,
    };
  }, [items, weightUnit]);

  const hasEntryDeletion = entryBoundaries && onDeleteEntry;
  const showEntryDividers = entryBoundaries && entryBoundaries.length > 0;

  // Grid: [Checkbox] | Description | Sets | Reps | Weight | [Delete]
  const getGridCols = (showDelete: boolean, showCheckbox: boolean) => {
    if (showCheckbox && showDelete) {
      return 'grid-cols-[24px_1fr_45px_45px_60px_24px]';
    } else if (showCheckbox) {
      return 'grid-cols-[24px_1fr_45px_45px_60px]';
    } else if (showDelete) {
      return 'grid-cols-[1fr_45px_45px_60px_24px]';
    }
    return 'grid-cols-[1fr_45px_45px_60px]';
  };

  const hasDeleteColumn = editable || hasEntryDeletion;
  const gridCols = getGridCols(!!hasDeleteColumn, selectable);

  const TotalsRow = () => (
    <div className={cn(
      'grid gap-0.5 items-center group',
      totalsPosition === 'top' && 'bg-slate-200 dark:bg-slate-700 rounded py-1.5 border border-slate-300 dark:border-slate-600',
      totalsPosition === 'bottom' && 'pt-1.5 border-t-2 border-slate-300 dark:border-slate-600',
      gridCols
    )}>
      {selectable && <span></span>}
      <span className={cn("px-1 font-semibold", showEntryDividers && "pl-4", compact && "text-sm")}>
        Total
        {totalCalorieBurnDisplay && (
          <Tooltip
            open={hasHover ? undefined : activeTooltip === 'total'}
            onOpenChange={hasHover ? undefined : (open) => setActiveTooltip(open ? 'total' : null)}
          >
            <TooltipTrigger asChild>
              <span
                className="text-[11px] font-normal italic text-muted-foreground ml-1 cursor-help"
                onClick={!hasHover ? () => setActiveTooltip(prev => prev === 'total' ? null : 'total') : undefined}
                tabIndex={0}
                role="button"
              >{totalCalorieBurnDisplay}</span>
            </TooltipTrigger>
            <TooltipContent sideOffset={5} onPointerDownOutside={(e) => e.preventDefault()}>Refine this estimate with your weight, height, and age in Settings.</TooltipContent>
          </Tooltip>
        )}
      </span>
      <span className="px-1 text-heading text-center">{totals.sets}</span>
      <span className="px-1 text-heading text-center">{totals.reps}</span>
      <span 
        className="px-1 text-heading text-center text-xs"
        title="Training volume – the total weight lifted (sets × reps × weight)"
      >
        {Math.round(totals.volume).toLocaleString()}
      </span>
      {hasDeleteColumn && (
        onDeleteAll ? (
          <DeleteAllDialog itemLabel="exercises" onConfirm={onDeleteAll} />
        ) : (
          <span></span>
        )
      )}
    </div>
  );

  const getNumberInputClasses = (isEditing: boolean) => cn(
    "h-auto min-h-7 px-1 py-1 border-0 bg-transparent transition-all text-center",
    isEditing
      ? "ring-2 ring-focus-ring bg-focus-bg focus-visible:ring-focus-ring"
      : "hover:bg-muted/50 focus:bg-muted/50"
  );

  return (
    <TooltipProvider delayDuration={150}>
    <div className="space-y-1">
      {/* Totals at top */}
      {showTotals && items.length > 0 && totalsPosition === 'top' && <TotalsRow />}

      {/* Header row */}
      {showHeader && (
        <div className={cn('grid gap-0.5 text-muted-foreground items-center text-xs', gridCols)}>
          {selectable && <span></span>}
          <span className={cn("px-1", showEntryDividers && "pl-4")}></span>
          <span className="px-1 text-center">Sets</span>
          <span className="px-1 text-center">Reps</span>
          <span className="px-1 text-center">{getWeightUnitLabel(weightUnit)}</span>
          {hasDeleteColumn && <span></span>}
        </div>
      )}

      {/* Mini header when main header is hidden but labels requested */}
      {!showHeader && showInlineLabels && items.length > 0 && (
        <div className={cn('grid gap-0.5 items-center text-muted-foreground', compact ? 'text-[10px]' : 'text-[10px]', gridCols)}>
          {selectable && <span></span>}
          <span></span>
          <span className="px-1 text-center">Sets</span>
          <span className="px-1 text-center">Reps</span>
          <span className="px-1 text-center">{getWeightUnitLabel(weightUnit)}</span>
          {hasDeleteColumn && <span></span>}
        </div>
      )}

      {/* Data rows */}
      {items.map((item, index) => {
        const isFirstInEntry = entryBoundaries ? !!isFirstInBoundary(index, entryBoundaries) : false;
        const isLastInEntry = entryBoundaries ? !!isLastInBoundary(index, entryBoundaries) : false;
        const currentEntryId = item.entryId || null;
        const entryIsNew = isEntryNew(currentEntryId, newEntryIds);
        const highlightClasses = getEntryHighlightClasses(entryIsNew, isFirstInEntry, isLastInEntry);
        const isCurrentExpanded = currentEntryId ? expandedEntryIds?.has(currentEntryId) : false;
        const currentRawInput = currentEntryId ? entryRawInputs?.get(currentEntryId) : null;
        const hasRawInput = !!currentRawInput;
        const isFromRoutine = currentEntryId ? entrySourceRoutineIds?.has(currentEntryId) : false;
        const isExpandable = hasRawInput || isFromRoutine;

        return (
          <div key={item.uid || index} className="contents">
            <div
              className={cn(
                'grid gap-0.5 items-center group',
                gridCols,
                highlightClasses
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
              {/* Description cell */}
              {editable ? (
                <div className="flex min-w-0">
                  {showEntryDividers && (
                    <div className="w-4 shrink-0 relative flex items-center justify-center self-stretch">
                      {isLastInEntry && isExpandable ? (
                        <EntryChevron
                          expanded={!!isCurrentExpanded}
                          onToggle={() => currentEntryId && onToggleEntryExpand?.(currentEntryId)}
                        />
                      ) : null}
                    </div>
                  )}
                  <div className={cn(
                    "flex-1 min-w-0 rounded pl-1 py-1 line-clamp-2",
                    "focus-within:ring-2 focus-within:ring-focus-ring focus-within:bg-focus-bg"
                  )}>
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      spellCheck={false}
                      title={item.description}
                      ref={(el) => {
                        if (el && el.textContent !== item.description && document.activeElement !== el) {
                          el.textContent = item.description;
                        }
                      }}
                      {...inlineEdit.getDescriptionEditProps(index, item.description)}
                      className="border-0 bg-transparent focus:outline-none cursor-text hover:bg-muted/50"
                    />
                    {hasAnyEditedFields(item) && (
                      <span className="text-focus-ring font-bold" title={formatEditedFields(item) || 'Edited'}> *</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-baseline min-w-0">
                  {showEntryDividers && (
                    <div className="w-4 shrink-0 relative flex items-center justify-center self-stretch">
                      {isLastInEntry && isExpandable ? (
                        <EntryChevron
                          expanded={!!isCurrentExpanded}
                          onToggle={() => currentEntryId && onToggleEntryExpand?.(currentEntryId)}
                        />
                      ) : null}
                    </div>
                  )}
                  <span 
                    title={item.description}
                    className={cn("pl-1 pr-0 py-1 line-clamp-2 shrink min-w-0", compact && "text-sm")}
                  >
                    {item.description}
                    {hasAnyEditedFields(item) && (
                      <span className="text-focus-ring font-bold" title={formatEditedFields(item) || 'Edited'}> *</span>
                    )}
                  </span>
                </div>
              )}

              {/* Sets, Reps, Weight - show "cardio" label for cardio items */}
              {(() => {
                const hasDuration = (item.duration_minutes ?? 0) > 0;
                const hasDistance = (item.distance_miles ?? 0) > 0;
                const isCardioItem = item.weight_lbs === 0 && 
                  (hasDuration || hasDistance || isCardioExercise(item.exercise_key));
                
                if (isCardioItem && (editable || showCardioLabel)) {
                  // Build a data-driven shorthand label for cardio items
                  const parts: string[] = [];
                  const dist = item.distance_miles ?? 0;
                  const dur = item.duration_minutes ?? 0;

                  if (dist > 0) parts.push(`${dist.toFixed(2)} mi`);
                  if (dur > 0) parts.push(formatDurationMmSs(dur));
                  if (dist > 0 && dur > 0) {
                    const mph = dist / (dur / 60);
                    parts.push(`${mph.toFixed(1)} mph`);
                  }

                  const label = parts.length > 0 ? parts.join(', ') : 'cardio';

                  return (
                    <span className="col-span-3 text-center text-xs text-muted-foreground italic py-1">
                      {label}
                    </span>
                  );
                }
                
                // Normal rendering for weight exercises
                return (
                  <>
                    {/* Sets */}
                    {editable ? (
                      <Input
                        type="number"
                        value={
                          editingCell?.index === index && editingCell?.field === 'sets'
                            ? String(editingCell.value)
                            : item.sets
                        }
                        onFocus={() => inlineEdit.startEditing(index, 'sets', item.sets)}
                        onChange={(e) => inlineEdit.updateEditingValue(e.target.value)}
                        onKeyDown={(e) => inlineEdit.handleNumericKeyDown(e)}
                        onBlur={() => inlineEdit.handleNumericBlur()}
                        className={getNumberInputClasses(editingCell?.index === index && editingCell?.field === 'sets')}
                      />
                    ) : (
                      <span className="px-1 py-1 text-center">
                        {item.sets === 0 && ((item.duration_minutes ?? 0) > 0 || (item.distance_miles ?? 0) > 0) ? '—' : item.sets}
                      </span>
                    )}

                    {/* Reps */}
                    {editable ? (
                      <Input
                        type="number"
                        value={
                          editingCell?.index === index && editingCell?.field === 'reps'
                            ? String(editingCell.value)
                            : item.reps
                        }
                        onFocus={() => inlineEdit.startEditing(index, 'reps', item.reps)}
                        onChange={(e) => inlineEdit.updateEditingValue(e.target.value)}
                        onKeyDown={(e) => inlineEdit.handleNumericKeyDown(e)}
                        onBlur={() => inlineEdit.handleNumericBlur()}
                        className={getNumberInputClasses(editingCell?.index === index && editingCell?.field === 'reps')}
                      />
                    ) : (
                      <span className="px-1 py-1 text-center">
                        {item.reps === 0 && ((item.duration_minutes ?? 0) > 0 || (item.distance_miles ?? 0) > 0) ? '—' : item.reps}
                      </span>
                    )}

                    {/* Weight */}
                    {editable ? (
                      <Input
                        type="number"
                        step={weightUnit === 'kg' ? '0.5' : '1'}
                        value={
                          editingCell?.index === index && editingCell?.field === 'weight_lbs'
                            ? String(editingCell.value)
                            : formatWeight(item.weight_lbs, weightUnit, weightUnit === 'kg' ? 1 : 0)
                        }
                        onFocus={() => {
                          const displayValue = weightUnit === 'kg' 
                            ? parseFloat(formatWeight(item.weight_lbs, 'kg', 1))
                            : item.weight_lbs;
                          inlineEdit.startEditing(index, 'weight_lbs', displayValue);
                        }}
                        onChange={(e) => inlineEdit.updateEditingValue(e.target.value, parseFloat)}
                        onKeyDown={(e) => inlineEdit.handleNumericKeyDown(e)}
                        onBlur={() => inlineEdit.handleNumericBlur()}
                        className={getNumberInputClasses(editingCell?.index === index && editingCell?.field === 'weight_lbs')}
                      />
                    ) : (
                      <span className="px-1 py-1 text-center">
                        {(() => {
                          const dur = item.duration_minutes ?? 0;
                          const dist = item.distance_miles ?? 0;
                          if (item.weight_lbs === 0 && (dur > 0 || dist > 0 || isCardioExercise(item.exercise_key))) {
                            if (dur > 0) return `${Number(dur).toFixed(1)} min`;
                            if (dist > 0) return `${Number(dist).toFixed(2)} mi`;
                            return 'cardio';
                          }
                          return formatWeight(item.weight_lbs, weightUnit, weightUnit === 'kg' ? 1 : 0);
                        })()}
                      </span>
                    )}
                  </>
                );
              })()}

              {/* Delete */}
              {hasDeleteColumn && (
                hasEntryDeletion && isLastInEntry ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteEntry?.(currentEntryId!)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                ) : editable ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveItem?.(index)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    aria-label="Delete exercise"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <span></span>
                )
                )}
            </div>

            
            {/* Diff row - show progression delta if provided */}
            {diffs?.has(index) && (() => {
              const diff = diffs.get(index)!;
              const hasDiff = diff.sets || diff.reps || diff.weight_lbs;
              if (!hasDiff) return null;
              
              return (
                <div className={cn('grid gap-0.5 items-center', gridCols)}>
                  <span className={cn("px-1", showEntryDividers && "pl-4")}></span>
                  <span className="px-1 text-center">
                    <DiffValue value={diff.sets} />
                  </span>
                  <span className="px-1 text-center">
                    <DiffValue value={diff.reps} />
                  </span>
                  <span className="px-1 text-center">
                    <DiffValue value={diff.weight_lbs} weightUnit={weightUnit} isWeight />
                  </span>
                  {hasDeleteColumn && <span></span>}
                </div>
              );
            })()}

            {/* Expanded content section */}
            {showEntryDividers && isLastInEntry && isCurrentExpanded && (() => {
              const isFromSavedRoutine = !!(currentEntryId && entrySourceRoutineIds?.has(currentEntryId));
              const routineName = (currentEntryId && entryRoutineNames?.get(currentEntryId)) || null;
              const entryExercises = items.filter(i => i.entryId === currentEntryId);

              // Calorie burn estimates as extraContent
              const calorieBurnContent = calorieBurnSettings?.calorieBurnEnabled ? (() => {
                const parts = entryExercises.map(ex => {
                  const result = estimateCalorieBurn({
                    exercise_key: ex.exercise_key,
                    exercise_subtype: ex.exercise_subtype,
                    sets: ex.sets,
                    reps: ex.reps,
                    weight_lbs: ex.weight_lbs,
                    duration_minutes: ex.duration_minutes,
                    distance_miles: ex.distance_miles,
                    exercise_metadata: ex.exercise_metadata,
                  }, calorieBurnSettings);
                  return { name: ex.description, display: formatCalorieBurnValue(result) };
                }).filter(p => p.display);
                if (parts.length === 0) return null;
                const detail = parts.length === 1
                  ? parts[0].display
                  : parts.map(p => `${p.display} (${p.name})`).join(', ');
                return (
                  <p className="text-xs text-muted-foreground italic">
                    Estimated calories burned: {detail}
                  </p>
                );
              })() : undefined;

              return (
                <EntryExpandedPanel
                  items={entryExercises}
                  rawInput={currentRawInput ?? null}
                  savedItemInfo={{
                    type: 'routine',
                    name: routineName,
                    isFromSaved: isFromSavedRoutine,
                  }}
                  onSaveAs={onSaveAsRoutine && currentEntryId ? () => {
                    onSaveAsRoutine(currentEntryId, currentRawInput ?? null, entryExercises);
                  } : undefined}
                  onDeleteEntry={onDeleteEntry && currentEntryId ? () => onDeleteEntry(currentEntryId) : undefined}
                  gridCols={gridCols}
                  extraContent={calorieBurnContent}
                />
              );
            })()}
          </div>
        );
      })}

      {/* Totals at bottom */}
      {showTotals && items.length > 0 && totalsPosition === 'bottom' && <TotalsRow />}
    </div>
    </TooltipProvider>
  );
}
