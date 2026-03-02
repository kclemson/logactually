import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchChartData } from "@/lib/chart-data";
import { executeDSL, FOOD_METRICS, EXERCISE_METRICS } from "@/lib/chart-dsl";
import { mergeChartSpecs } from "@/lib/chart-merge";
import { DynamicChart, type ChartSpec } from "@/components/trends/DynamicChart";
import type { ChartDSL } from "@/lib/chart-types";

const SOURCE_DEFAULT_COLORS: Record<string, string> = {
  food: "#3B82F6",
  exercise: "#8B5CF6",
};

function humanizeMetric(key: string): string {
  const MAP: Record<string, string> = {
    calories: "Calories",
    protein: "Protein (g)",
    carbs: "Carbs (g)",
    fat: "Fat (g)",
    fiber: "Fiber (g)",
    sugar: "Sugar (g)",
    saturated_fat: "Saturated fat (g)",
    sodium: "Sodium (mg)",
    cholesterol: "Cholesterol (mg)",
    entries: "Entry count",
    sets: "Sets",
    reps: "Reps",
    weight_lbs: "Weight (lbs)",
    duration_minutes: "Duration (min)",
    distance_miles: "Distance (mi)",
    calories_burned: "Calories burned",
    heart_rate: "Heart rate (bpm)",
    unique_exercises: "Unique exercises",
  };
  return MAP[key] ?? key.replace(/_/g, " ");
}

interface SeriesConfig {
  source: "food" | "exercise";
  metric: string;
  chartType: "bar" | "line";
  color: string;
}

interface CompareChartBuilderProps {
  period: number;
  onSave: (params: { question: string; chartSpec: ChartSpec; chartDsl: ChartDSL; chartDsl2: ChartDSL }) => void;
  isSaving: boolean;
  initialDsl?: ChartDSL;
  initialDsl2?: ChartDSL;
}

export function CompareChartBuilder({ period, onSave, isSaving, initialDsl, initialDsl2 }: CompareChartBuilderProps) {
  const [seriesA, setSeriesA] = useState<SeriesConfig>(() => ({
    source: initialDsl?.source ?? "food",
    metric: initialDsl?.metric ?? "calories",
    chartType: (initialDsl?.chartType as "bar" | "line") ?? "bar",
    color: SOURCE_DEFAULT_COLORS[initialDsl?.source ?? "food"],
  }));

  const [seriesB, setSeriesB] = useState<SeriesConfig>(() => ({
    source: initialDsl2?.source ?? "exercise",
    metric: initialDsl2?.metric ?? "duration_minutes",
    chartType: (initialDsl2?.chartType as "bar" | "line") ?? "line",
    color: SOURCE_DEFAULT_COLORS[initialDsl2?.source ?? "exercise"],
  }));

  const [groupBy, setGroupBy] = useState<"date" | "week">(
    (initialDsl?.groupBy as "date" | "week") ?? "date",
  );

  const [preview, setPreview] = useState<ChartSpec | null>(null);
  const [dslA, setDslA] = useState<ChartDSL | null>(initialDsl ?? null);
  const [dslB, setDslB] = useState<ChartDSL | null>(initialDsl2 ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const buildDsl = (s: SeriesConfig): ChartDSL => ({
        chartType: s.chartType,
        title: humanizeMetric(s.metric),
        source: s.source,
        metric: s.metric,
        groupBy,
        aggregation: "sum",
      });

      const d1 = buildDsl(seriesA);
      const d2 = buildDsl(seriesB);

      const [data1, data2] = await Promise.all([
        fetchChartData(supabase, d1, period),
        fetchChartData(supabase, d2, period),
      ]);

      const spec1 = executeDSL(d1, data1);
      const spec2 = executeDSL(d2, data2);
      const merged = mergeChartSpecs(spec1, spec2, {
        colorOverrides: { colorA: seriesA.color, colorB: seriesB.color },
      });

      if (!mountedRef.current) return;
      setPreview(merged);
      setDslA(d1);
      setDslB(d2);
    } catch (err: any) {
      if (!mountedRef.current) return;
      setError(err.message || "Failed to generate chart");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [seriesA, seriesB, groupBy, period]);

  // Auto-preview on any config change
  useEffect(() => {
    handleGenerate();
  }, [handleGenerate]);

  const handleSave = () => {
    if (!preview || !dslA || !dslB) return;
    const question = `${humanizeMetric(seriesA.metric)} vs ${humanizeMetric(seriesB.metric)}`;
    onSave({ question, chartSpec: preview, chartDsl: dslA, chartDsl2: dslB });
  };

  const metricsFor = (source: "food" | "exercise") =>
    source === "food" ? FOOD_METRICS : EXERCISE_METRICS;

  const handleSourceChange = (
    config: SeriesConfig,
    newSource: "food" | "exercise",
    onChange: (c: SeriesConfig) => void,
  ) => {
    const metrics = metricsFor(newSource);
    onChange({
      ...config,
      source: newSource,
      metric: metrics[0],
      color: SOURCE_DEFAULT_COLORS[newSource],
    });
  };

  const SeriesRow = ({
    label,
    config,
    onChange,
  }: {
    label: string;
    config: SeriesConfig;
    onChange: (c: SeriesConfig) => void;
  }) => (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex gap-1.5 items-center">
        <Select value={config.source} onValueChange={(v) => handleSourceChange(config, v as "food" | "exercise", onChange)}>
          <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="food">Food</SelectItem>
            <SelectItem value="exercise">Exercise</SelectItem>
          </SelectContent>
        </Select>
        <Select value={config.metric} onValueChange={(v) => onChange({ ...config, metric: v })}>
          <SelectTrigger className="h-8 text-xs flex-[2] min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {metricsFor(config.source).map((m) => (
              <SelectItem key={m} value={m}>{humanizeMetric(m)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={config.chartType} onValueChange={(v) => onChange({ ...config, chartType: v as "bar" | "line" })}>
          <SelectTrigger className="h-8 text-xs w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">Bar</SelectItem>
            <SelectItem value="line">Line</SelectItem>
          </SelectContent>
        </Select>
        <input
          type="color"
          value={config.color}
          onChange={(e) => onChange({ ...config, color: e.target.value })}
          className="w-6 h-6 rounded-full border border-border cursor-pointer p-0 bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-none"
          title={`${label} color`}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <SeriesRow label="Series A" config={seriesA} onChange={setSeriesA} />
      <SeriesRow label="Series B" config={seriesB} onChange={setSeriesB} />

      <div className="flex gap-1.5 items-center">
        <p className="text-xs font-medium text-muted-foreground">Group by</p>
        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as "date" | "week")}>
          <SelectTrigger className="h-8 text-xs w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Daily</SelectItem>
            <SelectItem value="week">Weekly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {loading && !preview && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {preview && (
        <div className="space-y-2 relative">
          {loading && (
            <div className="absolute top-2 right-2 z-10">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            </div>
          )}
          <div className="border border-border rounded-md overflow-hidden">
            <DynamicChart
              spec={preview}
              period={period}
              onTitleChange={(t) => setPreview(prev => prev ? { ...prev, title: t } : null)}
              onAiNoteChange={(n) => setPreview(prev => prev ? { ...prev, aiNote: n } : null)}
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-8">
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Save to Trends
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
