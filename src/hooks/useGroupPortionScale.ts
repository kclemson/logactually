import { useState, useMemo, useCallback } from 'react';
import { useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { FoodEntry, FoodItem, calculateTotals } from '@/types/food';
import { scaleItemByMultiplier } from '@/lib/portion-scaling';

interface UseGroupPortionScaleOptions {
  entries: FoodEntry[];
  updateEntry: UseMutationResult<any, Error, Partial<FoodEntry> & { id: string }>;
  getItemsForEntry: (entryId: string) => FoodItem[];
}

/**
 * Hook that encapsulates group portion scaling with atomic saves.
 * 
 * Fixes two bugs from the previous approach:
 * 1. Missing portion text: scales ALL items in one pass and saves once
 * 2. Flicker: single mutation instead of N+1, with optimistic state
 */
export function useGroupPortionScale({
  entries,
  updateEntry,
  getItemsForEntry,
}: UseGroupPortionScaleOptions) {
  const queryClient = useQueryClient();

  // Optimistic multipliers for instant UI update on group portion scaling
  const [optimisticMultipliers, setOptimisticMultipliers] = useState<Map<string, number>>(new Map());

  // Optimistic group names for instant UI update on inline editing
  const [optimisticGroupNames, setOptimisticGroupNames] = useState<Map<string, string>>(new Map());

  // Build map of entryId -> group name for multi-item entries (for collapsed display)
  const entryGroupNames = useMemo(() => {
    const map = new Map<string, string>();
    entries.forEach(entry => {
      if (entry.group_name && entry.food_items.length >= 2) {
        map.set(entry.id, entry.group_name);
      }
    });
    optimisticGroupNames.forEach((val, key) => map.set(key, val));
    return map;
  }, [entries, optimisticGroupNames]);

  // Build map of entryId -> cumulative portion multiplier
  const entryPortionMultipliers = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach(entry => {
      if (entry.group_portion_multiplier != null && entry.group_portion_multiplier !== 1.0) {
        map.set(entry.id, entry.group_portion_multiplier);
      }
    });
    optimisticMultipliers.forEach((val, key) => {
      if (val === 1.0) {
        map.delete(key);
      } else {
        map.set(key, val);
      }
    });
    return map;
  }, [entries, optimisticMultipliers]);

  /**
   * Atomic group portion scale: scales all items and saves in ONE mutation.
   */
  const scaleGroupPortion = useCallback((entryId: string, multiplier: number) => {
    if (multiplier === 1.0) return;

    const currentItems = getItemsForEntry(entryId);
    
    // Scale every item in one pass (includes portion text)
    const scaledItems = currentItems.map(item => ({
      ...item,
      ...scaleItemByMultiplier(item, multiplier),
    }));

    // Compute new cumulative multiplier
    const entry = entries.find(e => e.id === entryId);
    const existingMultiplier = entry?.group_portion_multiplier ?? 1.0;
    const newMultiplier = existingMultiplier * multiplier;

    // Set optimistic state for instant UI
    setOptimisticMultipliers(prev => {
      const next = new Map(prev);
      next.set(entryId, newMultiplier);
      return next;
    });

    // Recalculate totals from scaled items
    const totals = calculateTotals(scaledItems);

    // Single atomic mutation
    updateEntry.mutate(
      {
        id: entryId,
        food_items: scaledItems,
        group_portion_multiplier: newMultiplier,
        total_calories: Math.round(totals.calories),
        total_protein: Math.round(totals.protein * 10) / 10,
        total_carbs: Math.round(totals.carbs * 10) / 10,
        total_fat: Math.round(totals.fat * 10) / 10,
      } as any,
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: ['food-entries'] });
          setOptimisticMultipliers(prev => {
            const next = new Map(prev);
            next.delete(entryId);
            return next;
          });
        },
      }
    );
  }, [entries, getItemsForEntry, updateEntry, queryClient]);

  /**
   * Update group name with optimistic UI.
   */
  const updateGroupName = useCallback((entryId: string, newName: string) => {
    setOptimisticGroupNames(prev => {
      const next = new Map(prev);
      next.set(entryId, newName);
      return next;
    });
    updateEntry.mutate(
      { id: entryId, group_name: newName } as any,
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: ['food-entries'] });
          setOptimisticGroupNames(prev => {
            const next = new Map(prev);
            next.delete(entryId);
            return next;
          });
        },
      }
    );
  }, [updateEntry, queryClient]);

  return {
    entryGroupNames,
    entryPortionMultipliers,
    scaleGroupPortion,
    updateGroupName,
  };
}
