import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseSuggestRoutineNameResult {
  suggestName: (descriptions: string[]) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Suggest a name for a workout routine based on exercise descriptions.
 * Reuses the suggest-meal-name edge function with the same API.
 */
export function useSuggestRoutineName(): UseSuggestRoutineNameResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestName = useCallback(async (descriptions: string[]): Promise<string | null> => {
    if (descriptions.length === 0) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Reuse the suggest-meal-name function - works for any item descriptions
      const { data, error: invokeError } = await supabase.functions.invoke(
        'suggest-meal-name',
        {
          body: { descriptions },
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data.name || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to suggest routine name';
      console.error('Error suggesting routine name:', message);
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { suggestName, isLoading, error };
}
