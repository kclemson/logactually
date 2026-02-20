import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ChartSpec } from "@/components/trends/DynamicChart";
import type { ChartDSL, DailyTotals } from "@/lib/chart-types";
import { fetchChartData } from "@/lib/chart-data";
import { executeDSL } from "@/lib/chart-dsl";

// Re-export types for backward compat
export type { DailyTotals } from "@/lib/chart-types";

interface GenerateChartParams {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  period: number;
  mode?: "v1" | "v2";
}

export interface GenerateChartResult {
  chartSpec: ChartSpec;
  dailyTotals: DailyTotals;
  /** Only present in v2 mode */
  chartDSL?: ChartDSL;
  /** Populated when AI returned multiple interpretations (v2 only) */
  chartOptions?: Array<{ chartSpec: ChartSpec; chartDSL: ChartDSL; dailyTotals: DailyTotals }>;
  /** True when v2 was requested but fell back to v1 due to unsupported request */
  usedFallback?: boolean;
}

export function useGenerateChart() {
  return useMutation({
    mutationFn: async ({ messages, period, mode = "v1" }: GenerateChartParams): Promise<GenerateChartResult> => {
      // ── v2: lightweight DSL edge function + client-side data ──
      if (mode === "v2") {
        // Step 1: Get DSL from AI (no user data sent)
        const { data: dslData, error: dslError } = await supabase.functions.invoke("generate-chart-dsl", {
          body: { messages, period },
        });

        if (dslError) throw dslError;
        if (dslData?.error) throw new Error(dslData.error);

        // v2 self-reported unsupported — transparently fall back to v1
        if (dslData?.unsupported) {
          console.log("[generate-chart] v2 unsupported, falling back to v1:", dslData.reason);
          const { data, error } = await supabase.functions.invoke("generate-chart", {
            body: { messages, period },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
          const dailyTotals = data.dailyTotals ?? { food: {}, exercise: {} };
          if (!data?.chartSpec) throw new Error("No chart specification returned");
          return { chartSpec: data.chartSpec as ChartSpec, dailyTotals, usedFallback: true };
        }
        // Multi-option (disambiguation) path
        if (dslData?.chartDSLOptions) {
          const options = dslData.chartDSLOptions as ChartDSL[];
          console.log("[generate-chart] v2 DSL options:", options);
          const resolved = await Promise.all(
            options.map(async (dsl) => {
              const dt = await fetchChartData(supabase, dsl, period);
              return { chartSpec: executeDSL(dsl, dt), chartDSL: dsl, dailyTotals: dt };
            })
          );
          return {
            chartSpec: resolved[0].chartSpec,
            dailyTotals: resolved[0].dailyTotals,
            chartDSL: resolved[0].chartDSL,
            chartOptions: resolved,
          };
        }

        if (!dslData?.chartDSL) throw new Error("No chart DSL returned");

        const chartDSL = dslData.chartDSL as ChartDSL;
        console.log("[generate-chart] v2 DSL:", chartDSL);

        // Step 2: Fetch data client-side based on the DSL
        const dailyTotals = await fetchChartData(supabase, chartDSL, period);

        // Step 3: Execute DSL against local data
        const chartSpec = executeDSL(chartDSL, dailyTotals);

        return { chartSpec, dailyTotals, chartDSL };
      }

      // ── v1: legacy edge function (unchanged) ──
      const { data, error } = await supabase.functions.invoke("generate-chart", {
        body: { messages, period },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      console.log("[generate-chart] v1 response:", { data, error });

      const dailyTotals = data.dailyTotals ?? { food: {}, exercise: {} };

      if (!data?.chartSpec) throw new Error("No chart specification returned");
      return {
        chartSpec: data.chartSpec as ChartSpec,
        dailyTotals,
      };
    },
  });
}
