import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FoodItem } from '@/types/food';

interface AnalyzeResult {
  food_items: FoodItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fiber: number;
  total_net_carbs: number;
  total_fat: number;
}

export function useAnalyzeFood() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeFood = async (
    rawInput: string,
    additionalContext?: string,
    promptVersion?: 'default' | 'experimental'
  ): Promise<AnalyzeResult | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'analyze-food',
        {
          body: { rawInput, additionalContext, promptVersion },
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Assign unique IDs to each food item for reliable change tracking
      const itemsWithIds = data.food_items.map((item: Omit<FoodItem, 'uid'>) => ({
        ...item,
        uid: crypto.randomUUID(),
      }));

      return { ...data, food_items: itemsWithIds } as AnalyzeResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze food';
      setError(message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzeFood, isAnalyzing, error };
}
