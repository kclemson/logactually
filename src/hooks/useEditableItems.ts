import { useState, useMemo, useCallback } from 'react';
import { FoodItem, EditableField } from '@/types/food';

/**
 * Base interface for any editable item.
 * Items must have a unique `uid` and optionally an `entryId` for grouping.
 */
interface BaseEditableItem {
  uid: string;
  entryId?: string;
}

/**
 * Hook that derives display items from query data + local pending edits.
 * 
 * Architecture:
 * - queryItems (from React Query) is the source of truth for saved data
 * - pendingEdits stores unsaved field changes (keyed by uid)
 * - pendingRemovals stores uids of items marked for local deletion
 * - newEntryIds tracks entry IDs that should show highlight animation
 * 
 * displayItems = queryItems (filtered/edited)
 */
export function useEditableItems<T extends BaseEditableItem>(
  queryItems: T[],
  editableFields: (keyof T)[]
) {
  // Pending edits: Map<uid, partial updates>
  const [pendingEdits, setPendingEdits] = useState<Map<string, Partial<T>>>(new Map());
  
  // Pending removals: Set of uids to hide from display
  const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(new Set());
  
  // Track new entry IDs for grouped highlight (all items from same entry)
  const [newEntryIds, setNewEntryIds] = useState<Set<string>>(new Set());

  // Derive display items from query + pending state
  const displayItems = useMemo(() => {
    return queryItems
      // Filter out items pending removal
      .filter(item => !pendingRemovals.has(item.uid))
      // Apply any pending edits
      .map(item => {
        const edits = pendingEdits.get(item.uid);
        if (!edits) return item;
        
        // Merge edits and track edited fields
        type WithEditedFields = T & { editedFields?: (keyof T)[] };
        const existingEdited = (item as WithEditedFields).editedFields || [];
        const editedFields: (keyof T)[] = [...existingEdited];
        for (const field of Object.keys(edits) as (keyof T)[]) {
          if (editableFields.includes(field) && !editedFields.includes(field)) {
            editedFields.push(field);
          }
        }
        
        return { ...item, ...edits, editedFields } as T;
      });
  }, [queryItems, pendingEdits, pendingRemovals, editableFields]);

  // Mark an entry as new (triggers grouped highlight animation)
  const markEntryAsNew = useCallback((entryId: string) => {
    setNewEntryIds(prev => new Set([...prev, entryId]));
    
    // Clear highlight after animation duration (2.5s)
    setTimeout(() => {
      setNewEntryIds(prev => {
        const next = new Set(prev);
        next.delete(entryId);
        return next;
      });
    }, 2500);
  }, []);

  // Update a single field on an item
  const updateItem = useCallback((
    index: number,
    field: keyof T,
    value: string | number
  ) => {
    // Find the item at this index in displayItems
    const item = displayItems[index];
    if (!item) return;
    
    setPendingEdits(prev => {
      const next = new Map(prev);
      const existing = next.get(item.uid) || {};
      next.set(item.uid, { ...existing, [field]: value } as Partial<T>);
      return next;
    });
  }, [displayItems]);

  // Batch update multiple fields at once (atomic operation)
  const updateItemBatch = useCallback((
    index: number,
    updates: Partial<T>
  ) => {
    const item = displayItems[index];
    if (!item) return;
    
    setPendingEdits(prev => {
      const next = new Map(prev);
      const existing = next.get(item.uid) || {};
      next.set(item.uid, { ...existing, ...updates });
      return next;
    });
  }, [displayItems]);

  // Mark an item for removal (optimistic delete)
  const removeItem = useCallback((index: number) => {
    const item = displayItems[index];
    if (!item) return;
    
    setPendingRemovals(prev => {
      const next = new Set(prev);
      next.add(item.uid);
      return next;
    });
  }, [displayItems]);

  // Clear pending state for an item (call after successful save)
  const clearPendingForItem = useCallback((uid: string) => {
    setPendingEdits(prev => {
      const next = new Map(prev);
      next.delete(uid);
      return next;
    });
    setPendingRemovals(prev => {
      const next = new Set(prev);
      next.delete(uid);
      return next;
    });
  }, []);

  // Clear all pending state (e.g., after query invalidation)
  const clearAllPending = useCallback(() => {
    setPendingEdits(new Map());
    setPendingRemovals(new Set());
  }, []);

  return {
    displayItems,
    newEntryIds,
    markEntryAsNew,
    updateItem,
    updateItemBatch,
    removeItem,
    clearPendingForItem,
    clearAllPending,
  };
}

// ----- Backwards compatibility for FoodItem -----

const FOOD_EDITABLE_FIELDS: EditableField[] = ['description', 'calories', 'protein', 'carbs', 'fat'];

/**
 * Backwards-compatible hook specifically for FoodItems.
 * Wraps the generic useEditableItems with food-specific field configuration.
 */
export function useEditableFoodItems(queryItems: FoodItem[]) {
  return useEditableItems<FoodItem>(queryItems, FOOD_EDITABLE_FIELDS);
}
