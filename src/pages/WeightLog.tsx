import { useState, useMemo, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { DetailDialog, buildExerciseDetailFields, flattenExerciseValues, processExerciseSaveUpdates, EXERCISE_HIDE_WHEN_EMPTY } from '@/components/DetailDialog';
import { isMultiItemEntry } from '@/lib/entry-boundaries';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { format, isToday, parseISO } from 'date-fns';
import { useWeightDatesWithData } from '@/hooks/useDatesWithData';
import { LogInput, LogInputRef } from '@/components/LogInput';
import { DateNavigation } from '@/components/DateNavigation';
import { useDateNavigation } from '@/hooks/useDateNavigation';
import { WeightItemsTable } from '@/components/WeightItemsTable';
import { CreateRoutineDialog } from '@/components/CreateRoutineDialog';
import { SaveRoutineDialog } from '@/components/SaveRoutineDialog';
import { SaveSuggestionPrompt } from '@/components/SaveSuggestionPrompt';
import { DemoPreviewDialog } from '@/components/DemoPreviewDialog';
import { useAnalyzeWeights } from '@/hooks/useAnalyzeWeights';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { useRecentWeightEntries } from '@/hooks/useRecentWeightEntries';
import { useEditableItems } from '@/hooks/useEditableItems';
import { useSavedRoutines } from '@/hooks/useSavedRoutines';
import { useSaveRoutine } from '@/hooks/useSavedRoutines';
import { useUpdateSavedRoutine } from '@/hooks/useSavedRoutines';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useReadOnlyContext } from '@/contexts/ReadOnlyContext';
import { detectRepeatedWeightEntry, isDismissed, dismissSuggestion, shouldShowOptOutLink, WeightSaveSuggestion, findMatchingSavedRoutine, MatchingRoutine } from '@/lib/repeated-entry-detection';
import { estimateTotalCalorieBurn, formatCalorieBurnValue, type CalorieBurnSettings, type ExerciseInput } from '@/lib/calorie-burn';
import { WeightSet, WeightEditableField, SavedExerciseSet, AnalyzedExercise } from '@/types/weight';
import { generateRoutineName } from '@/lib/routine-naming';
import { getStoredDate, setStoredDate, getSwipeDirection, setSwipeDirection } from '@/lib/selected-date';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

const WEIGHT_EDITABLE_FIELDS: WeightEditableField[] = ['description', 'sets', 'reps', 'weight_lbs'];

// Wrapper component: extracts date from URL, forces remount via key
const WeightLog = () => {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const dateKey = dateParam || getStoredDate() || format(new Date(), 'yyyy-MM-dd');
  
  return <WeightLogContent key={dateKey} initialDate={dateKey} />;
};

export default WeightLog;

interface WeightLogContentProps {
  initialDate: string;
}

const WeightLogContent = ({ initialDate }: WeightLogContentProps) => {
  const mountDir = useRef(getSwipeDirection()).current;
  setSwipeDirection(null);
  const [, setSearchParams] = useSearchParams();
  const dateNav = useDateNavigation(initialDate, setSearchParams);
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set());
  const [createRoutineDialogOpen, setCreateRoutineDialogOpen] = useState(false);
  
  // Save as Routine dialog state
  const [saveRoutineDialogData, setSaveRoutineDialogData] = useState<{
    entryId: string;
    rawInput: string | null;
    exerciseSets: WeightSet[];
    createdAt: string;
  } | null>(null);

  // Demo preview state (for read-only demo users)
  const [demoPreviewOpen, setDemoPreviewOpen] = useState(false);
  const [demoPreviewSets, setDemoPreviewSets] = useState<WeightSet[]>([]);
  const [demoPreviewRawInput, setDemoPreviewRawInput] = useState<string | null>(null);
  
  // Save suggestion state (for repeated entries detection)
  const [saveSuggestion, setSaveSuggestion] = useState<WeightSaveSuggestion | null>(null);
  const [saveSuggestionExercises, setSaveSuggestionExercises] = useState<AnalyzedExercise[]>([]);
  // Note: createRoutineFromSuggestion state removed - direct save now used
  const [matchingRoutineForSuggestion, setMatchingRoutineForSuggestion] = useState<MatchingRoutine | null>(null);

  // Detail dialog state
  const [detailDialogItem, setDetailDialogItem] = useState<
    | { mode: 'single'; index: number; entryId: string }
    | { mode: 'group'; startIndex: number; endIndex: number; entryId: string }
    | null
  >(null);
  
  const dateStr = initialDate;
  const selectedDate = parseISO(initialDate);
  const isTodaySelected = isToday(selectedDate);
  
  const queryClient = useQueryClient();
  const { weightSets, isFetching, createEntry, updateSet, deleteSet, deleteEntry, deleteAllByDate, updateGroupName } = useWeightEntries(dateStr);
  const { data: datesWithWeights = [] } = useWeightDatesWithData(dateNav.calendarMonth);
  const { analyzeWeights, isAnalyzing, error: analyzeError, warning: analyzeWarning } = useAnalyzeWeights();
  const saveRoutineMutation = useSaveRoutine();
  const updateSavedRoutine = useUpdateSavedRoutine();
  const { settings, updateSettings } = useUserSettings();
  const { data: savedRoutines } = useSavedRoutines();
  const { data: recentWeightEntries } = useRecentWeightEntries(90);
  const { isReadOnly } = useReadOnlyContext();
  
  const weightInputRef = useRef<LogInputRef>(null);

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

  // Build group names for multi-item entries (for collapsed group headers)
  const entryGroupNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const boundary of entryBoundaries) {
      if (!isMultiItemEntry(boundary)) continue;
      const { entryId } = boundary;
      // Priority: saved routine name > DB group_name > raw input > first exercise description
      const routineName = entryRoutineNames.get(entryId);
      if (routineName) { map.set(entryId, routineName); continue; }
      const firstSet = weightSets.find(s => s.entryId === entryId);
      if (firstSet?.groupName) { map.set(entryId, firstSet.groupName); continue; }
      const rawInput = entryRawInputs.get(entryId);
      if (rawInput) { map.set(entryId, rawInput); continue; }
      if (firstSet) { map.set(entryId, firstSet.description); }
    }
    return map;
  }, [entryBoundaries, entryRoutineNames, entryRawInputs, weightSets]);

  // Update group name callback
  const handleUpdateGroupName = useCallback((entryId: string, newName: string) => {
    updateGroupName.mutate({ entryId, groupName: newName });
  }, [updateGroupName]);

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

    // Determine group_name for multi-item entries
    let groupName: string | null = null;
    if (exercises.length >= 2) {
      if (sourceRoutineId && savedRoutines) {
        const routine = savedRoutines.find(r => r.id === sourceRoutineId);
        if (routine) groupName = routine.name;
      }
      if (!groupName && rawInput) groupName = rawInput;
      if (!groupName) groupName = exercises[0].description;
    }
    
    try {
      await createEntry.mutateAsync({
        entry_id: entryId,
        logged_date: dateStr,
        raw_input: rawInput,
        source_routine_id: sourceRoutineId,
        group_name: groupName,
        weight_sets: setsWithEntryId,
      });
      
      // Wait for cache to update so entry is in DOM
      await queryClient.invalidateQueries({ queryKey: ['weight-sets', dateStr] });
      // Also invalidate the month's date cache so calendar highlighting updates
      await queryClient.invalidateQueries({ queryKey: ['weight-dates', format(selectedDate, 'yyyy-MM')] });
      
      markEntryAsNew(entryId);

      // Auto-expand multi-item entries so user sees exercises immediately
      if (exercises.length >= 2) {
        setExpandedEntryIds(prev => new Set(prev).add(entryId));
      }

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
          // Check if there's a matching saved routine to offer update
          const matchingRoutine = findMatchingSavedRoutine(
            analyzedExercises,
            savedRoutines ?? []
          );
          
          setSaveSuggestion(suggestion);
          setSaveSuggestionExercises([...suggestion.exercises]);
          setMatchingRoutineForSuggestion(matchingRoutine);
        }
      }
    } catch {
      // Error already logged by mutation's onError
    }
  }, [createEntry, dateStr, queryClient, markEntryAsNew, isReadOnly, settings.suggestRoutineSaves, recentWeightEntries]);

  // Copy an entry to today's date
  const handleCopyEntryToToday = useCallback(async (entryId: string) => {
    const entrySets = weightSets.filter(s => s.entryId === entryId);
    if (entrySets.length === 0) return;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const newEntryId = crypto.randomUUID();
    const firstSet = entrySets[0];

    // Determine group_name (carry over from source)
    const groupName = firstSet.groupName ?? null;

    const setsToCreate = entrySets.map(set => ({
      exercise_key: set.exercise_key,
      exercise_subtype: set.exercise_subtype,
      description: set.description,
      sets: set.sets,
      reps: set.reps,
      weight_lbs: set.weight_lbs,
      duration_minutes: set.duration_minutes,
      distance_miles: set.distance_miles,
      exercise_metadata: set.exercise_metadata,
      entryId: newEntryId,
    }));

    try {
      await createEntry.mutateAsync({
        entry_id: newEntryId,
        logged_date: todayStr,
        raw_input: firstSet.rawInput,
        source_routine_id: undefined,  // standalone copy
        group_name: groupName,
        weight_sets: setsToCreate,
      });

      await queryClient.invalidateQueries({ queryKey: ['weight-sets', todayStr] });
      await queryClient.invalidateQueries({ queryKey: ['weight-dates', format(new Date(), 'yyyy-MM')] });
    } catch {
      // Error already logged by mutation's onError
    }
  }, [weightSets, createEntry, queryClient]);

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

  // Detail dialog handlers
  const handleShowDetails = useCallback((entryId: string, startIndex: number, endIndex?: number) => {
    if (endIndex !== undefined && endIndex > startIndex) {
      setDetailDialogItem({ mode: 'group', startIndex, endIndex, entryId });
    } else {
      setDetailDialogItem({ mode: 'single', index: startIndex, entryId });
    }
  }, []);

  // Handle inline calorie burn override from expanded panel
  const handleUpdateCalorieBurn = useCallback((id: string, calories: number) => {
    const item = displayItems.find(i => i.id === id);
    if (!item) return;
    const newMetadata = { ...(item.exercise_metadata ?? {}), calories_burned: calories };
    updateSet.mutate({ id, updates: { exercise_metadata: newMetadata } });
  }, [displayItems, updateSet]);

  const handleDetailSave = useCallback((updates: Record<string, any>) => {
    if (!detailDialogItem || detailDialogItem.mode !== 'single') return;
    const item = displayItems[detailDialogItem.index];
    if (!item) return;

    const { regularUpdates, newMetadata } = processExerciseSaveUpdates(updates, item.exercise_metadata ?? null);
    const allUpdates: Record<string, any> = { ...regularUpdates };
    if (newMetadata !== (item.exercise_metadata ?? null)) {
      allUpdates.exercise_metadata = newMetadata;
    }

    if (Object.keys(allUpdates).length > 0) {
      updateSet.mutate({ id: item.id, updates: allUpdates });
    }
    setDetailDialogItem(null);
  }, [detailDialogItem, displayItems, updateSet]);

  const handleDetailSaveItem = useCallback((itemIndex: number, updates: Record<string, any>) => {
    if (!detailDialogItem || detailDialogItem.mode !== 'group') return;
    const globalIndex = detailDialogItem.startIndex + itemIndex;
    const item = displayItems[globalIndex];
    if (!item) return;

    const { regularUpdates, newMetadata } = processExerciseSaveUpdates(updates, item.exercise_metadata ?? null);
    const allUpdates: Record<string, any> = { ...regularUpdates };
    if (newMetadata !== (item.exercise_metadata ?? null)) {
      allUpdates.exercise_metadata = newMetadata;
    }

    if (Object.keys(allUpdates).length > 0) {
      updateSet.mutate({ id: item.id, updates: allUpdates });
    }
  }, [detailDialogItem, displayItems, updateSet]);

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
    // Get the earliest createdAt from the entry's sets (query is ordered by created_at)
    const entrySets = weightSets.filter(s => s.entryId === entryId);
    const createdAt = entrySets[0]?.createdAt ?? new Date().toISOString();
    
    setSaveRoutineDialogData({ entryId, rawInput, exerciseSets, createdAt });
  }, [weightSets]);

  // Handle saving the routine - receives selected exercises directly from dialog
  const handleSaveRoutineConfirm = useCallback((name: string, isAutoNamed: boolean, selectedExercises: WeightSet[]) => {
    if (!saveRoutineDialogData) return;
    
    // Strip runtime metadata, spread the rest for future-proofing
    const exerciseSets: SavedExerciseSet[] = selectedExercises.map(({
      id, uid, entryId, rawInput, sourceRoutineId, editedFields,
      ...persistentFields
    }) => persistentFields);
    
    saveRoutineMutation.mutate(
      {
        name,
        originalInput: saveRoutineDialogData.rawInput,
        exerciseSets,
        isAutoNamed,
      },
      {
        onSuccess: () => {
          setSaveRoutineDialogData(null);
        },
      }
    );
  }, [saveRoutineDialogData, saveRoutineMutation]);
  
  // Compute other entries for routine dialog (chronologically sorted like food page)
  const otherEntriesForRoutineDialog = useMemo(() => {
    if (!saveRoutineDialogData) return [];
    
    // Group weight sets by entry ID
    const entryMap = new Map<string, WeightSet[]>();
    weightSets.forEach(set => {
      const existing = entryMap.get(set.entryId) || [];
      existing.push(set);
      entryMap.set(set.entryId, existing);
    });
    
    // Build list of other entries with their createdAt
    const currentCreatedAt = saveRoutineDialogData.createdAt;
    const otherEntries = Array.from(entryMap.entries())
      .filter(([id]) => id !== saveRoutineDialogData.entryId)
      .map(([entryId, sets]) => ({
        entryId,
        exerciseSets: sets,
        rawInput: sets[0]?.rawInput ?? null,
        createdAt: sets[0]?.createdAt ?? '',
        isFromSavedRoutine: !!sets[0]?.sourceRoutineId,
      }));
    
    // Sort: entries before current first (newest-first), then entries after current (oldest-first)
    const before = otherEntries.filter(e => e.createdAt < currentCreatedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const after = otherEntries.filter(e => e.createdAt >= currentCreatedAt).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    
    return [...before, ...after];
  }, [saveRoutineDialogData, weightSets]);

  // Save suggestion handlers
  const handleSaveSuggestion = useCallback(() => {
    if (saveSuggestionExercises.length === 0) return;
    
    const exerciseSets: SavedExerciseSet[] = saveSuggestionExercises.map(e => ({
      exercise_key: e.exercise_key,
      description: e.description,
      sets: e.sets,
      reps: e.reps,
      weight_lbs: e.weight_lbs,
      duration_minutes: e.duration_minutes,
      distance_miles: e.distance_miles,
    }));
    
    const autoName = generateRoutineName(exerciseSets[0]);
    
    saveRoutineMutation.mutate({
      name: autoName,
      originalInput: null,
      exerciseSets,
      isAutoNamed: true,
    }, {
      onSuccess: () => {
        setSaveSuggestion(null);
        setSaveSuggestionExercises([]);
        setMatchingRoutineForSuggestion(null);
      }
    });
  }, [saveSuggestionExercises, saveRoutineMutation]);

  const handleDismissSuggestion = useCallback(() => {
    if (saveSuggestion) {
      dismissSuggestion(saveSuggestion.signatureHash);
    }
    setSaveSuggestion(null);
    setSaveSuggestionExercises([]);
    setMatchingRoutineForSuggestion(null);
  }, [saveSuggestion]);

  const handleOptOutRoutineSuggestions = useCallback(() => {
    updateSettings({ suggestRoutineSaves: false });
    setSaveSuggestion(null);
    setSaveSuggestionExercises([]);
    setMatchingRoutineForSuggestion(null);
  }, [updateSettings]);

  const handleSuggestionExercisesChange = useCallback((items: AnalyzedExercise[]) => {
    setSaveSuggestionExercises(items);
  }, []);

  // Handle updating an existing saved routine from suggestion
  const handleUpdateExistingRoutine = useCallback(() => {
    if (!matchingRoutineForSuggestion) return;
    
    const exerciseSets: SavedExerciseSet[] = saveSuggestionExercises.map(e => ({
      exercise_key: e.exercise_key,
      description: e.description,
      sets: e.sets,
      reps: e.reps,
      weight_lbs: e.weight_lbs,
      duration_minutes: e.duration_minutes,
      distance_miles: e.distance_miles,
    }));
    
    // Conditionally update name if it's auto-generated
    let newName: string | undefined;
    if (matchingRoutineForSuggestion.isAutoNamed && exerciseSets.length > 0) {
      newName = generateRoutineName(exerciseSets[0]);
    }
    
    updateSavedRoutine.mutate({
      id: matchingRoutineForSuggestion.id,
      name: newName,
      exerciseSets,
      isAutoNamed: matchingRoutineForSuggestion.isAutoNamed ? true : undefined,
    }, {
      onSuccess: () => {
        setSaveSuggestion(null);
        setSaveSuggestionExercises([]);
        setMatchingRoutineForSuggestion(null);
      }
    });
  }, [matchingRoutineForSuggestion, saveSuggestionExercises, updateSavedRoutine]);

  // Convert diffs to Map for SaveSuggestionPrompt
  const diffsMap = useMemo(() => {
    if (!matchingRoutineForSuggestion) return undefined;
    const map = new Map<number, { sets?: number; reps?: number; weight_lbs?: number }>();
    for (const diff of matchingRoutineForSuggestion.diffs) {
      if (diff.sets || diff.reps || diff.weight_lbs) {
        map.set(diff.index, {
          sets: diff.sets,
          reps: diff.reps,
          weight_lbs: diff.weight_lbs,
        });
      }
    }
    return map.size > 0 ? map : undefined;
  }, [matchingRoutineForSuggestion]);

  // Note: handleRoutineFromSuggestionCreated removed - direct save now used

  const swipeHandlers = useSwipeNavigation(
    dateNav.goToNextDay,
    dateNav.goToPreviousDay,
    dateNav.calendarOpen,
  );

  return (
    <div className={cn(
      "space-y-4",
      mountDir === 'left' && 'animate-slide-in-from-right',
      mountDir === 'right' && 'animate-slide-in-from-left',
    )}>
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
                  showHeader={!!matchingRoutineForSuggestion}
                  showTotals={false}
                  diffs={props.diffs}
            weightUnit={settings.weightUnit}
                  distanceUnit={settings.distanceUnit}
                />
              )}
              matchingRoutine={matchingRoutineForSuggestion ? {
                id: matchingRoutineForSuggestion.id,
                name: matchingRoutineForSuggestion.name,
                diffs: diffsMap,
              } : undefined}
              onUpdate={handleUpdateExistingRoutine}
              isLoading={saveRoutineMutation.isPending || updateSavedRoutine.isPending}
            />
          </div>
        )}
      </section>

      {/* Swipe zone: DateNavigation + entries (swipe left = next day, swipe right = prev day) */}
      <div {...swipeHandlers}>
        {/* Date Navigation */}
        <DateNavigation
          selectedDate={selectedDate}
          isTodaySelected={isTodaySelected}
          calendarOpen={dateNav.calendarOpen}
          onCalendarOpenChange={dateNav.setCalendarOpen}
          calendarMonth={dateNav.calendarMonth}
          onCalendarMonthChange={dateNav.setCalendarMonth}
          onPreviousDay={dateNav.goToPreviousDay}
          onNextDay={dateNav.goToNextDay}
          onDateSelect={dateNav.handleDateSelect}
          onGoToToday={dateNav.goToToday}
          datesWithData={datesWithWeights}
          highlightClassName="text-purple-600 dark:text-purple-400 font-semibold"
          weekStartDay={settings.weekStartDay}
        />

        {/* Weight Items Table */}
        {displayItems.length > 0 && (
          <>
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
              entryGroupNames={entryGroupNames}
              onUpdateGroupName={handleUpdateGroupName}
              distanceUnit={settings.distanceUnit}
              calorieBurnSettings={settings.calorieBurnEnabled ? settings as CalorieBurnSettings : undefined}
              totalCalorieBurnDisplay={settings.calorieBurnEnabled ? (() => {
                const exercises: ExerciseInput[] = displayItems.map(item => ({
                  exercise_key: item.exercise_key,
                  exercise_subtype: item.exercise_subtype,
                  sets: item.sets,
                  reps: item.reps,
                  weight_lbs: item.weight_lbs,
                  duration_minutes: item.duration_minutes,
                  distance_miles: item.distance_miles,
                  exercise_metadata: item.exercise_metadata,
                }));
                const total = estimateTotalCalorieBurn(exercises, settings as CalorieBurnSettings);
                const value = formatCalorieBurnValue(total);
                return value ? `(${value} cal)` : undefined;
              })() : undefined}
              onShowDetails={handleShowDetails}
              onUpdateCalorieBurn={handleUpdateCalorieBurn}
              onCopyEntryToToday={!isTodaySelected && !isReadOnly ? handleCopyEntryToToday : undefined}
            />
          </>
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
      </div>

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
          otherEntries={otherEntriesForRoutineDialog}
          weightUnit={settings.weightUnit}
          distanceUnit={settings.distanceUnit}
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

      {/* Detail Dialog for viewing/editing exercise items */}
      {detailDialogItem && (() => {
        if (detailDialogItem.mode === 'group') {
          const groupItems = displayItems.slice(detailDialogItem.startIndex, detailDialogItem.endIndex + 1);
          if (groupItems.length === 0) return null;
          const groupName = entryGroupNames.get(detailDialogItem.entryId) || groupItems[0].description;
          const flatItems = groupItems.map(flattenExerciseValues);
          return (
            <DetailDialog
              open={true}
              onOpenChange={() => setDetailDialogItem(null)}
              title={groupName}
              fields={buildExerciseDetailFields(groupItems[0])}
              values={flatItems[0]}
              onSave={handleDetailSave}
              items={flatItems}
              onSaveItem={handleDetailSaveItem}
              buildFields={buildExerciseDetailFields}
              readOnly={isReadOnly}
              hideWhenZero={EXERCISE_HIDE_WHEN_EMPTY}
              gridClassName="grid-cols-2"
              labelClassName="min-w-[3.5rem] sm:min-w-[4rem]"
              defaultUnits={{
                distance_miles: settings.distanceUnit || 'mi',
                weight_lbs: settings.weightUnit,
                _meta_speed_mph: (settings.distanceUnit || 'mi') === 'km' ? 'km/h' : 'mph',
              }}
            />
          );
        }
        // Single item mode
        const item = displayItems[detailDialogItem.index];
        if (!item) return null;
        const flatValues = flattenExerciseValues(item);
        return (
          <DetailDialog
            open={true}
            onOpenChange={() => setDetailDialogItem(null)}
            title={item.description}
            fields={buildExerciseDetailFields(item)}
            values={flatValues}
            onSave={handleDetailSave}
            readOnly={isReadOnly}
            hideWhenZero={EXERCISE_HIDE_WHEN_EMPTY}
            gridClassName="grid-cols-2"
            labelClassName="min-w-[3.5rem] sm:min-w-[4rem]"
            defaultUnits={{
              distance_miles: settings.distanceUnit || 'mi',
              weight_lbs: settings.weightUnit,
              _meta_speed_mph: (settings.distanceUnit || 'mi') === 'km' ? 'km/h' : 'mph',
            }}
          />
        );
      })()}
    </div>
  );
};
