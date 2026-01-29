import { useState, useRef, useMemo } from 'react';
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
import { type WeightUnit, formatWeight, parseWeightToLbs, getWeightUnitLabel } from '@/lib/weight-units';

type EditableFieldKey = 'description' | 'sets' | 'reps' | 'weight_lbs';

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
}

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

  // Grid: Description | Sets | Reps | Weight | Delete
  const getGridCols = (showDelete: boolean) => {
    return showDelete
      ? 'grid-cols-[1fr_45px_45px_60px_24px]'
      : 'grid-cols-[1fr_45px_45px_60px]';
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

  const getEntryIdForItem = (index: number): string | null => {
    if (!entryBoundaries) return null;
    const boundary = entryBoundaries.find(
      b => index >= b.startIndex && index <= b.endIndex
    );
    return boundary?.entryId || null;
  };

  const hasDeleteColumn = editable || hasEntryDeletion;
  const gridCols = getGridCols(!!hasDeleteColumn);

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
      <span className={cn("px-1 font-semibold", showEntryDividers && "pl-4")}>Total</span>
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
          <span className={cn("px-1", showEntryDividers && "pl-4")}></span>
          <span className="px-1 text-center">Sets</span>
          <span className="px-1 text-center">Reps</span>
          <span className="px-1 text-center">{getWeightUnitLabel(weightUnit)}</span>
          {hasDeleteColumn && <span></span>}
        </div>
      )}

      {/* Mini header when main header is hidden but labels requested */}
      {!showHeader && showInlineLabels && items.length > 0 && (
        <div className={cn('grid gap-0.5 items-center text-[10px] text-muted-foreground', gridCols)}>
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
        const currentEntryId = getEntryIdForItem(index);
        const entryIsNew = isNewEntry(currentEntryId);
        const isCurrentExpanded = currentEntryId ? expandedEntryIds?.has(currentEntryId) : false;
        const currentRawInput = currentEntryId ? entryRawInputs?.get(currentEntryId) : null;
        const hasRawInput = !!currentRawInput;

        return (
          <div key={item.uid || index} className="contents">
            <div
              className={cn(
                'grid gap-0.5 items-center group',
                gridCols,
                entryIsNew && isFirstInEntry && !isLastInEntry && "rounded-t-md animate-outline-fade-top",
                entryIsNew && !isFirstInEntry && isLastInEntry && "rounded-b-md animate-outline-fade-bottom",
                entryIsNew && !isFirstInEntry && !isLastInEntry && "animate-outline-fade-middle",
                entryIsNew && isFirstInEntry && isLastInEntry && "rounded-md animate-outline-fade"
              )}
            >
              {/* Description cell */}
              {editable ? (
                <div className="flex min-w-0">
                  {showEntryDividers && (
                    <div className="w-4 shrink-0 relative flex items-center justify-center self-stretch">
                      {isLastInEntry && hasRawInput ? (
                        <button
                          onClick={() => currentEntryId && onToggleEntryExpand?.(currentEntryId)}
                          className={cn(
                            "absolute inset-0 w-[44px] -left-3 flex items-center justify-center text-muted-foreground/60 hover:text-muted-foreground transition-transform text-xl",
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
                      {isLastInEntry && hasRawInput ? (
                        <button
                          onClick={() => currentEntryId && onToggleEntryExpand?.(currentEntryId)}
                          className={cn(
                            "absolute inset-0 w-[44px] -left-3 flex items-center justify-center text-muted-foreground/60 hover:text-muted-foreground transition-transform text-xl",
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
                    className="pl-1 pr-0 py-1 line-clamp-2 shrink min-w-0"
                  >
                    {item.description}
                    {hasAnyEditedFields(item) && (
                      <span className="text-focus-ring font-bold" title={formatEditedFields(item) || 'Edited'}> *</span>
                    )}
                  </span>
                </div>
              )}

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
                    // Save on blur if value changed and valid (positive)
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
                  {item.sets}
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
                    // Save on blur if value changed and valid (positive)
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
                  {item.reps}
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
                    // Convert stored lbs to display unit for editing
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
                        // Convert user input back to lbs for storage
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
                    // Save on blur if value changed and valid (positive)
                    if (editingCell && editingCell.value !== editingCell.originalValue && !isReadOnly) {
                      const numValue = Number(editingCell.value);
                      if (numValue > 0) {
                        // Convert user input back to lbs for storage
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
                  {formatWeight(item.weight_lbs, weightUnit, weightUnit === 'kg' ? 1 : 0)}
                </span>
              )}

              {/* Delete */}
              {hasDeleteColumn && (
                hasEntryDeletion && isLastInEntry ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteEntry?.(currentEntryId!)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                ) : editable ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveItem?.(index)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <span></span>
                )
                )}
            </div>
            
            {/* Expanded content section */}
            {showEntryDividers && isLastInEntry && isCurrentExpanded && currentRawInput && (
              <div className={cn('grid gap-0.5', gridCols)}>
                <div className="col-span-full pl-6 py-1 space-y-1">
                  <p className="text-muted-foreground whitespace-pre-wrap italic">
                    {currentRawInput}
                  </p>
                  {onSaveAsRoutine && (
                    <button
                      onClick={() => {
                        // Gather all exercises in this entry
                        const entryExercises = items.filter(i => i.entryId === currentEntryId);
                        onSaveAsRoutine(currentEntryId!, currentRawInput, entryExercises);
                      }}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Save as routine
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Totals at bottom */}
      {showTotals && items.length > 0 && totalsPosition === 'bottom' && <TotalsRow />}
    </div>
  );
}
