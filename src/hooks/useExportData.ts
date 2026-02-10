import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FoodEntry, FoodItem } from '@/types/food';
import { exportFoodLog, exportWeightLog as exportWeightLogCSV, WeightSetExport } from '@/lib/csv-export';

export function useExportData() {
  const [isExporting, setIsExporting] = useState(false);

  const fetchAllEntries = async (): Promise<FoodEntry[]> => {
    const { data, error } = await supabase
      .from('food_entries')
      .select('*')
      .order('eaten_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Parse food_items JSONB (same logic as useFoodEntries)
    return (data || []).map((entry) => {
      const rawItems = Array.isArray(entry.food_items)
        ? (entry.food_items as unknown as any[])
        : [];
        const itemsWithIds: FoodItem[] = rawItems.map((item) => {
        const fiber = item.fiber || 0;
        const carbs = item.carbs || 0;
        return {
          description: item.description || (item.portion ? `${item.name} (${item.portion})` : (item.name || '')),
          calories: item.calories || 0,
          protein: item.protein || 0,
          carbs: carbs,
          fiber: fiber,
          net_carbs: item.net_carbs ?? Math.max(0, carbs - fiber),
          sugar: item.sugar || 0,
          fat: item.fat || 0,
          saturated_fat: item.saturated_fat || 0,
          sodium: item.sodium || 0,
          cholesterol: item.cholesterol || 0,
          uid: item.uid || crypto.randomUUID(),
          entryId: entry.id,
          editedFields: item.editedFields,
        };
      });
      return { ...entry, food_items: itemsWithIds } as FoodEntry;
    });
  };

  const fetchAllWeightSets = async (): Promise<WeightSetExport[]> => {
    const { data, error } = await supabase
      .from('weight_sets')
      .select('logged_date, created_at, description, sets, reps, weight_lbs, raw_input, exercise_metadata')
      .order('logged_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((row) => ({
      logged_date: row.logged_date,
      created_at: row.created_at,
      description: row.description,
      sets: row.sets,
      reps: row.reps,
      weight_lbs: Number(row.weight_lbs),
      raw_input: row.raw_input,
      exercise_metadata: row.exercise_metadata as Record<string, number> | null,
    }));
  };

  const handleExportFoodLog = async () => {
    setIsExporting(true);
    try {
      const entries = await fetchAllEntries();
      exportFoodLog(entries);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWeightLog = async () => {
    setIsExporting(true);
    try {
      const sets = await fetchAllWeightSets();
      exportWeightLogCSV(sets);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    exportFoodLog: handleExportFoodLog,
    exportWeightLog: handleExportWeightLog,
  };
}
