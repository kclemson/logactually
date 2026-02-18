import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ChartSpec } from "@/components/trends/DynamicChart";

interface GenerateChartParams {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  period: number;
}

export interface DailyTotals {
  food: Record<string, { cal: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sat_fat: number; sodium: number; chol: number }>;
  exercise: Record<string, { sets: number; duration: number; distance: number; cal_burned: number; unique_exercises: number }>;
}

export interface GenerateChartResult {
  chartSpec: ChartSpec;
  dailyTotals: DailyTotals;
}

export function useGenerateChart() {
  return useMutation({
    mutationFn: async ({ messages, period }: GenerateChartParams): Promise<GenerateChartResult> => {
      const { data, error } = await supabase.functions.invoke("generate-chart", {
        body: { messages, period },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      console.log("[generate-chart] response:", { data, error });
      if (!data?.chartSpec) throw new Error("No chart specification returned");

      return {
        chartSpec: data.chartSpec as ChartSpec,
        dailyTotals: data.dailyTotals ?? { food: {}, exercise: {} },
      };
    },
  });
}
