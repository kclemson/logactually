import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FoodEntry, FoodItem } from '@/types/food';

/**
 * Fetch recent food entries for history matching.
 * 
 * Data size analysis (90 days):
 * - Average food_items size per entry: ~474 bytes
 * - Average raw_input size: ~36 bytes
 * - Worst case (10 entries/day x 90 days): ~550 KB
 * 
 * This is well within acceptable limits for a cached query.
 * 
 * @param daysBack Number of days to look back (default: 90)
 */
export function useRecentFoodEntries(daysBack = 90) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['recent-food-entries', user?.id, daysBack],
    queryFn: async () => {
      const cutoffDate = format(subDays(new Date(), daysBack), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('food_entries')
        .select('id, eaten_date, raw_input, food_items, total_calories, total_protein, total_carbs, total_fat, source_meal_id, created_at')
        .gte('eaten_date', cutoffDate)
        .order('eaten_date', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Parse food_items and ensure UIDs exist for table rendering
      return (data || []).map((entry) => {
        const rawItems = Array.isArray(entry.food_items) 
          ? (entry.food_items as unknown as any[]) 
          : [];
        
        const itemsWithIds: FoodItem[] = rawItems.map((item) => {
          const fiber = item.fiber || 0;
          const carbs = item.carbs || 0;
          return {
            description: item.description || (item.portion ? `${item.name} (${item.portion})` : (item.name || '')),
            portion: item.portion,
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
          };
        });
        
        return {
          ...entry,
          food_items: itemsWithIds,
          // Ensure these fields exist with defaults
          updated_at: entry.created_at,
          user_id: user?.id || '',
          source_meal_id: (entry as any).source_meal_id || null,
        } as FoodEntry;
      });
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
