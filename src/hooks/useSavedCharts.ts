import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ChartSpec } from "@/components/trends/DynamicChart";

interface SavedChart {
  id: string;
  user_id: string;
  created_at: string;
  question: string;
  chart_spec: ChartSpec;
  chart_dsl?: unknown;
  sort_order: number;
}

export function useSavedCharts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["saved-charts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_charts" as any)
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as SavedChart[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ question, chartSpec, chartDsl }: { question: string; chartSpec: ChartSpec; chartDsl?: unknown }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("saved_charts" as any).insert({
        user_id: user.id,
        question,
        chart_spec: chartSpec as any,
        chart_dsl: chartDsl ?? null,
      } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-charts"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, question, chartSpec, chartDsl }: { id: string; question: string; chartSpec: ChartSpec; chartDsl?: unknown }) => {
      const { error } = await supabase
        .from("saved_charts" as any)
        .update({ question, chart_spec: chartSpec as any, chart_dsl: chartDsl ?? null } as any)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-charts"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("saved_charts" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-charts"] });
    },
  });

  return {
    savedCharts: query.data || [],
    isLoading: query.isLoading,
    saveMutation,
    updateMutation,
    deleteMutation,
  };
}
