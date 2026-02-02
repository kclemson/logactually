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
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAnalyzeFood } from '@/hooks/useAnalyzeFood';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { useEditableFoodItems } from '@/hooks/useEditableItems';
import { useSavedMeals, useSaveMeal, useLogSavedMeal } from '@/hooks/useSavedMeals';
import { findSimilarMeals, createItemsSignature, SimilarMealMatch } from '@/lib/text-similarity';
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

  // State for similar meal prompt
  const [similarMatch, setSimilarMatch] = useState<SimilarMealMatch | null>(null);
  const [pendingAiResult, setPendingAiResult] = useState<{
    text: string;
    items: FoodItem[];
  } | null>(null);
  
  // Date is stable for this component instance - derived from props, no state needed
  const dateStr = initialDate;
  const selectedDate = parseISO(initialDate);
  const isTodaySelected = isToday(selectedDate);
  
  const queryClient = useQueryClient();
  const { entries, isFetching, createEntry, updateEntry, deleteEntry, deleteAllByDate } = useFoodEntries(dateStr);
  const { data: datesWithFood = [] } = useFoodDatesWithData(calendarMonth);
  const { analyzeFood, isAnalyzing, error: analyzeError, warning: analyzeWarning } = useAnalyzeFood();
  const { data: savedMeals } = useSavedMeals();
  const saveMeal = useSaveMeal();
  const logSavedMeal = useLogSavedMeal();
  
  
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
  const createEntryFromItems = useCallback(async (items: FoodItem[], rawInput: string | null, sourceMealId?: string) => {
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
    } catch {
      // Error already logged by mutation's onError
    }
  }, [createEntry, dateStr, queryClient, markEntryAsNew]);

  const handleSubmit = async (text: string) => {
    const result = await analyzeFood(text);
    if (result) {
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

  const handleKeepThis = () => {
    if (!pendingAiResult) return;
    
    createEntryFromItems(pendingAiResult.items, pendingAiResult.text);
    
    setSimilarMatch(null);
    setPendingAiResult(null);
  };

  const handleSaveAsNew = () => {
    if (!pendingAiResult) return;
    
    // First save the entry
    createEntryFromItems(pendingAiResult.items, pendingAiResult.text);
    
    // Then open save meal dialog
    setSaveMealDialogData({
      entryId: '', // Not from an existing entry
      rawInput: pendingAiResult.text,
      foodItems: pendingAiResult.items,
    });
    
    setSimilarMatch(null);
    setPendingAiResult(null);
  };

  // Handle direct scan results (when barcode lookup succeeds)
  const handleScanResult = async (foodItem: Omit<FoodItem, 'uid' | 'entryId'>, originalInput: string) => {
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
        
        {/* Similar Meal Prompt */}
        {similarMatch && (
          <div className="mt-3">
            <SimilarMealPrompt
              match={similarMatch}
              onUseSaved={handleUseSaved}
              onKeepThis={handleKeepThis}
              onSaveAsNew={handleSaveAsNew}
              isLoading={logSavedMeal.isPending || createEntry.isPending}
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
    </div>
  );
};
