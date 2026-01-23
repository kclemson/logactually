import { useState, useCallback, useEffect } from 'react';
import { FoodItem } from '@/types/food';

interface UseEditableFoodItemsOptions {
  initialItems: FoodItem[];
}

export function useEditableFoodItems({ initialItems }: UseEditableFoodItemsOptions) {
  const [items, setItems] = useState<FoodItem[]>(initialItems);
  const [previousItems, setPreviousItems] = useState<FoodItem[] | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  // Cache original item values when user starts editing calories (to avoid compounding errors)
  const [calorieEditBaseline, setCalorieEditBaseline] = useState<Map<number, FoodItem>>(new Map());

  // Sync with initialItems when they change externally (e.g., after database save)
  useEffect(() => {
    setItems(initialItems);
    setPreviousItems(null);
    setHasChanges(false);
    setCalorieEditBaseline(new Map());
  }, [initialItems]);

  const updateItem = useCallback((
    index: number,
    field: keyof FoodItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        // If changing calories, scale macros proportionally from cached baseline
        if (field === 'calories' && typeof value === 'number') {
          // Get or create baseline for this item
          let baseline = calorieEditBaseline.get(index);
          if (!baseline) {
            baseline = { ...item };
            setCalorieEditBaseline(prevBaseline => new Map(prevBaseline).set(index, baseline!));
          }

          // Handle zero baseline (edge case - can't scale from 0)
          if (baseline.calories === 0) {
            return { ...item, calories: value };
          }

          // Scale from baseline, not current values
          const ratio = value / baseline.calories;
          return {
            ...item,
            calories: value,
            protein: Math.round(baseline.protein * ratio * 10) / 10,
            carbs: Math.round(baseline.carbs * ratio * 10) / 10,
            fat: Math.round(baseline.fat * ratio * 10) / 10,
          };
        }

        // For other fields, clear baseline so future calorie edits use new values as reference
        setCalorieEditBaseline(prevBaseline => {
          const next = new Map(prevBaseline);
          next.delete(index);
          return next;
        });
        return { ...item, [field]: value };
      })
    );
    setHasChanges(true);
  }, [calorieEditBaseline]);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  }, []);

  // Replace all items (e.g., after AI re-analysis), preserving previous for diff highlighting
  const replaceItems = useCallback((newItems: FoodItem[]) => {
    setItems((prev) => {
      setPreviousItems([...prev]);
      return newItems;
    });
    setHasChanges(true);
  }, []);

  // Discard all changes and revert to initial state
  const resetChanges = useCallback(() => {
    setItems(initialItems);
    setPreviousItems(null);
    setHasChanges(false);
    setCalorieEditBaseline(new Map());
  }, [initialItems]);

  // Mark changes as saved (keeps current items, clears change tracking)
  const markSaved = useCallback(() => {
    setPreviousItems(null);
    setHasChanges(false);
  }, []);

  return {
    items,
    previousItems,
    hasChanges,
    updateItem,
    removeItem,
    replaceItems,
    resetChanges,
    markSaved,
  };
}
