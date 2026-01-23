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
        .order('created_at', { ascending: false });

      if (date) {
        query = query.eq('eaten_date', date);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Parse the food_items JSONB field
      return (data || []).map((entry) => ({
        ...entry,
        food_items: Array.isArray(entry.food_items) ? (entry.food_items as unknown as FoodItem[]) : [],
      })) as FoodEntry[];
    },
  });

  const createEntry = useMutation({
    mutationFn: async (entry: {
      eaten_date: string;
      raw_input: string;
      food_items: FoodItem[];
      total_calories: number;
      total_protein: number;
      total_carbs: number;
      total_fat: number;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('food_entries')
        .insert({
          user_id: userData.user.id,
          eaten_date: entry.eaten_date,
          raw_input: entry.raw_input,
          food_items: entry.food_items as unknown as Json,
          total_calories: entry.total_calories,
          total_protein: entry.total_protein,
          total_carbs: entry.total_carbs,
          total_fat: entry.total_fat,
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
    error: query.error,
    createEntry,
    updateEntry,
    deleteEntry,
    deleteAllByDate,
  };
}
