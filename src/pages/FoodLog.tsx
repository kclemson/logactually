import { useState, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { format, addDays, subDays, isToday, parseISO, isFuture, startOfMonth } from 'date-fns';
import { useFoodDatesWithData } from '@/hooks/useDatesWithData';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogInput, LogInputRef } from '@/components/LogInput';
import { FoodItemsTable } from '@/components/FoodItemsTable';
import { SaveMealDialog } from '@/components/SaveMealDialog';
import { CreateMealDialog } from '@/components/CreateMealDialog';
import { SimilarMealPrompt } from '@/components/SimilarMealPrompt';
import { SimilarEntryPrompt } from '@/components/SimilarEntryPrompt';
import { SaveSuggestionPrompt } from '@/components/SaveSuggestionPrompt';
import { DemoPreviewDialog } from '@/components/DemoPreviewDialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAnalyzeFood } from '@/hooks/useAnalyzeFood';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { useRecentFoodEntries } from '@/hooks/useRecentFoodEntries';
import { useEditableFoodItems } from '@/hooks/useEditableItems';
import { useSavedMeals, useSaveMeal, useLogSavedMeal } from '@/hooks/useSavedMeals';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useReadOnlyContext } from '@/contexts/ReadOnlyContext';
import { findSimilarMeals, createItemsSignature, SimilarMealMatch, findSimilarEntry, SimilarEntryMatch } from '@/lib/text-similarity';
import { detectHistoryReference, MIN_SIMILARITY_REQUIRED } from '@/lib/history-patterns';
import { detectRepeatedFoodEntry, isDismissed, dismissSuggestion, shouldShowOptOutLink, FoodSaveSuggestion } from '@/lib/repeated-entry-detection';
import { FoodItem, SavedMeal, calculateTotals } from '@/types/food';

// Wrapper component: extracts date from URL, forces remount via key
const FoodLog = () => {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const dateKey = dateParam || format(new Date(), 'yyyy-MM-dd');
  
  return <FoodLogContent key={dateKey} initialDate={dateKey} />;
};

export default FoodLog;

interface FoodLogContentProps {
  initialDate: string;
}

const FoodLogContent = ({ initialDate }: FoodLogContentProps) => {
  const [, setSearchParams] = useSearchParams();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set());
  
  // State for save meal dialog (from existing entry)
  const [saveMealDialogData, setSaveMealDialogData] = useState<{
    entryId: string;
    rawInput: string | null;
    foodItems: FoodItem[];
  } | null>(null);
  

  // State for create meal dialog
  const [createMealDialogOpen, setCreateMealDialogOpen] = useState(false);

  // State for similar meal prompt (from AI result matching saved meal)
  const [similarMatch, setSimilarMatch] = useState<SimilarMealMatch | null>(null);
  const [pendingAiResult, setPendingAiResult] = useState<{
    text: string;
    items: FoodItem[];
  } | null>(null);

  // State for similar entry prompt (from history reference detection)
  const [pendingEntryMatch, setPendingEntryMatch] = useState<{
    match: SimilarEntryMatch;
    originalInput: string;
  } | null>(null);

  // Demo preview state (for read-only demo users)
  const [demoPreviewOpen, setDemoPreviewOpen] = useState(false);
  const [demoPreviewItems, setDemoPreviewItems] = useState<FoodItem[]>([]);
  const [demoPreviewRawInput, setDemoPreviewRawInput] = useState<string | null>(null);
  
  // Save suggestion state (for repeated entries detection)
  const [saveSuggestion, setSaveSuggestion] = useState<FoodSaveSuggestion | null>(null);
  const [saveSuggestionItems, setSaveSuggestionItems] = useState<FoodItem[]>([]);
  const [createMealFromSuggestion, setCreateMealFromSuggestion] = useState(false);
  
  // Date is stable for this component instance - derived from props, no state needed
  const dateStr = initialDate;
  const selectedDate = parseISO(initialDate);
  const isTodaySelected = isToday(selectedDate);
  
  const queryClient = useQueryClient();
  const { entries, isFetching, createEntry, updateEntry, deleteEntry, deleteAllByDate } = useFoodEntries(dateStr);
  const { data: datesWithFood = [] } = useFoodDatesWithData(calendarMonth);
  const { analyzeFood, isAnalyzing, error: analyzeError, warning: analyzeWarning } = useAnalyzeFood();
  const { data: savedMeals } = useSavedMeals();
  const { data: recentEntries } = useRecentFoodEntries(90); // 90 days for history matching
  const saveMeal = useSaveMeal();
  const logSavedMeal = useLogSavedMeal();
  const { settings, updateSettings } = useUserSettings();
  const { isReadOnly } = useReadOnlyContext();
  
  
  const foodInputRef = useRef<LogInputRef>(null);

  // Navigation updates URL directly - triggers remount via wrapper's key
  const goToPreviousDay = () => {
    const prevDate = format(subDays(selectedDate, 1), 'yyyy-MM-dd');
    setSearchParams({ date: prevDate }, { replace: true });
  };

  const goToNextDay = () => {
    const nextDate = format(addDays(selectedDate, 1), 'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (nextDate === todayStr) {
      setSearchParams({}, { replace: true }); // Remove param for today
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

  // Toggle handler for expanding/collapsing raw inputs
  const handleToggleEntryExpand = (entryId: string) => {
    setExpandedEntryIds(prev => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  };

  // Helper to create and save entry from food items
  const createEntryFromItems = useCallback(async (items: FoodItem[], rawInput: string | null, sourceMealId?: string, skipSaveSuggestion?: boolean) => {
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
        eaten_date: dateStr,
        raw_input: rawInput,
        food_items: itemsWithUids,
        total_calories: Math.round(totals.calories),
        total_protein: Math.round(totals.protein * 10) / 10,
        total_carbs: Math.round(totals.carbs * 10) / 10,
        total_fat: Math.round(totals.fat * 10) / 10,
        source_meal_id: sourceMealId ?? null,
      });
      
      // Wait for cache to update so entry is in DOM
      await queryClient.invalidateQueries({ queryKey: ['food-entries', dateStr] });
      
      markEntryAsNew(entryId);
      foodInputRef.current?.clear();
      
      // Check for repeated patterns (skip demo mode, saved meal entries, and dismissed similar meal)
      if (!isReadOnly && settings.suggestMealSaves && recentEntries && !sourceMealId && !skipSaveSuggestion) {
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

  const handleSubmit = async (text: string) => {
    // 1. Check for history reference patterns BEFORE AI call (skip for demo mode)
    if (!isReadOnly && recentEntries?.length) {
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

      // Check for similar saved meals
      if (savedMeals && savedMeals.length > 0) {
        const itemsSignature = createItemsSignature(result.food_items);
        const match = findSimilarMeals(text, itemsSignature, savedMeals, 0.6);
        
        if (match) {
          // Show similar meal prompt
          setPendingAiResult({ text, items: result.food_items });
          setSimilarMatch(match);
          return;
        }
      }

      // No similar meal found - proceed normally
      createEntryFromItems(result.food_items, text);
    }
  };

  // Similar meal prompt handlers
  const handleUseSaved = async () => {
    if (!similarMatch) return;
    
    const foodItems = await logSavedMeal.mutateAsync(similarMatch.meal.id);
    createEntryFromItems(foodItems, similarMatch.meal.original_input, similarMatch.meal.id);
    
    setSimilarMatch(null);
    setPendingAiResult(null);
  };

  const dismissSimilarMatch = useCallback(() => {
    if (pendingAiResult) {
      // User already has a saved meal but chose not to use it - don't suggest saving again
      createEntryFromItems(pendingAiResult.items, pendingAiResult.text, undefined, true);
    }
    setSimilarMatch(null);
    setPendingAiResult(null);
  }, [pendingAiResult, createEntryFromItems]);

  // Save suggestion handlers
  const handleSaveSuggestion = useCallback(() => {
    setCreateMealFromSuggestion(true);
    setSaveSuggestion(null);
  }, []);

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

  const handleMealFromSuggestionCreated = useCallback((meal: SavedMeal, foodItems: FoodItem[]) => {
    setCreateMealFromSuggestion(false);
    setSaveSuggestionItems([]);
  }, []);

  // Similar entry prompt handlers (for history reference detection)
  const handleUsePastEntry = useCallback(async () => {
    if (!pendingEntryMatch) return;
    
    // Use the historical entry's food items with original input text
    createEntryFromItems(
      pendingEntryMatch.match.entry.food_items, 
      pendingEntryMatch.originalInput
    );
    
    setPendingEntryMatch(null);
    foodInputRef.current?.clear();
  }, [pendingEntryMatch, createEntryFromItems]);

  const dismissEntryMatch = useCallback(async () => {
    if (!pendingEntryMatch) return;
    
    // User dismissed - fall back to AI analysis
    const text = pendingEntryMatch.originalInput;
    setPendingEntryMatch(null);
    
    const result = await analyzeFood(text);
    if (result) {
      // Check for similar saved meals
      if (savedMeals && savedMeals.length > 0) {
        const itemsSignature = createItemsSignature(result.food_items);
        const match = findSimilarMeals(text, itemsSignature, savedMeals, 0.6);
        
        if (match) {
          setPendingAiResult({ text, items: result.food_items });
          setSimilarMatch(match);
          return;
        }
      }
      
      createEntryFromItems(result.food_items, text);
    }
  }, [pendingEntryMatch, analyzeFood, savedMeals, createEntryFromItems]);

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

    createEntryFromItems(foodItems, null, mealId);
  };

  // Handle meal created from CreateMealDialog - optionally log it
  const handleMealCreated = (_meal: SavedMeal, foodItems: FoodItem[]) => {
    // User chose "Yes, log it too" from the dialog prompt
    createEntryFromItems(foodItems, null, _meal.id);
  };

  // Handle save as meal from FoodItemsTable expando
  const handleSaveAsMeal = (entryId: string, rawInput: string | null, foodItems: FoodItem[]) => {
    setSaveMealDialogData({ entryId, rawInput, foodItems });
  };

  // Handle saving the meal
  const handleSaveMealConfirm = (name: string) => {
    if (!saveMealDialogData) return;
    
    saveMeal.mutate(
      {
        name,
        originalInput: saveMealDialogData.rawInput,
        foodItems: saveMealDialogData.foodItems,
      },
      {
        onSuccess: () => {
          setSaveMealDialogData(null);
        },
      }
    );
  };

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

  return (
    <div className="space-y-4">
      {/* Food Input Section - At top */}
      <section>
        <LogInput
          mode="food"
          ref={foodInputRef}
          onSubmit={handleSubmit}
          onScanResult={handleScanResult}
          onLogSavedMeal={handleLogSavedMeal}
          onCreateNewMeal={() => setCreateMealDialogOpen(true)}
          onDismissSimilarMatch={dismissSimilarMatch}
          isLoading={isAnalyzing || createEntry.isPending}
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
        
        {/* Similar Entry Prompt (from history reference detection) */}
        {pendingEntryMatch && (
          <div className="mt-3">
            <SimilarEntryPrompt
              match={pendingEntryMatch.match}
              onUsePastEntry={handleUsePastEntry}
              onDismiss={dismissEntryMatch}
              isLoading={isAnalyzing || createEntry.isPending}
            />
          </div>
        )}

        {/* Similar Meal Prompt (from AI result matching saved meal) */}
        {similarMatch && (
          <div className="mt-3">
            <SimilarMealPrompt
              match={similarMatch}
              onUseSaved={handleUseSaved}
              onDismiss={dismissSimilarMatch}
              isLoading={logSavedMeal.isPending || createEntry.isPending}
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
              modifiers={{ hasData: datesWithFood }}
              modifiersClassNames={{ hasData: "text-blue-600 dark:text-blue-400 font-semibold" }}
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
          className={cn("h-11 w-11", isTodaySelected && "opacity-20")}
          aria-label="Next day"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <section>
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

      {/* Save Meal Dialog (from existing entry) */}
      {saveMealDialogData && (
        <SaveMealDialog
          open={!!saveMealDialogData}
          onOpenChange={(open) => !open && setSaveMealDialogData(null)}
          rawInput={saveMealDialogData.rawInput}
          foodItems={saveMealDialogData.foodItems}
          onSave={handleSaveMealConfirm}
          isSaving={saveMeal.isPending}
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

      {/* Create Meal from Suggestion Dialog */}
      {createMealFromSuggestion && (
        <CreateMealDialog
          open={createMealFromSuggestion}
          onOpenChange={setCreateMealFromSuggestion}
          onMealCreated={handleMealFromSuggestionCreated}
          showLogPrompt={false}
          initialItems={saveSuggestionItems}
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
    </div>
  );
};
