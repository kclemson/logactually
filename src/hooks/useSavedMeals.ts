import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FoodItem, SavedMeal } from '@/types/food';
import { preprocessText, createItemsSignature } from '@/lib/text-similarity';
import { useAuth } from '@/hooks/useAuth';
import type { Json } from '@/integrations/supabase/types';

/**
 * Fetch all saved meals for the current user, sorted by usage.
 */
export function useSavedMeals() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['saved-meals', user?.id],
    queryFn: async (): Promise<SavedMeal[]> => {
      const { data, error } = await supabase
        .from('saved_meals')
        .select('*')
        .order('use_count', { ascending: false })
        .order('last_used_at', { ascending: false, nullsFirst: false });
      
      if (error) throw error;
      
      // Transform JSONB food_items to typed array
      return (data ?? []).map(row => ({
        ...row,
        food_items: (row.food_items as unknown as FoodItem[]) ?? [],
      }));
    },
    enabled: !!user,
  });
}

interface SaveMealParams {
  name: string;
  originalInput: string | null;
  foodItems: FoodItem[];
}

/**
 * Create a new saved meal with auto-generated signatures.
 */
export function useSaveMeal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ name, originalInput, foodItems }: SaveMealParams) => {
      if (!user) throw new Error('Not authenticated');
      
      // Strip uid and entryId from items to prevent stale metadata pollution
      const cleanedItems = foodItems.map(({ uid, entryId, ...rest }) => rest);
      
      // Generate signatures (use original items for signature since it only needs description)
      const inputSignature = originalInput ? preprocessText(originalInput) : null;
      const itemsSignature = createItemsSignature(foodItems);
      
      const { data, error } = await supabase
        .from('saved_meals')
        .insert([{
          user_id: user.id,
          name,
          original_input: originalInput,
          food_items: cleanedItems as unknown as Json,
          input_signature: inputSignature,
          items_signature: itemsSignature,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-meals'] });
    },
  });
}

interface UpdateSavedMealParams {
  id: string;
  name?: string;
  foodItems?: FoodItem[];
}

/**
 * Update an existing saved meal (name or food items).
 */
export function useUpdateSavedMeal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, name, foodItems }: UpdateSavedMealParams) => {
      const updates: Record<string, unknown> = {};
      
      if (name !== undefined) {
        updates.name = name;
      }
      
      if (foodItems !== undefined) {
        // Strip runtime metadata (uid, entryId, editedFields) before saving
        const cleanedItems = foodItems.map(({ uid, entryId, editedFields, ...rest }) => rest);
        updates.food_items = cleanedItems as unknown as Json;
        updates.items_signature = createItemsSignature(foodItems);
      }
      
      const { data, error } = await supabase
        .from('saved_meals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedMeal, variables) => {
      // Update cache in place instead of refetching to preserve list order
      queryClient.setQueryData(
        ['saved-meals', user?.id],
        (oldData: SavedMeal[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(meal => 
            meal.id === variables.id 
              ? { 
                  ...meal, 
                  ...updatedMeal,
                  food_items: (updatedMeal.food_items as unknown as FoodItem[]) ?? meal.food_items,
                }
              : meal
          );
        }
      );
    },
  });
}

/**
 * Delete a saved meal.
 */
export function useDeleteSavedMeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_meals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-meals'] });
    },
  });
}

/**
 * Log a saved meal: increment use_count, update last_used_at, return food items.
 */
export function useLogSavedMeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<FoodItem[]> => {
      // First, get the meal to return its food items
      const { data: meal, error: fetchError } = await supabase
        .from('saved_meals')
        .select('food_items, use_count')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update use_count and last_used_at
      const { error: updateError } = await supabase
        .from('saved_meals')
        .update({
          use_count: (meal.use_count ?? 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      // Strip editedFields so logged entries start fresh (no asterisk)
      const items = (meal.food_items as unknown as FoodItem[]) ?? [];
      return items.map(({ editedFields, ...rest }) => rest as FoodItem);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-meals'] });
    },
  });
}
