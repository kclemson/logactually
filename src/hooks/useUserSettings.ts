import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { WeightUnit } from '@/lib/weight-units';

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  weightUnit: WeightUnit;
  showWeights: boolean;
  showCustomLogs: boolean;
  suggestMealSaves: boolean;
  suggestRoutineSaves: boolean;
  dailyCalorieTarget: number | null;
  // TDEE-based body stats mode
  calorieTargetEnabled: boolean;
  calorieTargetMode: 'static' | 'body_stats' | 'exercise_adjusted';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'logged' | null;
  dailyDeficit: number | null;
  
  // Calorie burn estimation
  calorieBurnEnabled: boolean;
  bodyWeightLbs: number | null;
  heightInches: number | null;
  heightUnit: 'ft' | 'cm';
  age: number | null;
  bodyComposition: 'female' | 'male' | null;
  defaultIntensity: number | null;
  weekStartDay: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  weightUnit: 'lbs',
  showWeights: true,
  showCustomLogs: false,
  suggestMealSaves: true,
  suggestRoutineSaves: true,
  dailyCalorieTarget: null,
  calorieTargetEnabled: true,
  calorieTargetMode: 'static',
  activityLevel: null,
  dailyDeficit: null,
  
  calorieBurnEnabled: true,
  bodyWeightLbs: null,
  heightInches: null,
  heightUnit: 'ft',
  age: null,
  bodyComposition: null,
  defaultIntensity: null,
  weekStartDay: 0,
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
        logger.error('Failed to fetch settings:', error);
        return DEFAULT_SETTINGS;
      }
      
      const merged = { ...DEFAULT_SETTINGS, ...(data?.settings as Partial<UserSettings>) };
      // Migrate legacy 'deficit' key to 'body_stats'
      if ((merged.calorieTargetMode as string) === 'deficit') {
        merged.calorieTargetMode = 'body_stats';
      }
      return merged;
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
      logger.error('Failed to save settings:', err);
    },
  });

  return { settings, updateSettings, isLoading };
}
