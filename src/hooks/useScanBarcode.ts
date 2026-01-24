import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FoodItem } from '@/types/food';

interface LookupResult {
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: 'openfoodfacts' | 'ai';
}

type LookupResponse = 
  | { success: true; data: LookupResult }
  | { success: false; notFound: true; upc: string }
  | { success: false; notFound?: false; error: string };

export function useScanBarcode() {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupUpc = async (upc: string): Promise<LookupResponse> => {
    setIsScanning(true);
    setError(null);

    try {
      console.log('Looking up UPC:', upc);
      
      const { data, error: invokeError } = await supabase.functions.invoke(
        'lookup-upc',
        { body: { upc } }
      );

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.notFound) {
        return { success: false, notFound: true, upc };
      }

      return {
        success: true,
        data: {
          description: data.description,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          source: data.source,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to lookup barcode';
      console.error('Barcode lookup error:', message);
      setError(message);
      // On any error, fall back to letting the user submit the UPC manually
      return { success: false, notFound: true, upc };
    } finally {
      setIsScanning(false);
    }
  };

  const createFoodItemFromScan = (result: LookupResult): Omit<FoodItem, 'uid' | 'entryId'> => {
    return {
      description: result.description,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
    };
  };

  return {
    lookupUpc,
    createFoodItemFromScan,
    isScanning,
    error,
  };
}
