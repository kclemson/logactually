import { useState, useCallback } from 'react';
import { FoodItem, EditableField } from '@/types/food';

const EDITABLE_FIELDS: EditableField[] = ['description', 'calories', 'protein', 'carbs', 'fat'];

export function useEditableFoodItems() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [newItemUids, setNewItemUids] = useState<Set<string>>(new Set());

  // Set items from DB, clearing new highlights
  const setItemsFromDB = useCallback((dbItems: FoodItem[]) => {
    setItems(dbItems);
    setNewItemUids(new Set());
  }, []);

  // Add new items (from AI) and mark them for amber row highlighting
  const addNewItems = useCallback((newItems: FoodItem[]) => {
    const uids = new Set(newItems.map(item => item.uid));
    setItems(prev => [...prev, ...newItems]);
    setNewItemUids(uids);
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

        // If changing calories, scale macros proportionally
        if (field === 'calories' && typeof value === 'number') {
          // Mark macros as edited since they auto-scale
          (['protein', 'carbs', 'fat'] as EditableField[]).forEach(f => {
            if (!newEditedFields.includes(f)) newEditedFields.push(f);
          });

          // Handle zero calories (edge case - can't scale from 0)
          if (item.calories === 0) {
            return { ...item, calories: value, editedFields: newEditedFields };
          }

          // Scale from current values
          const ratio = value / item.calories;
          return {
            ...item,
            calories: value,
            protein: Math.round(item.protein * ratio),
            carbs: Math.round(item.carbs * ratio),
            fat: Math.round(item.fat * ratio),
            editedFields: newEditedFields,
          };
        }

        return { ...item, [field]: value, editedFields: newEditedFields };
      })
    );
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Replace all items (e.g., after AI re-analysis)
  const replaceItems = useCallback((newItems: FoodItem[]) => {
    setItems(newItems);
  }, []);

  return {
    items,
    newItemUids,
    updateItem,
    removeItem,
    replaceItems,
    setItemsFromDB,
    addNewItems,
    clearNewHighlights,
  };
}
