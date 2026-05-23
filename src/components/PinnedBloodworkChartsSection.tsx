import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DynamicChart } from "@/components/trends/DynamicChart";
import { useSavedCharts } from "@/hooks/useSavedCharts";
import { supabase } from "@/integrations/supabase/client";
import { executeDSL } from "@/lib/chart-dsl";
import { fetchChartData } from "@/lib/chart-data";
import { mergeChartSpecs } from "@/lib/chart-merge";
import { BLOODWORK_CANONICAL } from "@/lib/bloodwork-canonical";
import type { ChartDSL } from "@/lib/chart-types";
import type { ChartSpec } from "@/components/trends/DynamicChart";

interface PinnedBloodworkChartsSectionProps {
  /** Header search query; when non-empty, only charts whose analyte matches are shown. */
  query: string;
}

/**
 * Renders saved bloodwork charts inline on /custom so users don't have to
 * jump to /trends to glance at pinned analytes. Reuses Trends' rendering
 * path (saved chart_spec + live re-execution of the DSL).
 */
export function PinnedBloodworkChartsSection({ query }: PinnedBloodworkChartsSectionProps) {
  const { savedCharts } = useSavedCharts();

  const bloodworkCharts = useMemo(
    () => savedCharts.filter((c) => (c.chart_dsl as ChartDSL | null)?.source === "bloodwork"),
    [savedCharts]
  );

  // Live re-execute each chart's DSL so the inline view reflects fresh data.
  // Bloodwork fetches are always all-time (period is ignored), so no period prop.
  const chartIds = useMemo(() => bloodworkCharts.map((c) => c.id), [bloodworkCharts]);
  const { data: liveSpecs } = useQuery({
    queryKey: ["saved-charts-live", chartIds, "bloodwork-inline"],
    enabled: chartIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const results = new Map<string, ChartSpec>();
      await Promise.all(
        bloodworkCharts.map(async (chart) => {
          try {
            const dsl = chart.chart_dsl as ChartDSL;
            const freshData = await fetchChartData(supabase, dsl, 0);
            let freshSpec = executeDSL(dsl, freshData);
            if (chart.chart_dsl_2) {
              const dsl2 = chart.chart_dsl_2 as ChartDSL;
              const freshData2 = await fetchChartData(supabase, dsl2, 0);
              const freshSpec2 = executeDSL(dsl2, freshData2);
              freshSpec = mergeChartSpecs(freshSpec, freshSpec2);
            }
            results.set(chart.id, freshSpec);
          } catch (err) {
            console.warn(`[pinned-bloodwork] Failed to refresh chart ${chart.id}:`, err);
          }
        })
      );
      return results;
    },
  });

  const filtered = useMemo(() => {
    if (!query.trim()) return bloodworkCharts;
    const q = query.trim().toLowerCase();
    return bloodworkCharts.filter((chart) => {
      const dsl = chart.chart_dsl as ChartDSL | null;
      const canonicalKey = dsl?.filter?.canonicalKey ?? "";
      const haystack: string[] = [
        chart.question ?? "",
        chart.chart_spec?.title ?? "",
        canonicalKey,
      ];
      if (canonicalKey) {
        const canon = BLOODWORK_CANONICAL.find((c) => c.key === canonicalKey);
        if (canon) {
          haystack.push(canon.display);
          haystack.push(...canon.synonyms);
        }
      }
      return haystack.some((s) => s && s.toLowerCase().includes(q));
    });
  }, [bloodworkCharts, query]);

  if (filtered.length === 0) return null;

  return (
    <CollapsibleSection
      title="Pinned"
      icon={ClipboardList}
      iconClassName="text-teal-500 dark:text-teal-400"
      defaultOpen={true}
      storageKey="custom-pinned-bloodwork"
    >
      <div className="grid grid-cols-2 gap-2">
        {filtered.map((chart) => {
          const live = liveSpecs?.get(chart.id);
          const spec = live
            ? { ...live, title: chart.chart_spec.title, aiNote: chart.chart_spec.aiNote }
            : chart.chart_spec;
          return <DynamicChart key={chart.id} spec={spec} />;
        })}
      </div>
    </CollapsibleSection>
  );
}
