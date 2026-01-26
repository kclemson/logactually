import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseSuggestMealNameResult {
  suggestName: (descriptions: string[]) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

export function useSuggestMealName(): UseSuggestMealNameResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestName = useCallback(async (descriptions: string[]): Promise<string | null> => {
    if (descriptions.length === 0) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
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
      const message = err instanceof Error ? err.message : 'Failed to suggest meal name';
      console.error('Error suggesting meal name:', message);
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { suggestName, isLoading, error };
}
