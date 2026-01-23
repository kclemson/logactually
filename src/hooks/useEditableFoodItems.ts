import { useState, useCallback } from 'react';
import { FoodItem, EditableField } from '@/types/food';

const EDITABLE_FIELDS: EditableField[] = ['description', 'calories', 'protein', 'carbs', 'fat'];

export function useEditableFoodItems() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [newItemUids, setNewItemUids] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  // Cache original item values when user starts editing calories (to avoid compounding errors)
  const [calorieEditBaseline, setCalorieEditBaseline] = useState<Map<number, FoodItem>>(new Map());

  // Set items from DB, clearing new highlights and change state
  const setItemsFromDB = useCallback((dbItems: FoodItem[]) => {
    setItems(dbItems);
    setNewItemUids(new Set());
    setHasChanges(false);
    setCalorieEditBaseline(new Map());
  }, []);

  // Add new items (from AI) and mark them for amber row highlighting
  const addNewItems = useCallback((newItems: FoodItem[]) => {
    const uids = new Set(newItems.map(item => item.uid));
    setItems(prev => [...prev, ...newItems]);
    setNewItemUids(uids);
    // Note: Don't set hasChanges here - the DB mutation already saved these
  }, []);

  // Clear the "new" highlighting (e.g., when adding more items or on next action)
  const clearNewHighlights = useCallback(() => {
    setNewItemUids(new Set());
  }, []);

  const updateItem = useCallback((
    index: number,
    field: keyof FoodItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        // Track that this field was edited
        let newEditedFields: EditableField[] = [...(item.editedFields || [])];
        if (EDITABLE_FIELDS.includes(field as EditableField) && !newEditedFields.includes(field as EditableField)) {
          newEditedFields.push(field as EditableField);
        }

        // If changing calories, scale macros proportionally from cached baseline
        if (field === 'calories' && typeof value === 'number') {
          // Mark macros as edited since they auto-scale
          (['protein', 'carbs', 'fat'] as EditableField[]).forEach(f => {
            if (!newEditedFields.includes(f)) newEditedFields.push(f);
          });

          // Get or create baseline for this item
          let baseline = calorieEditBaseline.get(index);
          if (!baseline) {
            baseline = { ...item };
            setCalorieEditBaseline(prevBaseline => new Map(prevBaseline).set(index, baseline!));
          }

          // Handle zero baseline (edge case - can't scale from 0)
          if (baseline.calories === 0) {
            return { ...item, calories: value, editedFields: newEditedFields };
          }

          // Scale from baseline, not current values
          const ratio = value / baseline.calories;
          return {
            ...item,
            calories: value,
            protein: Math.round(baseline.protein * ratio),
            carbs: Math.round(baseline.carbs * ratio),
            fat: Math.round(baseline.fat * ratio),
            editedFields: newEditedFields,
          };
        }

        // For other fields, clear baseline so future calorie edits use new values as reference
        setCalorieEditBaseline(prevBaseline => {
          const next = new Map(prevBaseline);
          next.delete(index);
          return next;
        });
        return { ...item, [field]: value, editedFields: newEditedFields };
      })
    );
    setHasChanges(true);
  }, [calorieEditBaseline]);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  }, []);

  // Replace all items (e.g., after AI re-analysis)
  const replaceItems = useCallback((newItems: FoodItem[]) => {
    setItems(newItems);
    setHasChanges(true);
  }, []);

  // Mark changes as saved (clears change tracking but keeps new highlights)
  const markSaved = useCallback(() => {
    setHasChanges(false);
    setCalorieEditBaseline(new Map());
  }, []);

  return {
    items,
    newItemUids,
    hasChanges,
    updateItem,
    removeItem,
    replaceItems,
    setItemsFromDB,
    addNewItems,
    clearNewHighlights,
    markSaved,
  };
}
