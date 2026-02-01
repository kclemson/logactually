import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AnalyzedExercise } from '@/types/weight';

interface AnalyzeWeightsResult {
  exercises: AnalyzedExercise[];
}

export function useAnalyzeWeights() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const analyzeWeights = useCallback(async (rawInput: string): Promise<AnalyzeWeightsResult | null> => {
    setIsAnalyzing(true);
    setError(null);
    setWarning(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const { data, error: fnError } = await supabase.functions.invoke('analyze-weights', {
        body: { rawInput },
      });

      if (fnError) {
        throw fnError;
      }

      if (!data?.exercises || !Array.isArray(data.exercises)) {
        throw new Error('Invalid response from analyze-weights');
      }

      // Check for empty results (e.g., user entered food on weights page)
      if (data.exercises.length === 0) {
        setWarning("No exercises detected. If this is food, try the Food page.");
        return null;
      }

      return { exercises: data.exercises };
    } catch (err) {
      let message = err instanceof Error ? err.message : 'Failed to analyze workout';
      
      if (message.includes('failed to send a request to the edge function')) {
        message = "Couldn't connect - please try again";
      }
      
      setError(message);
      console.error('Analyze weights error:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return { analyzeWeights, isAnalyzing, error, warning };
}
