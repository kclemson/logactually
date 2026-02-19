import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ChartSpec } from "@/components/trends/DynamicChart";
import type { ChartDSL } from "@/lib/chart-dsl";

interface GenerateChartParams {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  period: number;
  mode?: "v1" | "v2";
}

export interface DailyTotals {
  food: Record<string, { cal: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sat_fat: number; sodium: number; chol: number; entries: number }>;
  exercise: Record<string, { sets: number; duration: number; distance: number; cal_burned: number; unique_exercises: number }>;
  exerciseByKey?: Record<string, {
    description: string;
    count: number;
    total_sets: number;
    total_duration: number;
    avg_duration: number;
    total_distance: number;
    avg_heart_rate: number | null;
    avg_effort: number | null;
    total_cal_burned: number;
  }>;
}

export interface GenerateChartResult {
  chartSpec: ChartSpec;
  dailyTotals: DailyTotals;
  /** Only present in v2 mode */
  chartDSL?: ChartDSL;
}

export function useGenerateChart() {
  return useMutation({
    mutationFn: async ({ messages, period, mode = "v1" }: GenerateChartParams): Promise<GenerateChartResult> => {
      const edgeMode = mode === "v2" ? "schema" : undefined;
      const { data, error } = await supabase.functions.invoke("generate-chart", {
        body: { messages, period, mode: edgeMode },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      console.log("[generate-chart] response:", { data, error });

      const dailyTotals = data.dailyTotals ?? { food: {}, exercise: {} };

      // V2 schema mode: return DSL for client-side execution
      if (mode === "v2" && data?.chartDSL) {
        const { executeDSL } = await import("@/lib/chart-dsl");
        const chartSpec = executeDSL(data.chartDSL, dailyTotals);
        return { chartSpec, dailyTotals, chartDSL: data.chartDSL };
      }

      // V1 mode: AI returned computed data
      if (!data?.chartSpec) throw new Error("No chart specification returned");
      return {
        chartSpec: data.chartSpec as ChartSpec,
        dailyTotals,
      };
    },
  });
}
