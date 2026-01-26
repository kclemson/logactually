import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FoodEntry, FoodItem } from '@/types/food';
import { exportDailyTotals, exportFoodLog } from '@/lib/csv-export';

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
      const itemsWithIds: FoodItem[] = rawItems.map((item) => ({
        description: item.description || (item.portion ? `${item.name} (${item.portion})` : (item.name || '')),
        calories: item.calories || 0,
        protein: item.protein || 0,
        carbs: item.carbs || 0,
        fat: item.fat || 0,
        uid: item.uid || crypto.randomUUID(),
        entryId: entry.id,
        editedFields: item.editedFields,
      }));
      return { ...entry, food_items: itemsWithIds } as FoodEntry;
    });
  };

  const handleExportDailyTotals = async () => {
    setIsExporting(true);
    try {
      const entries = await fetchAllEntries();
      exportDailyTotals(entries);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
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

  return {
    isExporting,
    exportDailyTotals: handleExportDailyTotals,
    exportFoodLog: handleExportFoodLog,
  };
}
