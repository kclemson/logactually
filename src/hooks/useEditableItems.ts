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
 * - newItems stores items added locally (not yet in query)
 * 
 * displayItems = queryItems (filtered/edited) + newItems
 */
export function useEditableItems<T extends BaseEditableItem>(
  queryItems: T[],
  editableFields: (keyof T)[]
) {
  // Pending edits: Map<uid, partial updates>
  const [pendingEdits, setPendingEdits] = useState<Map<string, Partial<T>>>(new Map());
  
  // Pending removals: Set of uids to hide from display
  const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(new Set());
  
  // New items added locally (not yet saved to DB)
  const [newItems, setNewItems] = useState<T[]>([]);
  
  // Track new item uids for highlight (individual items fallback)
  const [newItemUids, setNewItemUids] = useState<Set<string>>(new Set());
  
  // Track new entry IDs for grouped highlight (all items from same entry)
  const [newEntryIds, setNewEntryIds] = useState<Set<string>>(new Set());

  // Derive display items from query + pending state
  const displayItems = useMemo(() => {
    // Start with query items
    const fromQuery = queryItems
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
    
    // Filter newItems to exclude any that now exist in queryItems (they've "graduated")
    const queryUids = new Set(queryItems.map(item => item.uid));
    const stillNewItems = newItems.filter(item => !queryUids.has(item.uid));
    
    // If some items graduated, clean up newItemUids too
    if (stillNewItems.length !== newItems.length) {
      const graduatedUids = newItems
        .filter(item => queryUids.has(item.uid))
        .map(item => item.uid);
      
      if (graduatedUids.length > 0) {
        // Schedule cleanup of graduated items (can't setState during render)
        setTimeout(() => {
          setNewItems(stillNewItems);
          setNewItemUids(prev => {
            const next = new Set(prev);
            graduatedUids.forEach(uid => next.delete(uid));
            return next;
          });
        }, 2500); // Match animation duration before clearing highlights
      }
    }
    
    return [...fromQuery, ...stillNewItems];
  }, [queryItems, pendingEdits, pendingRemovals, newItems, editableFields]);

  // Add new items and mark them for highlighting
  const addNewItems = useCallback((items: T[]) => {
    const uids = new Set(items.map(item => item.uid));
    // Extract unique entry IDs for grouped highlighting
    const entryIds = new Set(
      items.map(item => item.entryId).filter((id): id is string => !!id)
    );
    
    setNewItems(prev => [...prev, ...items]);
    setNewItemUids(uids);
    setNewEntryIds(entryIds);
    
    // Clear entry highlights after animation duration (2.5s)
    if (entryIds.size > 0) {
      setTimeout(() => {
        setNewEntryIds(new Set());
      }, 2500);
    }
  }, []);

  // Clear the "new" highlighting
  const clearNewHighlights = useCallback(() => {
    setNewItemUids(new Set());
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
    
    // Check if it's a new item (not yet in DB)
    const isNewItem = newItems.some(ni => ni.uid === item.uid);
    
    if (isNewItem) {
      // Just remove from newItems
      setNewItems(prev => prev.filter(ni => ni.uid !== item.uid));
      setNewItemUids(prev => {
        const next = new Set(prev);
        next.delete(item.uid);
        return next;
      });
    } else {
      // Mark for removal from query items
      setPendingRemovals(prev => {
        const next = new Set(prev);
        next.add(item.uid);
        return next;
      });
    }
  }, [displayItems, newItems]);

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
    newItemUids,
    newEntryIds,
    updateItem,
    updateItemBatch,
    removeItem,
    addNewItems,
    clearNewHighlights,
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
