import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

import type { WeightUnit } from '@/lib/weight-units';

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  weightUnit: WeightUnit;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  weightUnit: 'lbs',
};

export function useUserSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch settings from database
  useEffect(() => {
    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      setIsLoading(false);
      return;
    }

    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch settings:', error);
      } else if (data?.settings) {
        // Merge with defaults to ensure all keys exist
        setSettings({ ...DEFAULT_SETTINGS, ...(data.settings as Partial<UserSettings>) });
      }
      setIsLoading(false);
    };

    fetchSettings();
  }, [user]);

  // Update settings in database
  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      if (!user) return;

      // Store previous settings for potential rollback
      let previousSettings: UserSettings;
      
      // Use functional update to ensure we get latest state (avoids stale closures)
      setSettings(current => {
        previousSettings = current;
        return { ...current, ...updates };
      });

      const { error } = await supabase
        .from('profiles')
        .update({ settings: { ...previousSettings!, ...updates } })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to save settings:', error);
        // Revert on error using the captured previous state
        setSettings(previousSettings!);
      }
    },
    [user]  // Remove `settings` from dependencies to prevent stale closures
  );

  return { settings, updateSettings, isLoading };
}
