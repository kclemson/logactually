import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, addDays, subDays, isToday, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FoodInput, FoodInputRef } from '@/components/FoodInput';
import { FoodItemsTable } from '@/components/FoodItemsTable';
import { Button } from '@/components/ui/button';
import { useAnalyzeFood } from '@/hooks/useAnalyzeFood';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { useEditableFoodItems } from '@/hooks/useEditableFoodItems';
import { FoodItem, calculateTotals } from '@/types/food';

const FoodLog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set());
  
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

  // Editing state with new clean architecture
  const { 
    items: displayItems,
    newItemUids,
    updateItem, 
    removeItem,
    setItemsFromDB,
    addNewItems,
    clearNewHighlights,
  } = useEditableFoodItems();

  // Reset state when date changes
  useEffect(() => {
    if (lastLoadedDate !== dateStr) {
      setIsInitialized(false);
      setItemsFromDB([]);
      setLastLoadedDate(dateStr);
    }
  }, [dateStr, lastLoadedDate, setItemsFromDB]);

  // Initialize display items from DB on first load (one-time, event-driven)
  if (!isInitialized && allItems.length > 0 && lastLoadedDate === dateStr) {
    setItemsFromDB(allItems);
    setIsInitialized(true);
  }

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

  // Toggle handler for expanding/collapsing raw inputs
  const handleToggleEntryExpand = (entryId: string) => {
    setExpandedEntryIds(prev => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  };

  const handleSubmit = async (text: string) => {
    const result = await analyzeFood(text);
    if (result) {
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
          onSuccess: (createdEntry) => {
            // Attach the new entry's ID to each item for raw inputs tracking
            const itemsWithEntryId = result.food_items.map(item => ({
              ...item,
              entryId: createdEntry.id,
            }));
            addNewItems(itemsWithEntryId);
            foodInputRef.current?.clear();
          },
        }
      );
    }
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

  // Get all current items for a specific entry
  const getItemsForEntry = useCallback((entryId: string): FoodItem[] => {
    const boundary = entryBoundaries.find(b => b.entryId === entryId);
    if (!boundary) return [];
    return displayItems.slice(boundary.startIndex, boundary.endIndex + 1);
  }, [entryBoundaries, displayItems]);

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

  // Auto-save handler for item updates (called on blur)
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

  // Auto-save handler for item removal (called on delete)
  const handleItemRemove = useCallback((index: number) => {
    const entryInfo = findEntryForIndex(index);
    
    // Update local state first
    removeItem(index);
    
    if (entryInfo) {
      // Get items AFTER removal
      const currentItems = getItemsForEntry(entryInfo.entryId);
      const updatedItems = currentItems.filter((_, i) => i !== entryInfo.localIndex);
      saveEntry(entryInfo.entryId, updatedItems);
    }
  }, [removeItem, findEntryForIndex, getItemsForEntry, saveEntry]);

  const handleDeleteAll = () => {
    deleteAllByDate.mutate(dateStr, {
      onSuccess: () => {
        setItemsFromDB([]);
        setIsInitialized(false);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Food Input Section - At top */}
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

      {/* Date Navigation */}
      <div className="flex items-center justify-center gap-1">
        <Button variant="ghost" size="icon" onClick={goToPreviousDay} className="h-11 w-11">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-3 min-w-[180px] justify-center">
          <span className="text-heading">
            {isTodaySelected 
              ? `Today (${format(selectedDate, 'M/d')})` 
              : format(selectedDate, 'EEEE (M/d)')}
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextDay}
          disabled={isTodaySelected}
          className={cn("h-11 w-11", isTodaySelected && "opacity-20")}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <section>
        {entries.length > 0 ? (
          <FoodItemsTable
            items={displayItems}
            editable={true}
            onUpdateItem={handleItemUpdate}
            onRemoveItem={handleItemRemove}
            newItemUids={newItemUids}
            totals={displayTotals}
            totalsPosition="top"
            showTotals={true}
            onDeleteAll={handleDeleteAll}
            entryBoundaries={entryBoundaries}
            entryRawInputs={entryRawInputs}
            expandedEntryIds={expandedEntryIds}
            onToggleEntryExpand={handleToggleEntryExpand}
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
