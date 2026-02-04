import { useState, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { format, addDays, subDays, isToday, parseISO, isFuture, startOfMonth } from 'date-fns';
import { useWeightDatesWithData } from '@/hooks/useDatesWithData';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { FEATURES } from '@/lib/feature-flags';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogInput, LogInputRef } from '@/components/LogInput';
import { WeightItemsTable } from '@/components/WeightItemsTable';
import { CreateRoutineDialog } from '@/components/CreateRoutineDialog';
import { SaveRoutineDialog } from '@/components/SaveRoutineDialog';
import { SaveSuggestionPrompt } from '@/components/SaveSuggestionPrompt';
import { DemoPreviewDialog } from '@/components/DemoPreviewDialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAnalyzeWeights } from '@/hooks/useAnalyzeWeights';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { useRecentWeightEntries } from '@/hooks/useRecentWeightEntries';
import { useEditableItems } from '@/hooks/useEditableItems';
import { useSavedRoutines } from '@/hooks/useSavedRoutines';
import { useSaveRoutine } from '@/hooks/useSavedRoutines';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useReadOnlyContext } from '@/contexts/ReadOnlyContext';
import { detectRepeatedWeightEntry, isDismissed, dismissSuggestion, shouldShowOptOutLink, WeightSaveSuggestion } from '@/lib/repeated-entry-detection';
import { WeightSet, WeightEditableField, SavedExerciseSet, AnalyzedExercise } from '@/types/weight';

const WEIGHT_EDITABLE_FIELDS: WeightEditableField[] = ['description', 'sets', 'reps', 'weight_lbs'];

// Wrapper component: extracts date from URL, forces remount via key
const WeightLog = () => {
  const [searchParams] = useSearchParams();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  
  // Access check: allow if feature flag is on OR user is admin
  if (!FEATURES.WEIGHT_TRACKING && !isAdminLoading && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  // Show nothing while checking admin status (prevents flash)
  if (!FEATURES.WEIGHT_TRACKING && isAdminLoading) {
    return null;
  }
  
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
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set());
  const [createRoutineDialogOpen, setCreateRoutineDialogOpen] = useState(false);
  
  // Save as Routine dialog state
  const [saveRoutineDialogData, setSaveRoutineDialogData] = useState<{
    entryId: string;
    rawInput: string | null;
    exerciseSets: WeightSet[];
  } | null>(null);

  // Demo preview state (for read-only demo users)
  const [demoPreviewOpen, setDemoPreviewOpen] = useState(false);
  const [demoPreviewSets, setDemoPreviewSets] = useState<WeightSet[]>([]);
  const [demoPreviewRawInput, setDemoPreviewRawInput] = useState<string | null>(null);
  
  // Save suggestion state (for repeated entries detection)
  const [saveSuggestion, setSaveSuggestion] = useState<WeightSaveSuggestion | null>(null);
  const [saveSuggestionExercises, setSaveSuggestionExercises] = useState<AnalyzedExercise[]>([]);
  const [createRoutineFromSuggestion, setCreateRoutineFromSuggestion] = useState(false);
  
  const dateStr = initialDate;
  const selectedDate = parseISO(initialDate);
  const isTodaySelected = isToday(selectedDate);
  
  const queryClient = useQueryClient();
  const { weightSets, isFetching, createEntry, updateSet, deleteSet, deleteEntry, deleteAllByDate } = useWeightEntries(dateStr);
  const { data: datesWithWeights = [] } = useWeightDatesWithData(calendarMonth);
  const { analyzeWeights, isAnalyzing, error: analyzeError, warning: analyzeWarning } = useAnalyzeWeights();
  const saveRoutineMutation = useSaveRoutine();
  const { settings, updateSettings } = useUserSettings();
  const { data: savedRoutines } = useSavedRoutines();
  const { data: recentWeightEntries } = useRecentWeightEntries(90);
  const { isReadOnly } = useReadOnlyContext();
  
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

  // Build set of entry IDs that came from saved routines (regardless of whether routine still exists)
  const entrySourceRoutineIds = useMemo(() => {
    const ids = new Set<string>();
    weightSets.forEach(set => {
      if (set.sourceRoutineId) {
        ids.add(set.entryId);
      }
    });
    return ids;
  }, [weightSets]);

  // Build map of entryId -> routine name for entries from saved routines (for display only)
  const entryRoutineNames = useMemo(() => {
    const map = new Map<string, string>();
    if (!savedRoutines) return map;
    const seenEntries = new Set<string>();
    weightSets.forEach(set => {
      if (!seenEntries.has(set.entryId) && set.sourceRoutineId) {
        const routine = savedRoutines.find(r => r.id === set.sourceRoutineId);
        if (routine) map.set(set.entryId, routine.name);
        seenEntries.add(set.entryId);
      }
    });
    return map;
  }, [weightSets, savedRoutines]);

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
  const createEntryFromExercises = useCallback(async (
    exercises: Omit<WeightSet, 'id' | 'uid' | 'entryId' | 'editedFields'>[],
    rawInput: string | null,
    sourceRoutineId?: string | null
  ) => {
    const entryId = crypto.randomUUID();
    const setsWithEntryId = exercises.map(exercise => ({
      ...exercise,
      entryId,
    }));
    
    try {
      await createEntry.mutateAsync({
        entry_id: entryId,
        logged_date: dateStr,
        raw_input: rawInput,
        source_routine_id: sourceRoutineId,
        weight_sets: setsWithEntryId,
      });
      
      // Wait for cache to update so entry is in DOM
      await queryClient.invalidateQueries({ queryKey: ['weight-sets', dateStr] });
      
      markEntryAsNew(entryId);
      weightInputRef.current?.clear();
      
      // Check for repeated patterns (skip demo mode and saved routine entries)
      if (!isReadOnly && settings.suggestRoutineSaves && recentWeightEntries && !sourceRoutineId) {
        // Convert exercises to AnalyzedExercise format for detection
        const analyzedExercises: AnalyzedExercise[] = exercises.map(e => ({
          exercise_key: e.exercise_key,
          description: e.description,
          sets: e.sets,
          reps: e.reps,
          weight_lbs: e.weight_lbs,
          duration_minutes: e.duration_minutes,
          distance_miles: e.distance_miles,
        }));
        
        const suggestion = detectRepeatedWeightEntry(analyzedExercises, recentWeightEntries);
        if (suggestion && !isDismissed(suggestion.signatureHash)) {
          setSaveSuggestion(suggestion);
          setSaveSuggestionExercises([...suggestion.exercises]);
        }
      }
    } catch {
      // Error already logged by mutation's onError
    }
  }, [createEntry, dateStr, queryClient, markEntryAsNew, isReadOnly, settings.suggestRoutineSaves, recentWeightEntries]);

  const handleSubmit = async (text: string) => {
    const result = await analyzeWeights(text);
    if (result) {
      // Demo mode: show preview instead of saving
      if (isReadOnly) {
        const setsWithUids = result.exercises.map(exercise => ({
          ...exercise,
          id: crypto.randomUUID(),
          uid: crypto.randomUUID(),
          entryId: 'demo-preview',
        })) as WeightSet[];
        setDemoPreviewSets(setsWithUids);
        setDemoPreviewRawInput(text);
        setDemoPreviewOpen(true);
        weightInputRef.current?.clear();
        return;
      }

      createEntryFromExercises(result.exercises, text);
    }
  };

  // Handle logging a saved routine
  const handleLogSavedRoutine = useCallback((exerciseSets: SavedExerciseSet[], routineId: string) => {
    // Demo mode: show preview instead of saving
    if (isReadOnly) {
      const setsWithUids = exerciseSets.map(set => ({
        ...set,
        id: crypto.randomUUID(),
        uid: crypto.randomUUID(),
        entryId: 'demo-preview',
      })) as WeightSet[];
      setDemoPreviewSets(setsWithUids);
      setDemoPreviewRawInput(null); // Saved routines don't have raw input to show
      setDemoPreviewOpen(true);
      return;
    }

    // SavedExerciseSet already contains only persistent fields, spread for future-proofing
    const exercises = exerciseSets.map(set => ({ ...set }));
    createEntryFromExercises(exercises, null, routineId);
  }, [createEntryFromExercises, isReadOnly]);

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

  // Handle "Save as routine" from expanded entry
  const handleSaveAsRoutine = useCallback((entryId: string, rawInput: string | null, exerciseSets: WeightSet[]) => {
    setSaveRoutineDialogData({ entryId, rawInput, exerciseSets });
  }, []);

  // Handle saving the routine
  const handleSaveRoutineConfirm = useCallback((name: string) => {
    if (!saveRoutineDialogData) return;
    
    // Strip runtime metadata, spread the rest for future-proofing
    const exerciseSets: SavedExerciseSet[] = saveRoutineDialogData.exerciseSets.map(({
      id, uid, entryId, rawInput, sourceRoutineId, editedFields,
      ...persistentFields
    }) => persistentFields);
    
    saveRoutineMutation.mutate(
      {
        name,
        originalInput: saveRoutineDialogData.rawInput,
        exerciseSets,
      },
      {
        onSuccess: () => {
          setSaveRoutineDialogData(null);
        },
      }
    );
  }, [saveRoutineDialogData, saveRoutineMutation]);

  // Save suggestion handlers
  const handleSaveSuggestion = useCallback(() => {
    setCreateRoutineFromSuggestion(true);
    setSaveSuggestion(null);
  }, []);

  const handleDismissSuggestion = useCallback(() => {
    if (saveSuggestion) {
      dismissSuggestion(saveSuggestion.signatureHash);
    }
    setSaveSuggestion(null);
    setSaveSuggestionExercises([]);
  }, [saveSuggestion]);

  const handleOptOutRoutineSuggestions = useCallback(() => {
    updateSettings({ suggestRoutineSaves: false });
    setSaveSuggestion(null);
    setSaveSuggestionExercises([]);
  }, [updateSettings]);

  const handleSuggestionExercisesChange = useCallback((items: AnalyzedExercise[]) => {
    setSaveSuggestionExercises(items);
  }, []);

  const handleRoutineFromSuggestionCreated = useCallback(() => {
    setCreateRoutineFromSuggestion(false);
    setSaveSuggestionExercises([]);
  }, []);

  return (
    <div className="space-y-4">
      {/* Weight Input Section */}
      <section>
        <LogInput
          mode="weights"
          ref={weightInputRef}
          onSubmit={handleSubmit}
          isLoading={isAnalyzing || createEntry.isPending}
          onLogSavedRoutine={handleLogSavedRoutine}
          onCreateNewRoutine={() => setCreateRoutineDialogOpen(true)}
          weightUnit={settings.weightUnit}
        />
        {analyzeError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mt-3">
            Analysis failed: {analyzeError}
          </div>
        )}
        {analyzeWarning && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mt-3">
            {analyzeWarning}
          </div>
        )}
        
        {/* Save Suggestion Prompt (for repeated entries) */}
        {saveSuggestion && (
          <div className="mt-3">
            <SaveSuggestionPrompt<AnalyzedExercise>
              mode="weights"
              matchCount={saveSuggestion.matchCount}
              items={saveSuggestionExercises}
              onItemsChange={handleSuggestionExercisesChange}
              onSave={handleSaveSuggestion}
              onDismiss={handleDismissSuggestion}
              onOptOut={handleOptOutRoutineSuggestions}
              showOptOutLink={shouldShowOptOutLink()}
              renderItemsTable={(props) => (
                <WeightItemsTable
                  items={props.items.map((e, i) => ({
                    ...e,
                    id: `suggestion-${i}`,
                    uid: `suggestion-${i}`,
                    entryId: 'suggestion',
                  }))}
                  editable={props.editable}
                  onUpdateItem={(index, field, value) => {
                    props.onUpdateItem(index, field as keyof AnalyzedExercise, value);
                  }}
                  onRemoveItem={props.onRemoveItem}
                  showHeader={false}
                  totalsPosition="bottom"
                />
              )}
            />
          </div>
        )}
      </section>

      {/* Date Navigation */}
      <div className="flex items-center justify-center gap-1">
        <Button variant="ghost" size="icon" onClick={goToPreviousDay} className="h-11 w-11" aria-label="Previous day">
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
              onMonthChange={setCalendarMonth}
              disabled={(date) => isFuture(date)}
              modifiers={{ hasData: datesWithWeights }}
              modifiersClassNames={{ hasData: "text-purple-600 dark:text-purple-400 font-semibold" }}
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
          aria-label="Next day"
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
          onSaveAsRoutine={handleSaveAsRoutine}
          weightUnit={settings.weightUnit}
          entryRoutineNames={entryRoutineNames}
          entrySourceRoutineIds={entrySourceRoutineIds}
        />
      )}

      {displayItems.length === 0 && isFetching && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {displayItems.length === 0 && !isFetching && !isAnalyzing && (
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

      {/* Create Routine from Suggestion Dialog */}
      {createRoutineFromSuggestion && (
        <CreateRoutineDialog
          open={createRoutineFromSuggestion}
          onOpenChange={setCreateRoutineFromSuggestion}
          onRoutineCreated={handleRoutineFromSuggestionCreated}
          showLogPrompt={false}
          initialExercises={saveSuggestionExercises}
        />
      )}

      {/* Save as Routine Dialog */}
      {saveRoutineDialogData && (
        <SaveRoutineDialog
          open={!!saveRoutineDialogData}
          onOpenChange={(open) => {
            if (!open) {
              setSaveRoutineDialogData(null);
            }
          }}
          rawInput={saveRoutineDialogData.rawInput}
          exerciseSets={saveRoutineDialogData.exerciseSets}
          onSave={handleSaveRoutineConfirm}
          isSaving={saveRoutineMutation.isPending}
        />
      )}

      {/* Demo Preview Dialog (for read-only demo users) */}
      <DemoPreviewDialog
        mode="weights"
        open={demoPreviewOpen}
        onOpenChange={setDemoPreviewOpen}
        weightSets={demoPreviewSets}
        weightUnit={settings.weightUnit}
        rawInput={demoPreviewRawInput}
      />
    </div>
  );
};
