import { useState, useCallback, useEffect } from 'react';
import { FoodItem } from '@/types/food';

interface UseEditableFoodItemsOptions {
  initialItems: FoodItem[];
}

export function useEditableFoodItems({ initialItems }: UseEditableFoodItemsOptions) {
  const [items, setItems] = useState<FoodItem[]>(initialItems);
  const [previousItems, setPreviousItems] = useState<FoodItem[] | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync with initialItems when they change externally (e.g., after database save)
  useEffect(() => {
    setItems(initialItems);
    setPreviousItems(null);
    setHasChanges(false);
  }, [initialItems]);

  const updateItem = useCallback((
    index: number,
    field: keyof FoodItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        // If changing calories, scale macros proportionally
        if (field === 'calories' && typeof value === 'number') {
          const oldCalories = item.calories;
          const newCalories = value;

          // Avoid division by zero
          if (oldCalories === 0) {
            return { ...item, calories: newCalories };
          }

          const ratio = newCalories / oldCalories;
          return {
            ...item,
            calories: newCalories,
            protein: Math.round(item.protein * ratio * 10) / 10,
            carbs: Math.round(item.carbs * ratio * 10) / 10,
            fat: Math.round(item.fat * ratio * 10) / 10,
          };
        }

        // For other fields, just update the single value
        return { ...item, [field]: value };
      })
    );
    setHasChanges(true);
  }, []);

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
