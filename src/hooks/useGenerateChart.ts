import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ChartSpec } from "@/components/trends/DynamicChart";

interface GenerateChartParams {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  period: number;
}

export function useGenerateChart() {
  return useMutation({
    mutationFn: async ({ messages, period }: GenerateChartParams): Promise<ChartSpec> => {
      const { data, error } = await supabase.functions.invoke("generate-chart", {
        body: { messages, period },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data.chartSpec as ChartSpec;
    },
  });
}
