import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, addDays, subDays, isToday, parseISO } from 'date-fns';
import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { FoodInput, FoodInputRef } from '@/components/FoodInput';
import { FoodItemsTable } from '@/components/FoodItemsTable';
import { Button } from '@/components/ui/button';
import { useAnalyzeFood } from '@/hooks/useAnalyzeFood';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { useEditableFoodItems } from '@/hooks/useEditableFoodItems';
import { FoodItem, calculateTotals } from '@/types/food';

const FoodLog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Parse date from URL or default to today
  const dateParam = searchParams.get('date');
  const [selectedDate, setSelectedDate] = useState(() => {
    if (dateParam) {
      try {
        return parseISO(dateParam);
      } catch {
        return new Date();
      }
    }
    return new Date();
  });

  // Sync URL when date changes
  useEffect(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    if (dateStr === todayStr) {
      // Remove date param when viewing today
      if (searchParams.has('date')) {
        searchParams.delete('date');
        setSearchParams(searchParams, { replace: true });
      }
    } else {
      // Set date param when viewing other days
      if (searchParams.get('date') !== dateStr) {
        setSearchParams({ date: dateStr }, { replace: true });
      }
    }
  }, [selectedDate, searchParams, setSearchParams]);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const isTodaySelected = isToday(selectedDate);
  
  const { entries, createEntry, updateEntry, deleteEntry, deleteAllByDate } = useFoodEntries(dateStr);
  const { analyzeFood, isAnalyzing, error: analyzeError } = useAnalyzeFood();
  
  const foodInputRef = useRef<FoodInputRef>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastLoadedDate, setLastLoadedDate] = useState<string | null>(null);

  // Navigation handlers
  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());

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

  // Event-driven editing state
  const { 
    items: displayItems,
    previousItems,
    hasChanges, 
    updateItem, 
    removeItem,
    setItemsWithBaseline,
  } = useEditableFoodItems();

  // Reset state when date changes
  useEffect(() => {
    if (lastLoadedDate !== dateStr) {
      setIsInitialized(false);
      setItemsWithBaseline([], null);
      setLastLoadedDate(dateStr);
    }
  }, [dateStr, lastLoadedDate, setItemsWithBaseline]);

  // Initialize display items from DB on first load (one-time, event-driven)
  if (!isInitialized && allItems.length > 0 && lastLoadedDate === dateStr) {
    setItemsWithBaseline(allItems, null);
    setIsInitialized(true);
  }

  // Reset handler
  const handleResetChanges = () => {
    setItemsWithBaseline(allItems, null);
  };

  // Calculate display totals based on current edit state
  const displayTotals = hasChanges ? calculateTotals(displayItems) : dayTotals;

  const handleSubmit = async (text: string) => {
    const result = await analyzeFood(text);
    if (result) {
      // Capture current items as baseline BEFORE mutation for highlighting
      const currentItems = [...displayItems];
      
      const totals = calculateTotals(result.food_items);
      createEntry.mutate(
        {
          eaten_date: dateStr,
          raw_input: text,
          food_items: result.food_items,
          total_calories: Math.round(totals.calories),
          total_protein: Math.round(totals.protein * 10) / 10,
          total_carbs: Math.round(totals.carbs * 10) / 10,
          total_fat: Math.round(totals.fat * 10) / 10,
        },
        {
          onSuccess: () => {
            // Update display with new items, using current as baseline for highlighting
            const newItems = [...currentItems, ...result.food_items];
            setItemsWithBaseline(newItems, currentItems);
            foodInputRef.current?.clear();
          },
        }
      );
    }
  };

  // Save edits by mapping flat items back to their original entries
  const handleSaveChanges = () => {
    // Build a map of entryId -> items for that entry
    const entryItemsMap = new Map<string, FoodItem[]>();
    entries.forEach(e => entryItemsMap.set(e.id, []));

    // Track current position in displayItems
    let displayIndex = 0;

    // Walk through original boundaries and assign displayItems accordingly
    for (const boundary of entryBoundaries) {
      const originalCount = boundary.endIndex - boundary.startIndex + 1;
      const entryItems: FoodItem[] = [];
      
      // Count how many items remain for this entry
      for (let i = 0; i < originalCount && displayIndex < displayItems.length; i++) {
        entryItems.push(displayItems[displayIndex]);
        displayIndex++;
      }
      
      entryItemsMap.set(boundary.entryId, entryItems);
    }

    // Now apply updates/deletes for each entry
    for (const [entryId, items] of entryItemsMap) {
      if (items.length === 0) {
        // Entry is now empty, delete it
        deleteEntry.mutate(entryId, {
          onSuccess: () => {
            // Sync display state after successful delete, preserve highlighting
            setItemsWithBaseline(allItems.filter(item => 
              !entries.find(e => e.id === entryId)?.food_items.includes(item)
            ), previousItems);
          },
        });
      } else {
        // Update with new items and recalculated totals
        const totals = calculateTotals(items);
        updateEntry.mutate(
          {
            id: entryId,
            food_items: items,
            total_calories: Math.round(totals.calories),
            total_protein: Math.round(totals.protein * 10) / 10,
            total_carbs: Math.round(totals.carbs * 10) / 10,
            total_fat: Math.round(totals.fat * 10) / 10,
          },
          {
            onSuccess: () => {
              // Keep previousItems to persist highlighting until next user action
              setItemsWithBaseline(displayItems, previousItems);
            },
          }
        );
      }
    }
  };

  const handleDeleteAll = () => {
    deleteAllByDate.mutate(dateStr, {
      onSuccess: () => {
        setItemsWithBaseline([], null);
        setIsInitialized(false);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Date Navigation Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPreviousDay}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <h2 className="text-heading">
            {isTodaySelected ? 'Today' : format(selectedDate, 'EEEE')}
          </h2>
          <p className="text-body text-muted-foreground">
            {format(selectedDate, 'MMMM d, yyyy')}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextDay}
          disabled={isTodaySelected}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Jump to Today button when viewing past dates */}
      {!isTodaySelected && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Jump to Today
          </Button>
        </div>
      )}

      {/* Food Input Section */}
      <section>
        <FoodInput
          ref={foodInputRef}
          onSubmit={handleSubmit} 
          isLoading={isAnalyzing || createEntry.isPending}
        />
        {analyzeError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Analysis failed: {analyzeError}
          </div>
        )}
      </section>

      {/* Food Items Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-heading">
            {isTodaySelected ? `Today (${format(selectedDate, 'M/d')})` : format(selectedDate, 'EEEE (M/d)')}
          </h2>
          
          {hasChanges && (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSaveChanges}
                className="flex items-center gap-1 px-2 py-1 rounded text-sm text-green-600 hover:bg-green-100 dark:text-green-500 dark:hover:bg-green-900/30"
              >
                <Check className="h-4 w-4" />
                <span>Save</span>
              </button>
              <button 
                onClick={handleResetChanges}
                className="flex items-center gap-1 px-2 py-1 rounded text-sm text-red-600 hover:bg-red-100 dark:text-red-500 dark:hover:bg-red-900/30"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>
        {entries.length > 0 ? (
          <FoodItemsTable
            items={displayItems}
            editable={true}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
            onDiscard={handleResetChanges}
            previousItems={previousItems}
            totals={displayTotals}
            totalsPosition="top"
            showTotals={true}
            onDeleteAll={handleDeleteAll}
            hasChanges={hasChanges}
            onSave={handleSaveChanges}
          />
        ) : (
          <p className="text-body text-muted-foreground">
            {isTodaySelected ? 'No entries yet today.' : 'No entries for this day.'}
          </p>
        )}
      </section>
    </div>
  );
};

export default FoodLog;
