import { useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { WeightSet } from '@/types/weight';
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
import { type WeightUnit, formatWeight, parseWeightToLbs, getWeightUnitLabel, formatDurationMmSs } from '@/lib/weight-units';
import { isCardioExercise } from '@/lib/exercise-metadata';
import { estimateCalorieBurn, formatCalorieBurn, type CalorieBurnSettings, type ExerciseInput } from '@/lib/calorie-burn';

type EditableFieldKey = 'description' | 'sets' | 'reps' | 'weight_lbs';

interface DiffValues {
  sets?: number;
  reps?: number;
  weight_lbs?: number;
}

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
  
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const descriptionOriginalRef = useRef<string>('');

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
      
      if (editingCell && editingCell.value !== editingCell.originalValue) {
        onUpdateItem?.(index, field, editingCell.value);
      }
      setEditingCell(null);
      (e.target as HTMLElement).blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingCell(null);
      (e.target as HTMLElement).blur();
    }
  };

  const handleDescriptionKeyDown = (
    e: React.KeyboardEvent<HTMLSpanElement>,
    index: number
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
      }
      (e.target as HTMLElement).blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.currentTarget.textContent = descriptionOriginalRef.current;
      (e.target as HTMLElement).blur();
    }
  };

  const handleDescriptionFocus = (e: React.FocusEvent<HTMLSpanElement>, item: WeightSet) => {
    descriptionOriginalRef.current = item.description;
  };

  const handleDescriptionBlur = (
    e: React.FocusEvent<HTMLSpanElement>,
    index: number
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
    }
  };

  const hasAnyEditedFields = (item: WeightSet): boolean => {
    return (item.editedFields?.length ?? 0) > 0;
  };

  const formatEditedFields = (item: WeightSet): string | null => {
    if (!item.editedFields || item.editedFields.length === 0) return null;
    const fieldLabels = item.editedFields.map(field => 
      field.charAt(0).toUpperCase() + field.slice(1)
    );
    return `Edited: ${fieldLabels.join(', ')}`;
  };

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

  const isLastItemInEntry = (index: number): EntryBoundary | null => {
    if (!entryBoundaries) return null;
    const boundary = entryBoundaries.find(b => b.endIndex === index);
    return boundary || null;
  };

  const isFirstItemInEntry = (index: number): boolean => {
    if (!entryBoundaries) return false;
    return entryBoundaries.some(b => b.startIndex === index);
  };

  // Note: entryBoundaries is kept for visual grouping (isFirstItemInEntry, isLastItemInEntry)
  // but data lookups use item.entryId directly to avoid race conditions

  const hasDeleteColumn = editable || hasEntryDeletion;
  const gridCols = getGridCols(!!hasDeleteColumn, selectable);

  const isNewEntry = (entryId: string | null): boolean => {
    return entryId ? (newEntryIds?.has(entryId) ?? false) : false;
  };

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
        {totalCalorieBurnDisplay && <span className="text-[11px] font-normal italic text-muted-foreground ml-1">{totalCalorieBurnDisplay}</span>}
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                aria-label="Delete all exercises"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="left-4 right-4 translate-x-0 w-auto max-w-[calc(100vw-32px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all exercises?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove all exercises for today.
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

  const getNumberInputClasses = (isEditing: boolean) => cn(
    "h-auto min-h-7 px-1 py-1 border-0 bg-transparent transition-all text-center",
    isEditing
      ? "ring-2 ring-focus-ring bg-focus-bg focus-visible:ring-focus-ring"
      : "hover:bg-muted/50 focus:bg-muted/50"
  );

  return (
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
        const isFirstInEntry = isFirstItemInEntry(index);
        const isLastInEntry = !!isLastItemInEntry(index);
        const currentEntryId = item.entryId || null;
        const entryIsNew = isNewEntry(currentEntryId);
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
              {/* Description cell */}
              {editable ? (
                <div className="flex min-w-0">
                  {showEntryDividers && (
                    <div className="w-4 shrink-0 relative flex items-center justify-center self-stretch">
                      {isLastInEntry && isExpandable ? (
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
                      onFocus={(e) => handleDescriptionFocus(e, item)}
                      onBlur={(e) => handleDescriptionBlur(e, index)}
                      onKeyDown={(e) => handleDescriptionKeyDown(e, index)}
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
                        onFocus={() => setEditingCell({
                          index,
                          field: 'sets',
                          value: item.sets,
                          originalValue: item.sets
                        })}
                        onChange={(e) => {
                          if (editingCell) {
                            setEditingCell({ ...editingCell, value: parseInt(e.target.value, 10) || 0 });
                          }
                        }}
                        onKeyDown={(e) => handleKeyDown(e, index, 'sets')}
                        onBlur={() => {
                          if (editingCell && editingCell.value !== editingCell.originalValue && !isReadOnly) {
                            const numValue = Number(editingCell.value);
                            if (numValue > 0) {
                              onUpdateItem?.(index, 'sets', editingCell.value);
                            }
                          }
                          setEditingCell(null);
                        }}
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
                        onFocus={() => setEditingCell({
                          index,
                          field: 'reps',
                          value: item.reps,
                          originalValue: item.reps
                        })}
                        onChange={(e) => {
                          if (editingCell) {
                            setEditingCell({ ...editingCell, value: parseInt(e.target.value, 10) || 0 });
                          }
                        }}
                        onKeyDown={(e) => handleKeyDown(e, index, 'reps')}
                        onBlur={() => {
                          if (editingCell && editingCell.value !== editingCell.originalValue && !isReadOnly) {
                            const numValue = Number(editingCell.value);
                            if (numValue > 0) {
                              onUpdateItem?.(index, 'reps', editingCell.value);
                            }
                          }
                          setEditingCell(null);
                        }}
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
                          setEditingCell({
                            index,
                            field: 'weight_lbs',
                            value: displayValue,
                            originalValue: displayValue
                          });
                        }}
                        onChange={(e) => {
                          if (editingCell) {
                            setEditingCell({ ...editingCell, value: parseFloat(e.target.value) || 0 });
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (isReadOnly) {
                              triggerOverlay();
                              setEditingCell(null);
                              (e.target as HTMLElement).blur();
                              return;
                            }
                            if (editingCell && editingCell.value !== editingCell.originalValue) {
                              const lbsValue = parseWeightToLbs(editingCell.value as number, weightUnit);
                              onUpdateItem?.(index, 'weight_lbs', lbsValue);
                            }
                            setEditingCell(null);
                            (e.target as HTMLElement).blur();
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            setEditingCell(null);
                            (e.target as HTMLElement).blur();
                          }
                        }}
                        onBlur={() => {
                          if (editingCell && editingCell.value !== editingCell.originalValue && !isReadOnly) {
                            const numValue = Number(editingCell.value);
                            if (numValue > 0) {
                              const lbsValue = parseWeightToLbs(numValue, weightUnit);
                              onUpdateItem?.(index, 'weight_lbs', lbsValue);
                            }
                          }
                          setEditingCell(null);
                        }}
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
              // Check if this entry came from a saved routine (by ID, not name lookup)
              const isFromSavedRoutine = currentEntryId && entrySourceRoutineIds?.has(currentEntryId);
              const routineName = currentEntryId && entryRoutineNames?.get(currentEntryId);
              
              // Get all exercises in this entry for cardio metadata
              const entryExercises = items.filter(i => i.entryId === currentEntryId);
              
              // Build cardio metadata for exercises that have duration/distance
              const cardioItems = entryExercises.filter(ex => 
                (ex.duration_minutes ?? 0) > 0 || (ex.distance_miles ?? 0) > 0
              );
              
              return (
                <div className={cn('grid gap-0.5', gridCols)}>
                  <div className="col-span-full pl-6 py-1 space-y-1">
                    {/* Cardio metadata - show for each cardio item */}
                    {cardioItems.map((ex, idx) => {
                      const duration = ex.duration_minutes ?? 0;
                      const distance = ex.distance_miles ?? 0;
                      
                      // Calculate pace (min/mi) and speed (mph)
                      const hasBothMetrics = duration > 0 && distance > 0;
                      const paceDecimal = hasBothMetrics ? duration / distance : null;
                      const mph = hasBothMetrics 
                        ? (distance / (duration / 60)).toFixed(1) 
                        : null;
                      
                      // Build display string
                      let displayParts: string;
                      if (hasBothMetrics) {
                        const paceFormatted = formatDurationMmSs(paceDecimal!);
                        const durationFormatted = formatDurationMmSs(duration);
                        displayParts = `${distance.toFixed(2)} mi in ${durationFormatted} (${paceFormatted}/mi, ${mph} mph)`;
                      } else if (duration > 0) {
                        displayParts = formatDurationMmSs(duration);
                      } else if (distance > 0) {
                        displayParts = `${distance.toFixed(2)} mi`;
                      } else {
                        displayParts = '';
                      }
                      
                      return (
                        <p key={ex.uid || idx} className="text-sm text-muted-foreground">
                          {cardioItems.length > 1 && (
                            <><span className="font-medium">{ex.description}:</span>{' '}</>
                          )}
                          {displayParts}
                        </p>
                      );
                    })}
                    
                    {/* Per-exercise calorie burn estimates */}
                    {calorieBurnSettings?.calorieBurnEnabled && entryExercises.map((ex, idx) => {
                      const exerciseInput: ExerciseInput = {
                        exercise_key: ex.exercise_key,
                        exercise_subtype: ex.exercise_subtype,
                        sets: ex.sets,
                        reps: ex.reps,
                        weight_lbs: ex.weight_lbs,
                        duration_minutes: ex.duration_minutes,
                        distance_miles: ex.distance_miles,
                        exercise_metadata: ex.exercise_metadata,
                      };
                      const result = estimateCalorieBurn(exerciseInput, calorieBurnSettings);
                      const display = formatCalorieBurn(result);
                      if (!display) return null;
                      return (
                        <p key={`cal-${ex.uid || idx}`} className="text-sm text-muted-foreground">
                          {entryExercises.length > 1 && (
                            <><span className="font-medium">{ex.description}:</span>{' '}</>
                          )}
                          {display}
                        </p>
                      );
                    })}

                    {/* Only show raw input if NOT from a saved routine */}
                    {!isFromSavedRoutine && currentRawInput && (
                      <p className="text-sm text-muted-foreground italic">
                        Logged as: {currentRawInput}
                      </p>
                    )}
                    {/* Show routine info if from saved routine, otherwise show "Save as routine" */}
                    {isFromSavedRoutine ? (
                      <p className="text-sm text-muted-foreground italic">
                        From saved routine:{' '}
                        {routineName ? (
                          <Link 
                            to="/settings" 
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {routineName}
                          </Link>
                        ) : (
                          <span>(deleted)</span>
                        )}
                      </p>
                    ) : onSaveAsRoutine && currentEntryId && (
                      <button
                        onClick={() => {
                          // Gather all exercises in this entry
                          const entryExercises = items.filter(i => i.entryId === currentEntryId);
                          onSaveAsRoutine(currentEntryId, currentRawInput ?? null, entryExercises);
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Save as routine
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
      {showTotals && items.length > 0 && totalsPosition === 'bottom' && <TotalsRow />}
    </div>
  );
}
