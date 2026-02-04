import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { WeightUnit } from '@/lib/weight-units';

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  weightUnit: WeightUnit;
  showWeights: boolean;
  suggestMealSaves: boolean;
  suggestRoutineSaves: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  weightUnit: 'lbs',
  showWeights: true,
  suggestMealSaves: true,
  suggestRoutineSaves: true,
};

export function useUserSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings = DEFAULT_SETTINGS, isLoading } = useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      if (!user) return DEFAULT_SETTINGS;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch settings:', error);
        return DEFAULT_SETTINGS;
      }
      
      return { ...DEFAULT_SETTINGS, ...(data?.settings as Partial<UserSettings>) };
    },
    enabled: !!user,
    staleTime: Infinity,
  });

  const { mutate: updateSettings } = useMutation({
    mutationFn: async (updates: Partial<UserSettings>) => {
      if (!user) throw new Error('No user');
      
      const newSettings = { ...settings, ...updates };
      
      const { error } = await supabase
        .from('profiles')
        .update({ settings: newSettings })
        .eq('id', user.id);

      if (error) throw error;
      return newSettings;
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['user-settings', user?.id] });
      const previous = queryClient.getQueryData<UserSettings>(['user-settings', user?.id]);
      
      queryClient.setQueryData(['user-settings', user?.id], (old: UserSettings = DEFAULT_SETTINGS) => ({
        ...old,
        ...updates,
      }));
      
      return { previous };
    },
    onError: (err, updates, context) => {
      queryClient.setQueryData(['user-settings', user?.id], context?.previous);
      console.error('Failed to save settings:', err);
    },
  });

  return { settings, updateSettings, isLoading };
}
