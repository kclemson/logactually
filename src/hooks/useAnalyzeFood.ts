import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FoodItem } from '@/types/food';

interface AnalyzeResult {
  food_items: FoodItem[];
  summary?: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fiber: number;
  total_net_carbs: number;
  total_sugar: number;
  total_fat: number;
  total_saturated_fat: number;
  total_sodium: number;
  total_cholesterol: number;
}

export function useAnalyzeFood() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const analyzeFood = async (
    rawInput: string,
    additionalContext?: string,
    promptVersion?: 'default' | 'experimental'
  ): Promise<AnalyzeResult | null> => {
    setIsAnalyzing(true);
    setError(null);
    setWarning(null);

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

      // Check for empty results (e.g., user entered exercise on food page)
      if (!data.food_items || data.food_items.length === 0) {
        setWarning("No food items detected. If this is exercise, try the Weights page.");
        return null;
      }

      // Assign unique IDs to each food item for reliable change tracking
      const itemsWithIds = data.food_items.map((item: any) => ({
        description: item.description || '',
        portion: item.portion,
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        carbs: Number(item.carbs) || 0,
        fiber: Number(item.fiber) || 0,
        net_carbs: Number(item.net_carbs) || 0,
        sugar: Number(item.sugar) || 0,
        fat: Number(item.fat) || 0,
        saturated_fat: Number(item.saturated_fat) || 0,
        sodium: Number(item.sodium) || 0,
        cholesterol: Number(item.cholesterol) || 0,
        confidence: item.confidence,
        source_note: item.source_note,
        uid: crypto.randomUUID(),
      }));

      return { ...data, food_items: itemsWithIds } as AnalyzeResult;
    } catch (err) {
      let message = err instanceof Error ? err.message : 'Failed to analyze food';
      
      if (message.includes('failed to send a request to the edge function')) {
        message = "Couldn't connect - please try again";
      }
      
      setError(message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzeFood, isAnalyzing, error, warning };
}
