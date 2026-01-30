import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FoodEntry, FoodItem } from '@/types/food';
import { Json } from '@/integrations/supabase/types';

export function useFoodEntries(date?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['food-entries', date],
    queryFn: async () => {
      let query = supabase
        .from('food_entries')
        .select('*')
        .order('created_at', { ascending: true })
        .order('id', { ascending: true });

      if (date) {
        query = query.eq('eaten_date', date);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Parse the food_items JSONB field, migrate legacy data, and ensure UIDs exist
      return (data || []).map((entry) => {
        const rawItems = Array.isArray(entry.food_items) ? (entry.food_items as unknown as any[]) : [];
        // Migrate legacy name+portion to description, assign UIDs
        const itemsWithIds: FoodItem[] = rawItems.map((item) => {
          const fiber = item.fiber || 0;
          const carbs = item.carbs || 0;
          return {
            // Migrate legacy format: if 'description' exists use it, else merge name+portion
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
            editedFields: item.editedFields,
          };
        });
        return {
          ...entry,
          food_items: itemsWithIds,
        };
      }) as FoodEntry[];
    },
  });

  const createEntry = useMutation({
    mutationFn: async (entry: {
      id?: string; // Optional client-generated ID for optimistic highlighting
      eaten_date: string;
      raw_input: string | null;
      food_items: FoodItem[];
      total_calories: number;
      total_protein: number;
      total_carbs: number;
      total_fat: number;
      source_meal_id?: string | null;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('food_entries')
        .insert({
          ...(entry.id && { id: entry.id }), // Use client-provided ID if present
          user_id: userData.user.id,
          eaten_date: entry.eaten_date,
          raw_input: entry.raw_input,
          food_items: entry.food_items as unknown as Json,
          total_calories: entry.total_calories,
          total_protein: entry.total_protein,
          total_carbs: entry.total_carbs,
          total_fat: entry.total_fat,
          source_meal_id: entry.source_meal_id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-entries'] });
    },
    onError: (error) => {
      console.error('Failed to save entry:', error.message);
    },
  });

  const updateEntry = useMutation({
    mutationFn: async ({
      id,
      food_items,
      ...updates
    }: Partial<FoodEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from('food_entries')
        .update({
          ...updates,
          ...(food_items && { food_items: food_items as unknown as Json }),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-entries'] });
    },
    onError: (error) => {
      console.error('Failed to update entry:', error.message);
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-entries'] });
    },
    onError: (error) => {
      console.error('Failed to delete entry:', error.message);
    },
  });

  const deleteAllByDate = useMutation({
    mutationFn: async (targetDate: string) => {
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('eaten_date', targetDate);

      if (error) throw error;
    },
    onMutate: async (targetDate) => {
      await queryClient.cancelQueries({ queryKey: ['food-entries', targetDate] });
      const previousEntries = queryClient.getQueryData(['food-entries', targetDate]);
      queryClient.setQueryData(['food-entries', targetDate], []);
      return { previousEntries, targetDate };
    },
    onError: (err, targetDate, context) => {
      if (context?.previousEntries) {
        queryClient.setQueryData(['food-entries', context.targetDate], context.previousEntries);
      }
      console.error('Failed to delete all entries:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['food-entries'] });
    },
  });

  return {
    entries: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    createEntry,
    updateEntry,
    deleteEntry,
    deleteAllByDate,
  };
}
