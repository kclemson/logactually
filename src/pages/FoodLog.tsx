import { useState, useMemo, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { DetailDialog, buildFoodDetailFields, FOOD_HIDE_WHEN_ZERO } from '@/components/DetailDialog';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { format, isToday, parseISO } from 'date-fns';
import { useFoodDatesWithData } from '@/hooks/useDatesWithData';
import { LogInput, LogInputRef } from '@/components/LogInput';
import { DateNavigation } from '@/components/DateNavigation';
import { useDateNavigation } from '@/hooks/useDateNavigation';
import { FoodItemsTable } from '@/components/FoodItemsTable';
import { SaveMealDialog } from '@/components/SaveMealDialog';
import { CreateMealDialog } from '@/components/CreateMealDialog';
import { SimilarEntryPrompt } from '@/components/SimilarEntryPrompt';
import { SaveSuggestionPrompt } from '@/components/SaveSuggestionPrompt';
import { DemoPreviewDialog } from '@/components/DemoPreviewDialog';
import { useAnalyzeFood } from '@/hooks/useAnalyzeFood';
import { useAnalyzeFoodPhoto } from '@/hooks/useAnalyzeFoodPhoto';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { useRecentFoodEntries } from '@/hooks/useRecentFoodEntries';
import { useEditableFoodItems } from '@/hooks/useEditableItems';
import { useSavedMeals, useSaveMeal, useLogSavedMeal } from '@/hooks/useSavedMeals';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useReadOnlyContext } from '@/contexts/ReadOnlyContext';
import { findSimilarEntry, SimilarEntryMatch } from '@/lib/text-similarity';
import { detectHistoryReference, MIN_SIMILARITY_REQUIRED } from '@/lib/history-patterns';
import { detectRepeatedFoodEntry, isDismissed, dismissSuggestion, shouldShowOptOutLink, FoodSaveSuggestion } from '@/lib/repeated-entry-detection';
import { FoodItem, SavedMeal, calculateTotals } from '@/types/food';
import { getStoredDate, setStoredDate, getSwipeDirection, setSwipeDirection } from '@/lib/selected-date';
import { useGroupPortionScale } from '@/hooks/useGroupPortionScale';
import { getEffectiveDailyTarget, getExerciseAdjustedTarget, usesActualExerciseBurns, getCalorieTargetComponents } from '@/lib/calorie-target';
import { useDailyCalorieBurn } from '@/hooks/useDailyCalorieBurn';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

// Wrapper component: extracts date from URL, forces remount via key
const FoodLog = () => {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const validDateParam = dateParam && dateParam !== 'undefined' ? dateParam : null;
  const dateKey = validDateParam || getStoredDate() || format(new Date(), 'yyyy-MM-dd');
  
  return <FoodLogContent key={dateKey} initialDate={dateKey} />;
};

export default FoodLog;

interface FoodLogContentProps {
  initialDate: string;
}

const FoodLogContent = ({ initialDate }: FoodLogContentProps) => {
  const mountDir = useRef(getSwipeDirection()).current;
  setSwipeDirection(null);
  const [, setSearchParams] = useSearchParams();
  const dateNav = useDateNavigation(initialDate, setSearchParams);
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set());
  
  // State for save meal dialog (from existing entry)
  const [saveMealDialogData, setSaveMealDialogData] = useState<{
    entryId: string;
    rawInput: string | null;
    foodItems: FoodItem[];
    createdAt: string;
  } | null>(null);
  

  // State for create meal dialog
  const [createMealDialogOpen, setCreateMealDialogOpen] = useState(false);


  // State for similar entry prompt (from history reference detection)
  const [pendingEntryMatch, setPendingEntryMatch] = useState<{
    match: SimilarEntryMatch;
    originalInput: string;
  } | null>(null);
  const [dismissedMatchText, setDismissedMatchText] = useState<string | null>(null);

  // Demo preview state (for read-only demo users)
  const [demoPreviewOpen, setDemoPreviewOpen] = useState(false);
  const [demoPreviewItems, setDemoPreviewItems] = useState<FoodItem[]>([]);
  const [demoPreviewRawInput, setDemoPreviewRawInput] = useState<string | null>(null);
  
  // Save suggestion state (for repeated entries detection)
  const [saveSuggestion, setSaveSuggestion] = useState<FoodSaveSuggestion | null>(null);
  const [saveSuggestionItems, setSaveSuggestionItems] = useState<FoodItem[]>([]);

  // Detail dialog state
  const [detailDialogItem, setDetailDialogItem] = useState<
    | { mode: 'single'; index: number; entryId: string }
    | { mode: 'group'; startIndex: number; endIndex: number; entryId: string }
    | null
  >(null);
  
  // Date is stable for this component instance - derived from props, no state needed
  const dateStr = initialDate;
  const selectedDate = parseISO(initialDate);
  const isTodaySelected = isToday(selectedDate);
  
  const queryClient = useQueryClient();
  const { entries, isFetching, createEntry, updateEntry, deleteEntry, deleteAllByDate } = useFoodEntries(dateStr);
  const { data: datesWithFood = [] } = useFoodDatesWithData(dateNav.calendarMonth);
  const { analyzeFood, isAnalyzing, error: analyzeError, warning: analyzeWarning } = useAnalyzeFood();
  const { analyzePhoto, isAnalyzing: isAnalyzingPhoto, error: photoError } = useAnalyzeFoodPhoto();
  const { data: savedMeals } = useSavedMeals();
  const { data: recentEntries } = useRecentFoodEntries(90); // 90 days for history matching
  const saveMeal = useSaveMeal();
  const logSavedMeal = useLogSavedMeal();
  const { settings, updateSettings } = useUserSettings();
  const { isReadOnly } = useReadOnlyContext();

  // For exercise-adjusted or body_stats+logged mode, fetch burn data for the selected day
  const usesBurns = usesActualExerciseBurns(settings);
  const { data: dailyBurnData } = useDailyCalorieBurn(usesBurns ? 90 : 0);
  const dailyBurnForSelectedDay = useMemo(() => {
    if (!usesBurns) return 0;
    const entry = dailyBurnData.find(d => d.date === dateStr);
    if (!entry) return 0;
    return Math.round((entry.low + entry.high) / 2);
  }, [dailyBurnData, dateStr, usesBurns]);

  
  const foodInputRef = useRef<LogInputRef>(null);


  // Flatten all entries into a single items array with entry tracking
  const { allItems, entryBoundaries, dayTotals } = useMemo(() => {
    const items: FoodItem[] = [];
    const boundaries: { entryId: string; startIndex: number; endIndex: number }[] = [];
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    entries.forEach((entry) => {
      const startIndex = items.length;
      items.push(...entry.food_items);
      boundaries.push({
        entryId: entry.id,
        startIndex,
        endIndex: items.length - 1,
      });
      
      totalCalories += entry.total_calories;
      totalProtein += Number(entry.total_protein);
      totalCarbs += Number(entry.total_carbs);
      totalFat += Number(entry.total_fat);
    });

    return {
      allItems: items,
      entryBoundaries: boundaries,
      dayTotals: {
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
      },
    };
  }, [entries]);

  // Derive display items from query data + pending local edits
  const {
    displayItems,
    newEntryIds,
    markEntryAsNew,
    updateItem,
    updateItemBatch,
    removeItem,
    clearPendingForItem,
  } = useEditableFoodItems(allItems);

  // Calculate display totals based on current edit state
  const displayTotals = calculateTotals(displayItems);
  
  // Build map of entryId -> raw_input for inline expansion
  const entryRawInputs = useMemo(() => {
    const map = new Map<string, string>();
    entries.forEach(entry => {
      if (entry.raw_input) map.set(entry.id, entry.raw_input);
    });
    return map;
  }, [entries]);

  // Build set of entry IDs that came from saved meals (regardless of whether meal still exists)
  const entrySourceMealIds = useMemo(() => {
    const ids = new Set<string>();
    entries.forEach(entry => {
      if (entry.source_meal_id) {
        ids.add(entry.id);
      }
    });
    return ids;
  }, [entries]);

  // Build map of entryId -> meal name for entries from saved meals (for display only)
  const entryMealNames = useMemo(() => {
    const map = new Map<string, string>();
    entries.forEach(entry => {
      if (entry.source_meal_id && savedMeals) {
        const meal = savedMeals.find(m => m.id === entry.source_meal_id);
        if (meal) map.set(entry.id, meal.name);
      }
    });
    return map;
  }, [entries, savedMeals]);


  const handleToggleEntryExpand = (entryId: string) => {
    setExpandedEntryIds(prev => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  };

  // Helper to create and save entry from food items
  const createEntryFromItems = useCallback(async (items: FoodItem[], rawInput: string | null, sourceMealId?: string, groupName?: string | null, targetDate?: string, skipSuggestionCheck?: boolean) => {
    const effectiveDate = targetDate || dateStr;
    const entryId = crypto.randomUUID();
    const itemsWithUids = items.map(item => ({
      ...item,
      uid: crypto.randomUUID(),
      entryId,
    }));
    
    const totals = calculateTotals(itemsWithUids);
    
    try {
      await createEntry.mutateAsync({
        id: entryId,
        eaten_date: effectiveDate,
        raw_input: rawInput,
        food_items: itemsWithUids,
        total_calories: Math.round(totals.calories),
        total_protein: Math.round(totals.protein * 10) / 10,
        total_carbs: Math.round(totals.carbs * 10) / 10,
        total_fat: Math.round(totals.fat * 10) / 10,
        source_meal_id: sourceMealId ?? null,
        group_name: groupName ?? null,
      });
      
      // Wait for cache to update so entry is in DOM
      await queryClient.invalidateQueries({ queryKey: ['food-entries', effectiveDate] });
      // Also invalidate the month's date cache so calendar highlighting updates
      await queryClient.invalidateQueries({ queryKey: ['food-dates', format(parseISO(effectiveDate), 'yyyy-MM')] });
      
      markEntryAsNew(entryId);
      foodInputRef.current?.clear();
      
      // Check for repeated patterns (skip demo mode and saved meal entries)
      if (!isReadOnly && settings.suggestMealSaves && recentEntries && !sourceMealId && !skipSuggestionCheck) {
        const suggestion = detectRepeatedFoodEntry(items, recentEntries);
        if (suggestion && !isDismissed(suggestion.signatureHash)) {
          setSaveSuggestion(suggestion);
          setSaveSuggestionItems([...suggestion.items]);
        }
      }
    } catch {
      // Error already logged by mutation's onError
    }
  }, [createEntry, dateStr, queryClient, markEntryAsNew, isReadOnly, settings.suggestMealSaves, recentEntries]);

  // Copy an entry to today's date
  const handleCopyEntryToToday = useCallback((entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    createEntryFromItems(
      entry.food_items,
      entry.raw_input,
      undefined,            // no source_meal_id
      entry.group_name ?? null,
      todayStr,
      true,                 // skip save-suggestion check for copies
    );
  }, [entries, createEntryFromItems]);

  const handleSubmit = async (text: string) => {
    // 1. Check for history reference patterns BEFORE AI call (skip for demo mode)
    // Skip similarity check if user already cancelled this exact input
    if (dismissedMatchText === text) {
      setDismissedMatchText(null);
      // fall through to AI analysis below
    } else if (!isReadOnly && recentEntries?.length) {
      const historyRef = detectHistoryReference(text);
      
      if (historyRef.hasReference) {
        const minSimilarity = MIN_SIMILARITY_REQUIRED[historyRef.confidence];
        const match = findSimilarEntry(text, recentEntries, minSimilarity);
        
        if (match) {
          // Found a match above threshold - show prompt instead of calling AI
          setPendingEntryMatch({ match, originalInput: text });
          return;
        }
        // No match found above threshold - fall through to AI analysis
      }
    }

    // 2. No entry match (or no history reference) - call AI
    const result = await analyzeFood(text);
    if (result) {
      // Demo mode: show preview instead of saving
      if (isReadOnly) {
        const itemsWithUids = result.food_items.map(item => ({
          ...item,
          uid: crypto.randomUUID(),
        }));
        setDemoPreviewItems(itemsWithUids);
        setDemoPreviewRawInput(text);
        setDemoPreviewOpen(true);
        foodInputRef.current?.clear();
        return;
      }

      // Proceed with creating entry
      const groupName = result.food_items.length >= 2
        ? (result.summary || text)
        : null;
      createEntryFromItems(result.food_items, text, undefined, groupName);
    }
  };

  const handlePhotoSubmit = useCallback(async (base64: string) => {
    const result = await analyzePhoto(base64);
    if (result) {
      if (isReadOnly) {
        const itemsWithUids = result.food_items.map(item => ({
          ...item,
          uid: crypto.randomUUID(),
        }));
        setDemoPreviewItems(itemsWithUids);
        setDemoPreviewRawInput(result.summary || "photo");
        setDemoPreviewOpen(true);
        return;
      }
      const photoGroupName = result.summary || "Photo";
      createEntryFromItems(result.food_items, result.summary || "photo", undefined, photoGroupName);
    }
  }, [analyzePhoto, isReadOnly, createEntryFromItems]);


  const handleSaveSuggestion = useCallback(() => {
    if (saveSuggestionItems.length === 0) return;
    
    // Generate name from first item (same logic as FOOD_CONFIG.getFallbackName)
    const first = saveSuggestionItems[0].description;
    const autoName = first.replace(/\s*\([^)]*\)\s*$/, '').trim() || first;
    
    saveMeal.mutate({
      name: autoName,
      originalInput: null,
      foodItems: saveSuggestionItems,
    }, {
      onSuccess: () => {
        setSaveSuggestion(null);
        setSaveSuggestionItems([]);
      }
    });
  }, [saveSuggestionItems, saveMeal]);

  const handleDismissSuggestion = useCallback(() => {
    if (saveSuggestion) {
      dismissSuggestion(saveSuggestion.signatureHash);
    }
    setSaveSuggestion(null);
    setSaveSuggestionItems([]);
  }, [saveSuggestion]);

  const handleOptOutMealSuggestions = useCallback(() => {
    updateSettings({ suggestMealSaves: false });
    setSaveSuggestion(null);
    setSaveSuggestionItems([]);
  }, [updateSettings]);

  const handleSuggestionItemsChange = useCallback((items: FoodItem[]) => {
    setSaveSuggestionItems(items);
  }, []);

  // Similar entry prompt handlers (for history reference detection)
  const handleUsePastEntry = useCallback(async () => {
    if (!pendingEntryMatch) return;
    
    // Await the entry creation to prevent race conditions with sequential prompts
    await createEntryFromItems(
      pendingEntryMatch.match.entry.food_items, 
      pendingEntryMatch.originalInput
    );
    
    setPendingEntryMatch(null);
    foodInputRef.current?.clear();
  }, [pendingEntryMatch, createEntryFromItems]);

  const dismissEntryMatch = useCallback(async () => {
    if (!pendingEntryMatch) return;
    
    // User chose "Log as new" - fall back to AI analysis
    const text = pendingEntryMatch.originalInput;
    setPendingEntryMatch(null);
    
    const result = await analyzeFood(text);
    if (result) {
      createEntryFromItems(result.food_items, text);
    }
  }, [pendingEntryMatch, analyzeFood, createEntryFromItems]);

  const handleCancelEntryMatch = useCallback(() => {
    if (!pendingEntryMatch) return;
    setDismissedMatchText(pendingEntryMatch.originalInput);
    setPendingEntryMatch(null);
  }, [pendingEntryMatch]);

  // Handle direct scan results (when barcode lookup succeeds)
  const handleScanResult = async (foodItem: Omit<FoodItem, 'uid' | 'entryId'>, originalInput: string) => {
    // Demo mode: show preview instead of saving
    if (isReadOnly) {
      const itemWithUid = {
        ...foodItem,
        uid: crypto.randomUUID(),
      };
      setDemoPreviewItems([itemWithUid]);
      setDemoPreviewRawInput(originalInput);
      setDemoPreviewOpen(true);
      return;
    }

    const entryId = crypto.randomUUID();
    const itemWithUid = {
      ...foodItem,
      uid: crypto.randomUUID(),
      entryId,
    };
    
    const totals = calculateTotals([itemWithUid]);
    
    try {
      await createEntry.mutateAsync({
        id: entryId,
        eaten_date: dateStr,
        raw_input: originalInput,
        food_items: [itemWithUid],
        total_calories: Math.round(totals.calories),
        total_protein: Math.round(totals.protein * 10) / 10,
        total_carbs: Math.round(totals.carbs * 10) / 10,
        total_fat: Math.round(totals.fat * 10) / 10,
      });
      
      await queryClient.invalidateQueries({ queryKey: ['food-entries', dateStr] });
      // Also invalidate the month's date cache so calendar highlighting updates
      await queryClient.invalidateQueries({ queryKey: ['food-dates', format(selectedDate, 'yyyy-MM')] });
      
      markEntryAsNew(entryId);
      // Input already cleared by barcode scanner
    } catch {
      // Error already logged by mutation's onError
    }
  };

  // Handle logging a saved meal from popover
  const handleLogSavedMeal = async (foodItems: FoodItem[], mealId: string) => {
    // Demo mode: show preview instead of saving
    if (isReadOnly) {
      const itemsWithUids = foodItems.map(item => ({
        ...item,
        uid: crypto.randomUUID(),
      }));
      setDemoPreviewItems(itemsWithUids);
      setDemoPreviewRawInput(null); // Saved meals don't have raw input to show
      setDemoPreviewOpen(true);
      return;
    }

    // Look up meal name for group_name
    const meal = savedMeals?.find(m => m.id === mealId);
    const groupName = meal?.name ?? null;
    createEntryFromItems(foodItems, null, mealId, groupName);
  };

  // Handle meal created from CreateMealDialog - optionally log it
  const handleMealCreated = (_meal: SavedMeal, foodItems: FoodItem[]) => {
    // User chose "Yes, log it too" from the dialog prompt
    createEntryFromItems(foodItems, null, _meal.id, _meal.name);
  };

  // Handle save as meal from FoodItemsTable expando
  const handleSaveAsMeal = (entryId: string, rawInput: string | null, foodItems: FoodItem[]) => {
    const entry = entries.find(e => e.id === entryId);
    setSaveMealDialogData({ 
      entryId, 
      rawInput, 
      foodItems,
      createdAt: entry?.created_at || new Date().toISOString(),
    });
  };

  const handleShowDetails = useCallback((entryId: string, startIndex: number, endIndex?: number) => {
    if (endIndex !== undefined && endIndex > startIndex) {
      setDetailDialogItem({ mode: 'group', startIndex, endIndex, entryId });
    } else {
      setDetailDialogItem({ mode: 'single', index: startIndex, entryId });
    }
  }, []);

  // Handle saving the meal - receives selected items directly from dialog
  const handleSaveMealConfirm = (name: string, selectedItems: FoodItem[]) => {
    if (!saveMealDialogData) return;
    
    saveMeal.mutate(
      {
        name,
        originalInput: saveMealDialogData.rawInput,
        foodItems: selectedItems,
      },
      {
        onSuccess: () => {
          setSaveMealDialogData(null);
        },
      }
    );
  };
  
  // Compute other entries for meal dialog (chronologically sorted, prioritizing entries logged before current)
  const otherEntriesForMealDialog = useMemo(() => {
    if (!saveMealDialogData) return [];
    
    return entries
      .filter(e => e.id !== saveMealDialogData.entryId)
      .sort((a, b) => {
        // Entries logged before current come first, newest-first
        const currentTime = new Date(saveMealDialogData.createdAt).getTime();
        const aTime = new Date(a.created_at).getTime();
        const bTime = new Date(b.created_at).getTime();
        
        const aIsBefore = aTime < currentTime;
        const bIsBefore = bTime < currentTime;
        
        if (aIsBefore && !bIsBefore) return -1;
        if (!aIsBefore && bIsBefore) return 1;
        if (aIsBefore && bIsBefore) return bTime - aTime; // newest first
        return aTime - bTime; // oldest first
      })
      .map(e => ({
        entryId: e.id,
        items: e.food_items,
        rawInput: e.raw_input,
        isFromSavedMeal: !!e.source_meal_id,
      }));
  }, [saveMealDialogData, entries]);

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

  // Get all current items for a specific entry - filter by entryId to avoid index race conditions
  const getItemsForEntry = useCallback((entryId: string): FoodItem[] => {
    return displayItems.filter(item => item.entryId === entryId);
  }, [displayItems]);

  // Wrapper to clear pending edits for multiple items at once
  const clearPendingForItems = useCallback((uids: string[]) => {
    uids.forEach(clearPendingForItem);
  }, [clearPendingForItem]);

  // Group portion scaling hook (atomic saves + optimistic state)
  const { entryGroupNames, entryPortionMultipliers, scaleGroupPortion, updateGroupName } = useGroupPortionScale({
    entries,
    updateEntry,
    getItemsForEntry,
    clearPendingForItems,
  });

  // Save a single entry to the database
  const saveEntry = useCallback((entryId: string, items: FoodItem[]) => {
    // Sanitize numeric values
    const sanitizedItems = items.map(item => ({
      ...item,
      calories: Number(item.calories) || 0,
      protein: Number(item.protein) || 0,
      carbs: Number(item.carbs) || 0,
      fat: Number(item.fat) || 0,
    }));

    if (sanitizedItems.length === 0) {
      // Entry is now empty, delete it
      deleteEntry.mutate(entryId);
    } else {
      // Update with new items and recalculated totals
      const totals = calculateTotals(sanitizedItems);
      updateEntry.mutate({
        id: entryId,
        food_items: sanitizedItems,
        total_calories: Math.round(totals.calories),
        total_protein: Math.round(totals.protein * 10) / 10,
        total_carbs: Math.round(totals.carbs * 10) / 10,
        total_fat: Math.round(totals.fat * 10) / 10,
      });
    }
  }, [deleteEntry, updateEntry]);

  // Auto-save handler for single field updates
  const handleItemUpdate = useCallback((index: number, field: keyof FoodItem, value: string | number) => {
    updateItem(index, field, value);
    
    // Find the entry and save it
    const entryInfo = findEntryForIndex(index);
    if (entryInfo) {
      // Get items AFTER the update by computing what they'll be
      const currentItems = getItemsForEntry(entryInfo.entryId);
      const updatedItems = currentItems.map((item, i) => 
        i === entryInfo.localIndex ? { ...item, [field]: value } : item
      );
      saveEntry(entryInfo.entryId, updatedItems);
    }
  }, [updateItem, findEntryForIndex, getItemsForEntry, saveEntry]);

  // Auto-save handler for batch updates (e.g., calories + scaled macros)
  const handleItemUpdateBatch = useCallback((index: number, updates: Partial<FoodItem>) => {
    updateItemBatch(index, updates);
    
    const entryInfo = findEntryForIndex(index);
    if (entryInfo) {
      const currentItems = getItemsForEntry(entryInfo.entryId);
      const updatedItems = currentItems.map((item, i) => 
        i === entryInfo.localIndex ? { ...item, ...updates } : item
      );
      saveEntry(entryInfo.entryId, updatedItems);
    }
  }, [updateItemBatch, findEntryForIndex, getItemsForEntry, saveEntry]);

  const handleDetailSave = useCallback((updates: Record<string, any>) => {
    if (!detailDialogItem || detailDialogItem.mode !== 'single') return;
    handleItemUpdateBatch(detailDialogItem.index, updates as Partial<FoodItem>);
    setDetailDialogItem(null);
  }, [detailDialogItem, handleItemUpdateBatch]);

  const handleDetailSaveItem = useCallback((itemIndex: number, updates: Record<string, any>) => {
    if (!detailDialogItem || detailDialogItem.mode !== 'group') return;
    const globalIndex = detailDialogItem.startIndex + itemIndex;
    handleItemUpdateBatch(globalIndex, updates as Partial<FoodItem>);
  }, [detailDialogItem, handleItemUpdateBatch]);

  // Auto-save handler for item removal (called on delete)
  const handleItemRemove = useCallback((index: number) => {
    const entryInfo = findEntryForIndex(index);
    
    if (entryInfo) {
      // Find the boundary for this entry
      const boundary = entryBoundaries.find(b => b.entryId === entryInfo.entryId);
      
      // If deleting the last item in an entry (the one with the chevron),
      // collapse the entry to prevent auto-expansion of next item
      if (boundary && index === boundary.endIndex && expandedEntryIds.has(entryInfo.entryId)) {
        setExpandedEntryIds(prev => {
          const next = new Set(prev);
          next.delete(entryInfo.entryId);
          return next;
        });
      }
      
      // Update local state
      removeItem(index);
      
      // Get items AFTER removal
      const currentItems = getItemsForEntry(entryInfo.entryId);
      const updatedItems = currentItems.filter((_, i) => i !== entryInfo.localIndex);
      saveEntry(entryInfo.entryId, updatedItems);
    } else {
      // Just remove locally if no entry found
      removeItem(index);
    }
  }, [removeItem, findEntryForIndex, getItemsForEntry, saveEntry, entryBoundaries, expandedEntryIds]);

  const handleDeleteAll = () => {
    deleteAllByDate.mutate(dateStr);
  };

  const swipeHandlers = useSwipeNavigation(
    dateNav.goToNextDay,
    dateNav.goToPreviousDay,
    dateNav.calendarOpen,
  );

  return (
    <div className="space-y-4">
      {/* Food Input Section - At top */}
      <section>
        <LogInput
          mode="food"
          ref={foodInputRef}
          onSubmit={handleSubmit}
          onScanResult={handleScanResult}
          onPhotoSubmit={handlePhotoSubmit}
          onLogSavedMeal={handleLogSavedMeal}
          onCreateNewMeal={() => setCreateMealDialogOpen(true)}
          
          isLoading={isAnalyzing || isAnalyzingPhoto || createEntry.isPending}
        />
        {analyzeError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mt-3">
            Analysis failed: {analyzeError}
          </div>
        )}
        {photoError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mt-3">
            Photo analysis failed: {photoError}
          </div>
        )}
        {analyzeWarning && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mt-3">
            {analyzeWarning}
          </div>
        )}
        
        {/* Similar Entry Prompt (from history reference detection) */}
        {pendingEntryMatch && (
          <div className="mt-3">
            <SimilarEntryPrompt
              match={pendingEntryMatch.match}
              onUsePastEntry={handleUsePastEntry}
              onDismiss={dismissEntryMatch}
              onCancel={handleCancelEntryMatch}
              isLoading={isAnalyzing || createEntry.isPending}
            />
          </div>
        )}

        
        {/* Save Suggestion Prompt (for repeated entries) */}
        {saveSuggestion && (
          <div className="mt-3">
            <SaveSuggestionPrompt<FoodItem>
              mode="food"
              matchCount={saveSuggestion.matchCount}
              items={saveSuggestionItems}
              onItemsChange={handleSuggestionItemsChange}
              onSave={handleSaveSuggestion}
              onDismiss={handleDismissSuggestion}
              onOptOut={handleOptOutMealSuggestions}
              showOptOutLink={shouldShowOptOutLink()}
              isLoading={saveMeal.isPending}
              renderItemsTable={(props) => (
                <FoodItemsTable
                  items={props.items}
                  editable={props.editable}
                  onUpdateItem={props.onUpdateItem}
                  onUpdateItemBatch={props.onUpdateItemBatch}
                  onRemoveItem={props.onRemoveItem}
                  showHeader={false}
                  showTotals={true}
                  totalsPosition="bottom"
                  showInlineLabels={true}
                  showMacroPercentages={false}
                  compact={true}
                  showTotalsDivider={false}
                />
              )}
            />
          </div>
        )}
      </section>

      {/* Swipe zone: DateNavigation + entries (swipe left = next day, swipe right = prev day) */}
      <div ref={swipeHandlers.ref} onTouchStart={swipeHandlers.onTouchStart} onTouchEnd={swipeHandlers.onTouchEnd} style={{ touchAction: 'pan-y' }} className="min-h-[calc(100dvh-8rem)] md:min-h-0">
        <DateNavigation
          mountDir={mountDir}
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
          datesWithData={datesWithFood}
          highlightClassName="text-blue-600 dark:text-blue-400 font-semibold"
          weekStartDay={settings.weekStartDay}
        />

        <section className={cn("mt-4", mountDir === 'left' && 'animate-slide-in-from-right', mountDir === 'right' && 'animate-slide-in-from-left')}>
          {displayItems.length > 0 && (
            <FoodItemsTable
              items={displayItems}
              editable={true}
              onUpdateItem={handleItemUpdate}
              onUpdateItemBatch={handleItemUpdateBatch}
              onRemoveItem={handleItemRemove}
              newEntryIds={newEntryIds}
              totals={displayTotals}
              totalsPosition="top"
              showTotals={true}
              onDeleteAll={handleDeleteAll}
              entryBoundaries={entryBoundaries}
              entryRawInputs={entryRawInputs}
              expandedEntryIds={expandedEntryIds}
              onToggleEntryExpand={handleToggleEntryExpand}
              onSaveAsMeal={handleSaveAsMeal}
              entryMealNames={entryMealNames}
              entrySourceMealIds={entrySourceMealIds}
              entryGroupNames={entryGroupNames}
              onUpdateGroupName={updateGroupName}
              entryPortionMultipliers={entryPortionMultipliers}
              onScaleGroupPortion={scaleGroupPortion}
              dailyCalorieTarget={(() => {
                const base = getEffectiveDailyTarget(settings);
                if (base == null) return undefined;
                if (usesBurns) {
                  const burn = dailyBurnForSelectedDay;
                  return getExerciseAdjustedTarget(base, burn);
                }
                return base;
              })()}
              showCalorieTargetDot={true}
              dailyBurn={dailyBurnForSelectedDay}
              calorieTargetComponents={getCalorieTargetComponents(settings)}
              isToday={isTodaySelected}
              onDeleteEntry={(entryId) => {
                deleteEntry.mutate(entryId);
                setExpandedEntryIds(prev => {
                  const next = new Set(prev);
                  next.delete(entryId);
                  return next;
                });
              }}
              onShowDetails={handleShowDetails}
              onCopyEntryToToday={!isTodaySelected && !isReadOnly ? handleCopyEntryToToday : undefined}
            />
          )}

          {displayItems.length === 0 && isFetching && (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {displayItems.length === 0 && !isFetching && !isAnalyzing && (
            <p className="text-muted-foreground">
              {isTodaySelected ? 'No entries yet today.' : 'No entries for this day.'}
            </p>
          )}
        </section>
      </div>

      {/* Save Meal Dialog (from existing entry) */}
      {saveMealDialogData && (
        <SaveMealDialog
          open={!!saveMealDialogData}
          onOpenChange={(open) => !open && setSaveMealDialogData(null)}
          rawInput={saveMealDialogData.rawInput}
          foodItems={saveMealDialogData.foodItems}
          onSave={handleSaveMealConfirm}
          isSaving={saveMeal.isPending}
          otherEntries={otherEntriesForMealDialog}
        />
      )}

      {/* Create New Meal Dialog */}
      {createMealDialogOpen && (
        <CreateMealDialog
          open={createMealDialogOpen}
          onOpenChange={setCreateMealDialogOpen}
          onMealCreated={handleMealCreated}
          showLogPrompt={true}
        />
      )}

      {/* Demo Preview Dialog (for read-only demo users) */}
      <DemoPreviewDialog
        mode="food"
        open={demoPreviewOpen}
        onOpenChange={setDemoPreviewOpen}
        foodItems={demoPreviewItems}
        rawInput={demoPreviewRawInput}
      />

      {/* Detail Dialog for viewing/editing individual food items */}
      {detailDialogItem && (() => {
        if (detailDialogItem.mode === 'group') {
          const groupItems = displayItems.slice(detailDialogItem.startIndex, detailDialogItem.endIndex + 1);
          if (groupItems.length === 0) return null;
          const entry = entries.find(e => e.id === detailDialogItem.entryId);
          const groupTitle = entry?.group_name || entry?.raw_input || groupItems[0].description;
          return (
            <DetailDialog
              open={true}
              onOpenChange={() => setDetailDialogItem(null)}
              title={groupTitle}
              fields={buildFoodDetailFields(groupItems[0])}
              values={groupItems[0]}
              onSave={handleDetailSave}
              items={groupItems}
              onSaveItem={handleDetailSaveItem}
              buildFields={buildFoodDetailFields}
              hideWhenZero={FOOD_HIDE_WHEN_ZERO}
              readOnly={isReadOnly}
               labelClassName="min-w-[3.5rem] sm:min-w-[4rem]"
            />
          );
        }
        // Single item mode
        const item = displayItems[detailDialogItem.index];
        if (!item) return null;
        return (
          <DetailDialog
            open={true}
            onOpenChange={() => setDetailDialogItem(null)}
            title={item.description}
            fields={buildFoodDetailFields(item)}
            values={item}
            onSave={handleDetailSave}
            hideWhenZero={FOOD_HIDE_WHEN_ZERO}
            readOnly={isReadOnly}
            labelClassName="min-w-[3.5rem] sm:min-w-[4rem]"
          />
        );
      })()}
    </div>
  );
};
