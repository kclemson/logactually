import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PopulateDemoDataParams {
  startDate: string;
  endDate: string;
  clearExisting?: boolean;
  generateFood?: boolean;
  generateWeights?: boolean;
  generateSavedMeals?: number;
  generateSavedRoutines?: number;
}

interface PopulateSummary {
  foodEntries?: number;
  weightSets?: number;
  savedMeals?: number;
  savedRoutines?: number;
  deleted?: {
    foodEntries?: number;
    weightSets?: number;
  };
}

interface PopulateResult {
  success: boolean;
  summary?: PopulateSummary;
  error?: string;
  message?: string;
  status?: 'processing' | 'complete';
}

export function usePopulateDemoData() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PopulateResult | null>(null);

  const populate = async (params: PopulateDemoDataParams) => {
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("populate-demo-data", {
        body: params,
      });

      if (error) {
        setResult({ success: false, error: error.message });
      } else {
        setResult({ 
          success: true, 
          summary: data?.summary,
          message: data?.message,
          status: data?.status || 'complete',
        });
      }
    } catch (err) {
      setResult({ success: false, error: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => setResult(null);

  return { populate, isLoading, result, reset };
}
