import { useState, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { FoodInput, FoodInputRef } from '@/components/FoodInput';
import { FoodItemsTable } from '@/components/FoodItemsTable';
import { Button } from '@/components/ui/button';
import { useAnalyzeFood } from '@/hooks/useAnalyzeFood';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { useEditableFoodItems } from '@/hooks/useEditableFoodItems';
import { FoodItem, calculateTotals } from '@/types/food';

const FoodLog = () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { entries, createEntry, updateEntry, deleteEntry, deleteAllByDate } = useFoodEntries(today);
  const { analyzeFood, isAnalyzing, error: analyzeError } = useAnalyzeFood();
  
  const foodInputRef = useRef<FoodInputRef>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Flatten all entries into a single items array with entry tracking
  const { allItems, entryBoundaries, todaysTotals } = useMemo(() => {
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
      todaysTotals: {
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

  // Initialize display items from DB on first load (one-time, event-driven)
  if (!isInitialized && allItems.length > 0) {
    setItemsWithBaseline(allItems, null);
    setIsInitialized(true);
  }

  // Reset handler
  const handleResetChanges = () => {
    setItemsWithBaseline(allItems, null);
  };

  // Calculate display totals based on current edit state
  const displayTotals = hasChanges ? calculateTotals(displayItems) : todaysTotals;

  const handleSubmit = async (text: string) => {
    const result = await analyzeFood(text);
    if (result) {
      // Capture current items as baseline BEFORE mutation for highlighting
      const currentItems = [...displayItems];
      
      const totals = calculateTotals(result.food_items);
      createEntry.mutate(
        {
          eaten_date: today,
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
    deleteAllByDate.mutate(today, {
      onSuccess: () => {
        setItemsWithBaseline([], null);
        setIsInitialized(false);
      },
    });
  };

  return (
    <div className="space-y-6">
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

      <section className="space-y-3">
        <h2 className="text-heading">Today ({format(new Date(), 'M/d')})</h2>
        {entries.length > 0 ? (
          <>
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
            />
            {hasChanges && (
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={handleSaveChanges}>
                  Save Changes
                </Button>
                <Button size="sm" variant="ghost" onClick={handleResetChanges}>
                  Discard
                </Button>
              </div>
            )}
          </>
        ) : (
          <p className="text-body text-muted-foreground">No entries yet today.</p>
        )}
      </section>
    </div>
  );
};

export default FoodLog;
