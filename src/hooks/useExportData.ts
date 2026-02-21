import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { FoodEntry, FoodItem } from '@/types/food';
import { exportFoodLog, exportWeightLog as exportWeightLogCSV, exportCustomLog, WeightSetExport, CustomLogExportRow } from '@/lib/csv-export';

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
      .select('logged_date, created_at, description, sets, reps, weight_lbs, raw_input, exercise_metadata, calories_burned_override, calories_burned_estimate, effort, heart_rate, incline_pct, cadence_rpm, speed_mph, duration_minutes, distance_miles, exercise_key, exercise_subtype')
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
      calories_burned_override: row.calories_burned_override != null ? Number(row.calories_burned_override) : null,
      calories_burned_estimate: row.calories_burned_estimate != null ? Number(row.calories_burned_estimate) : null,
      effort: row.effort != null ? Number(row.effort) : null,
      heart_rate: row.heart_rate != null ? Number(row.heart_rate) : null,
      incline_pct: row.incline_pct != null ? Number(row.incline_pct) : null,
      cadence_rpm: row.cadence_rpm != null ? Number(row.cadence_rpm) : null,
      speed_mph: row.speed_mph != null ? Number(row.speed_mph) : null,
      duration_minutes: row.duration_minutes != null ? Number(row.duration_minutes) : null,
      distance_miles: row.distance_miles != null ? Number(row.distance_miles) : null,
      exercise_key: row.exercise_key,
      exercise_subtype: row.exercise_subtype ?? null,
    }));
  };

  const handleExportFoodLog = async () => {
    setIsExporting(true);
    try {
      const entries = await fetchAllEntries();
      exportFoodLog(entries);
    } catch (error) {
      logger.error('Export failed:', error);
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
      logger.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const fetchAllCustomLogEntries = async (): Promise<CustomLogExportRow[]> => {
    const { data, error } = await supabase
      .from('custom_log_entries')
      .select('logged_date, created_at, dose_time, entry_notes, numeric_value, numeric_value_2, text_value, unit, custom_log_types(name, value_type)')
      .order('logged_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row) => ({
      logged_date: row.logged_date,
      created_at: row.created_at,
      log_type_name: (row.custom_log_types as unknown as { name: string; value_type: string } | null)?.name ?? '',
      value_type: (row.custom_log_types as unknown as { name: string; value_type: string } | null)?.value_type ?? '',
      numeric_value: row.numeric_value,
      numeric_value_2: row.numeric_value_2,
      text_value: row.text_value,
      unit: row.unit,
      dose_time: (row as any).dose_time ?? null,
      entry_notes: (row as any).entry_notes ?? null,
    }));
  };

  const handleExportCustomLog = async () => {
    setIsExporting(true);
    try {
      const rows = await fetchAllCustomLogEntries();
      exportCustomLog(rows);
    } catch (error) {
      logger.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    exportFoodLog: handleExportFoodLog,
    exportWeightLog: handleExportWeightLog,
    exportCustomLog: handleExportCustomLog,
  };
}
