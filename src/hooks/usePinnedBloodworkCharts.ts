import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { ChartDSL } from "@/lib/chart-types";
import { executeDSL } from "@/lib/chart-dsl";
import { fetchChartData } from "@/lib/chart-data";

/**
 * Tracks which bloodwork analytes (canonical_key) the user has pinned to Custom Trends.
 * Pinned charts live in saved_charts with chart_dsl.source === "bloodwork".
 */
export function usePinnedBloodworkCharts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pinnedKeys = new Set<string>() } = useQuery({
    queryKey: ["pinned-bloodwork", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_charts" as any)
        .select("id, chart_dsl")
        .eq("user_id", user!.id);
      if (error) throw error;
      const keys = new Set<string>();
      for (const row of (data ?? []) as Array<{ chart_dsl: any }>) {
        const dsl = row.chart_dsl as ChartDSL | null;
        if (dsl?.source === "bloodwork" && dsl.filter?.canonicalKey) {
          keys.add(dsl.filter.canonicalKey);
        }
      }
      return keys;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["pinned-bloodwork"] });
    queryClient.invalidateQueries({ queryKey: ["saved-charts"] });
    queryClient.invalidateQueries({ queryKey: ["saved-charts-live"] });
  };

  const pin = useMutation({
    mutationFn: async ({ canonicalKey, displayName }: { canonicalKey: string; displayName: string }) => {
      if (!user) throw new Error("Not authenticated");
      const dsl: ChartDSL = {
        chartType: "line",
        title: displayName,
        source: "bloodwork",
        metric: "value",
        groupBy: "date",
        aggregation: "sum",
        filter: { canonicalKey },
      };
      // Build an initial spec so the saved chart row is well-formed even before live refresh.
      const data = await fetchChartData(supabase, dsl, 0);
      const spec = executeDSL(dsl, data);
      const { error } = await supabase.from("saved_charts" as any).insert({
        user_id: user.id,
        question: displayName,
        chart_spec: spec as any,
        chart_dsl: dsl as any,
        chart_dsl_2: null,
      } as any);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const unpin = useMutation({
    mutationFn: async (canonicalKey: string) => {
      if (!user) throw new Error("Not authenticated");
      // Fetch matching rows and delete (filtering on jsonb path client-side keeps this simple).
      const { data, error } = await supabase
        .from("saved_charts" as any)
        .select("id, chart_dsl")
        .eq("user_id", user.id);
      if (error) throw error;
      const ids = ((data ?? []) as Array<{ id: string; chart_dsl: any }>)
        .filter((r) => {
          const dsl = r.chart_dsl as ChartDSL | null;
          return dsl?.source === "bloodwork" && dsl.filter?.canonicalKey === canonicalKey;
        })
        .map((r) => r.id);
      if (ids.length === 0) return;
      const { error: delErr } = await supabase.from("saved_charts" as any).delete().in("id", ids);
      if (delErr) throw delErr;
    },
    onSuccess: invalidate,
  });

  return { pinnedKeys, pin, unpin };
}
