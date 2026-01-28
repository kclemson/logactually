import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, addDays, subDays, isToday, parseISO, isFuture } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogInput, LogInputRef } from '@/components/LogInput';
import { WeightItemsTable } from '@/components/WeightItemsTable';
import { CreateRoutineDialog } from '@/components/CreateRoutineDialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAnalyzeWeights } from '@/hooks/useAnalyzeWeights';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { useEditableItems } from '@/hooks/useEditableItems';
import { WeightSet, WeightEditableField, SavedExerciseSet } from '@/types/weight';

const WEIGHT_EDITABLE_FIELDS: WeightEditableField[] = ['description', 'sets', 'reps', 'weight_lbs'];

// Wrapper component: extracts date from URL, forces remount via key
const WeightLog = () => {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const dateKey = dateParam || format(new Date(), 'yyyy-MM-dd');
  
  return <WeightLogContent key={dateKey} initialDate={dateKey} />;
};

export default WeightLog;

interface WeightLogContentProps {
  initialDate: string;
}

const WeightLogContent = ({ initialDate }: WeightLogContentProps) => {
  const [, setSearchParams] = useSearchParams();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set());
  const [createRoutineDialogOpen, setCreateRoutineDialogOpen] = useState(false);
  
  // Track pending entry ID to extend loading state until rows are visible
  const [pendingEntryId, setPendingEntryId] = useState<string | null>(null);
  
  const dateStr = initialDate;
  const selectedDate = parseISO(initialDate);
  const isTodaySelected = isToday(selectedDate);
  
  const { weightSets, isFetching, createEntry, updateSet, deleteSet, deleteEntry, deleteAllByDate } = useWeightEntries(dateStr);
  const { analyzeWeights, isAnalyzing, error: analyzeError } = useAnalyzeWeights();
  
  const weightInputRef = useRef<LogInputRef>(null);

  // Navigation updates URL directly - triggers remount via wrapper's key
  const goToPreviousDay = () => {
    const prevDate = format(subDays(selectedDate, 1), 'yyyy-MM-dd');
    setSearchParams({ date: prevDate }, { replace: true });
  };

  const goToNextDay = () => {
    const nextDate = format(addDays(selectedDate, 1), 'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (nextDate === todayStr) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ date: nextDate }, { replace: true });
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (dateStr === todayStr) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ date: dateStr }, { replace: true });
    }
    setCalendarOpen(false);
  };

  // Compute entry boundaries from weight sets
  const { allItems, entryBoundaries } = useMemo(() => {
    const items: WeightSet[] = [...weightSets];
    const boundaries: { entryId: string; startIndex: number; endIndex: number }[] = [];
    
    // Group by entry_id
    const byEntry = new Map<string, number[]>();
    items.forEach((item, index) => {
      const indices = byEntry.get(item.entryId) || [];
      indices.push(index);
      byEntry.set(item.entryId, indices);
    });
    
    byEntry.forEach((indices, entryId) => {
      boundaries.push({
        entryId,
        startIndex: Math.min(...indices),
        endIndex: Math.max(...indices),
      });
    });

    return { allItems: items, entryBoundaries: boundaries };
  }, [weightSets]);

  // Build raw inputs map from weight sets
  const entryRawInputs = useMemo(() => {
    const map = new Map<string, string>();
    weightSets.forEach(set => {
      if (set.rawInput && !map.has(set.entryId)) {
        map.set(set.entryId, set.rawInput);
      }
    });
    return map;
  }, [weightSets]);

  // Toggle entry expansion
  const handleToggleEntryExpand = useCallback((entryId: string) => {
    setExpandedEntryIds(prev => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  }, []);

  // Derive display items from query data + pending local edits
  const { 
    displayItems,
    newEntryIds,
    markEntryAsNew,
    updateItem,
    removeItem,
  } = useEditableItems<WeightSet>(allItems, WEIGHT_EDITABLE_FIELDS);

  // Check if pending entry is now visible in the entries list
  const pendingEntryVisible = pendingEntryId 
    ? weightSets.some(s => s.entryId === pendingEntryId)
    : false;
  
  // When pending entry becomes visible, trigger highlight and clear loading
  useEffect(() => {
    if (pendingEntryVisible && pendingEntryId) {
      markEntryAsNew(pendingEntryId);
      setPendingEntryId(null);
    }
  }, [pendingEntryVisible, pendingEntryId, markEntryAsNew]);

  // Find which entry an item belongs to based on its index
  const findEntryForIndex = useCallback((index: number): { entryId: string; localIndex: number } | null => {
    for (const boundary of entryBoundaries) {
      if (index >= boundary.startIndex && index <= boundary.endIndex) {
        return {
          entryId: boundary.entryId,
          localIndex: index - boundary.startIndex,
        };
      }
    }
    return null;
  }, [entryBoundaries]);

  // Helper to create and save entry from exercises
  const createEntryFromExercises = useCallback((exercises: Omit<WeightSet, 'id' | 'uid' | 'entryId' | 'editedFields'>[], rawInput: string | null) => {
    const entryId = crypto.randomUUID();
    const setsWithEntryId = exercises.map(exercise => ({
      ...exercise,
      entryId,
    }));
    
    setPendingEntryId(entryId);
    
    createEntry.mutate(
      {
        entry_id: entryId,
        logged_date: dateStr,
        raw_input: rawInput,
        weight_sets: setsWithEntryId,
      },
      {
        onSuccess: () => {
          weightInputRef.current?.clear();
        },
        onError: () => {
          setPendingEntryId(null);
        },
      }
    );
  }, [createEntry, dateStr]);

  const handleSubmit = async (text: string) => {
    const result = await analyzeWeights(text);
    if (result) {
      createEntryFromExercises(result.exercises, text);
    }
  };

  // Handle logging a saved routine
  const handleLogSavedRoutine = useCallback((exerciseSets: SavedExerciseSet[], routineId: string) => {
    // Convert SavedExerciseSet to the format createEntryFromExercises expects
    const exercises = exerciseSets.map(set => ({
      exercise_key: set.exercise_key,
      description: set.description,
      sets: set.sets,
      reps: set.reps,
      weight_lbs: set.weight_lbs,
    }));
    createEntryFromExercises(exercises, `From saved routine`);
  }, [createEntryFromExercises]);

  // Auto-save handler for single field updates
  const handleItemUpdate = useCallback((index: number, field: keyof WeightSet, value: string | number) => {
    updateItem(index, field, value);
    
    const item = displayItems[index];
    if (item) {
      updateSet.mutate({
        id: item.id,
        updates: { [field]: value },
      });
    }
  }, [updateItem, displayItems, updateSet]);

  // Auto-save handler for item removal
  const handleItemRemove = useCallback((index: number) => {
    const item = displayItems[index];
    if (item) {
      removeItem(index);
      deleteSet.mutate(item.id);
    }
  }, [removeItem, displayItems, deleteSet]);

  const handleDeleteEntry = (entryId: string) => {
    deleteEntry.mutate(entryId);
  };

  const handleDeleteAll = () => {
    deleteAllByDate.mutate(dateStr);
  };

  return (
    <div className="space-y-4">
      {/* Weight Input Section */}
      <section>
        <LogInput
          mode="weights"
          ref={weightInputRef}
          onSubmit={handleSubmit}
          isLoading={isAnalyzing || createEntry.isPending || (isFetching && !!pendingEntryId)}
          onLogSavedRoutine={handleLogSavedRoutine}
          onCreateNewRoutine={() => setCreateRoutineDialogOpen(true)}
        />
        {analyzeError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mt-3">
            Analysis failed: {analyzeError}
          </div>
        )}
      </section>

      {/* Date Navigation */}
      <div className="flex items-center justify-center gap-1">
        <Button variant="ghost" size="icon" onClick={goToPreviousDay} className="h-11 w-11">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 text-heading hover:underline",
                "text-blue-600 dark:text-blue-400"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              {format(selectedDate, isTodaySelected ? "'Today,' MMM d" : 'EEE, MMM d')}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <div className="p-2 border-b">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-blue-600 dark:text-blue-400"
                onClick={() => {
                  setSearchParams({}, { replace: true });
                  setCalendarOpen(false);
                }}
              >
                Go to Today
              </Button>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => isFuture(date)}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={goToNextDay}
          disabled={isTodaySelected}
          className="h-11 w-11"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Weight Items Table */}
      {displayItems.length > 0 && (
        <WeightItemsTable
          items={displayItems}
          editable
          onUpdateItem={handleItemUpdate}
          onRemoveItem={handleItemRemove}
          newEntryIds={newEntryIds}
          entryBoundaries={entryBoundaries}
          onDeleteEntry={handleDeleteEntry}
          onDeleteAll={handleDeleteAll}
          entryRawInputs={entryRawInputs}
          expandedEntryIds={expandedEntryIds}
          onToggleEntryExpand={handleToggleEntryExpand}
        />
      )}

      {displayItems.length === 0 && !isAnalyzing && (
        <div className="text-center text-muted-foreground py-8">
          No exercises logged for this day
        </div>
      )}

      {/* Create Routine Dialog */}
      {createRoutineDialogOpen && (
        <CreateRoutineDialog
          open={createRoutineDialogOpen}
          onOpenChange={setCreateRoutineDialogOpen}
          onRoutineCreated={(routine, exerciseSets) => {
            // Log the routine immediately if user chooses
            handleLogSavedRoutine(exerciseSets, routine.id);
          }}
          showLogPrompt={true}
        />
      )}
    </div>
  );
};
