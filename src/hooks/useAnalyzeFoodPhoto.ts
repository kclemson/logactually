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

export function useAnalyzeFoodPhoto() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzePhoto = async (imageBase64: string): Promise<AnalyzeResult | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'analyze-food-photo',
        { body: { imageBase64 } }
      );

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.food_items || data.food_items.length === 0) {
        setError("No food items detected in the photo. Try a clearer image.");
        return null;
      }

      // Assign unique IDs to each food item
      const itemsWithIds = data.food_items.map((item: Omit<FoodItem, 'uid'>) => ({
        ...item,
        uid: crypto.randomUUID(),
      }));

      return { ...data, food_items: itemsWithIds } as AnalyzeResult;
    } catch (err) {
      let message = err instanceof Error ? err.message : 'Failed to analyze photo';

      if (message.includes('failed to send a request to the edge function')) {
        message = "Couldn't connect - please try again";
      }

      setError(message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzePhoto, isAnalyzing, error };
}
