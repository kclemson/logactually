import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchChartData } from "@/lib/chart-data";
import { executeDSL, FOOD_METRICS, EXERCISE_METRICS } from "@/lib/chart-dsl";
import { DynamicChart, type ChartSpec } from "@/components/trends/DynamicChart";
import type { ChartDSL } from "@/lib/chart-types";
import { EXERCISE_GROUPS, getExerciseDisplayName, getSubtypeDisplayName } from "@/lib/exercise-metadata";

const EXERCISE_SUBTYPES: Record<string, string[]> = {
  walk_run: ["walking", "running", "hiking"],
  cycling: ["indoor", "outdoor"],
  swimming: ["pool", "open_water"],
};

const SOURCE_DEFAULT_COLORS: Record<string, string> = {
  food: "#3B82F6",
  exercise: "#8B5CF6",
};

function humanizeMetric(key: string): string {
  const MAP: Record<string, string> = {
    calories: "Calories", protein: "Protein (g)", carbs: "Carbs (g)", fat: "Fat (g)",
    fiber: "Fiber (g)", sugar: "Sugar (g)", saturated_fat: "Saturated fat (g)",
    sodium: "Sodium (mg)", cholesterol: "Cholesterol (mg)", entries: "Entry count",
    sets: "Sets", reps: "Reps", weight_lbs: "Weight (lbs)",
    duration_minutes: "Duration (min)", distance_miles: "Distance (mi)",
    calories_burned: "Calories burned", heart_rate: "Heart rate (bpm)",
    unique_exercises: "Unique exercises",
  };
  return MAP[key] ?? key.replace(/_/g, " ");
}

const GROUP_BY_OPTIONS: { value: ChartDSL["groupBy"]; label: string }[] = [
  { value: "date", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "dayOfWeek", label: "Day of week" },
  { value: "hourOfDay", label: "Hour of day" },
  { value: "item", label: "By item" },
  { value: "category", label: "By category" },
];

const AGGREGATION_OPTIONS: { value: ChartDSL["aggregation"]; label: string }[] = [
  { value: "sum", label: "Sum" },
  { value: "average", label: "Average" },
  { value: "max", label: "Max" },
  { value: "min", label: "Min" },
  { value: "count", label: "Count" },
];

const WINDOW_OPTIONS = [
  { value: "0", label: "None" },
  { value: "3", label: "3-day" },
  { value: "5", label: "5-day" },
  { value: "7", label: "7-day" },
  { value: "14", label: "14-day" },
  { value: "30", label: "30-day" },
];

interface SingleChartBuilderProps {
  period: number;
  onSave: (params: { question: string; chartSpec: ChartSpec; chartDsl: ChartDSL }) => void;
  isSaving: boolean;
  initialDsl?: ChartDSL;
}

export function SingleChartBuilder({ period, onSave, isSaving, initialDsl }: SingleChartBuilderProps) {
  const [source, setSource] = useState<"food" | "exercise">(initialDsl?.source ?? "food");
  const [metric, setMetric] = useState(initialDsl?.metric ?? "calories");
  const [chartType, setChartType] = useState<"bar" | "line" | "area">(initialDsl?.chartType ?? "bar");
  const [groupBy, setGroupBy] = useState<ChartDSL["groupBy"]>(initialDsl?.groupBy ?? "date");
  const [aggregation, setAggregation] = useState<ChartDSL["aggregation"]>(initialDsl?.aggregation ?? "sum");
  const [window, setWindow] = useState(initialDsl?.window ?? 0);
  const [color, setColor] = useState(SOURCE_DEFAULT_COLORS[initialDsl?.source ?? "food"]);
  const [exerciseKey, setExerciseKey] = useState<string | undefined>(initialDsl?.filter?.exerciseKey);
  const [exerciseSubtype, setExerciseSubtype] = useState<string | undefined>(initialDsl?.filter?.exerciseSubtype);

  const [preview, setPreview] = useState<ChartSpec | null>(null);
  const [currentDsl, setCurrentDsl] = useState<ChartDSL | null>(initialDsl ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const subtypes = exerciseKey ? EXERCISE_SUBTYPES[exerciseKey] : undefined;
  const showWindow = groupBy === "date" || groupBy === "week";
  const metrics = source === "food" ? FOOD_METRICS : EXERCISE_METRICS;

  const handleSourceChange = (newSource: "food" | "exercise") => {
    const newMetrics = newSource === "food" ? FOOD_METRICS : EXERCISE_METRICS;
    setSource(newSource);
    setMetric(newMetrics[0]);
    setColor(SOURCE_DEFAULT_COLORS[newSource]);
    setExerciseKey(undefined);
    setExerciseSubtype(undefined);
    // Reset category groupBy if switching to food
    if (newSource === "food" && groupBy === "category") {
      setGroupBy("date");
    }
  };

  const buildQuestion = useCallback((): string => {
    const metricLabel = humanizeMetric(metric);
    const groupLabel = GROUP_BY_OPTIONS.find(g => g.value === groupBy)?.label ?? groupBy;
    const aggLabel = aggregation !== "sum" ? ` (${aggregation})` : "";
    const exLabel = exerciseKey
      ? ` — ${exerciseSubtype ? getSubtypeDisplayName(exerciseSubtype) : getExerciseDisplayName(exerciseKey)}`
      : "";
    const windowLabel = window > 0 ? ` (${window}-day avg)` : "";
    return `${metricLabel}${aggLabel} · ${groupLabel}${exLabel}${windowLabel}`;
  }, [metric, groupBy, aggregation, exerciseKey, exerciseSubtype, window]);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dsl: ChartDSL = {
        chartType,
        title: buildQuestion(),
        source,
        metric,
        groupBy,
        aggregation,
        filter: exerciseKey ? { exerciseKey, exerciseSubtype } : undefined,
        window: window > 0 ? window : undefined,
      };

      const data = await fetchChartData(supabase, dsl, period);
      const spec = executeDSL(dsl, data);

      // Apply color override
      spec.color = color;

      if (!mountedRef.current) return;
      setPreview(spec);
      setCurrentDsl(dsl);
    } catch (err: any) {
      if (!mountedRef.current) return;
      setError(err.message || "Failed to generate chart");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [source, metric, chartType, groupBy, aggregation, window, exerciseKey, exerciseSubtype, color, period, buildQuestion]);

  useEffect(() => {
    handleGenerate();
  }, [handleGenerate]);

  const handleSave = () => {
    if (!preview || !currentDsl) return;
    onSave({ question: buildQuestion(), chartSpec: preview, chartDsl: currentDsl });
  };

  // Filter groupBy options: "category" only for exercise
  const groupByOptions = GROUP_BY_OPTIONS.filter(
    g => g.value !== "category" || source === "exercise"
  );

  return (
    <div className="space-y-2.5">
      {/* Row 1: Source + Metric */}
      <div className="flex gap-1.5 items-center">
        <Select value={source} onValueChange={(v) => handleSourceChange(v as "food" | "exercise")}>
          <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="food">Food</SelectItem>
            <SelectItem value="exercise">Exercise</SelectItem>
          </SelectContent>
        </Select>
        <Select value={metric} onValueChange={setMetric}>
          <SelectTrigger className="h-8 text-xs flex-[2] min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {metrics.map((m) => (
              <SelectItem key={m} value={m}>{humanizeMetric(m)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Exercise filter */}
      {source === "exercise" && (
        <div className="flex gap-1.5 items-center">
          <Select
            value={exerciseKey ?? "__all__"}
            onValueChange={(v) => {
              setExerciseKey(v === "__all__" ? undefined : v);
              setExerciseSubtype(undefined);
            }}
          >
            <SelectTrigger className="h-7 text-xs flex-1 min-w-0">
              <SelectValue placeholder="All exercises" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All exercises</SelectItem>
              {EXERCISE_GROUPS.map((g) => (
                <SelectGroup key={g.label}>
                  <SelectLabel className="text-[10px] text-muted-foreground px-2 py-1">{g.label}</SelectLabel>
                  {g.keys.map((k) => (
                    <SelectItem key={k} value={k}>{getExerciseDisplayName(k)}</SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          {subtypes && (
            <Select
              value={exerciseSubtype ?? "__all__"}
              onValueChange={(v) => setExerciseSubtype(v === "__all__" ? undefined : v)}
            >
              <SelectTrigger className="h-7 text-xs flex-1 min-w-0">
                <SelectValue placeholder="All subtypes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All subtypes</SelectItem>
                {subtypes.map((st) => (
                  <SelectItem key={st} value={st}>{getSubtypeDisplayName(st)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Row 2: Chart type + Group by + Aggregation */}
      <div className="flex gap-1.5 items-center">
        <Select value={chartType} onValueChange={(v) => setChartType(v as "bar" | "line" | "area")}>
          <SelectTrigger className="h-8 text-xs w-[72px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">Bar</SelectItem>
            <SelectItem value="line">Line</SelectItem>
            <SelectItem value="area">Area</SelectItem>
          </SelectContent>
        </Select>
        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as ChartDSL["groupBy"])}>
          <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {groupByOptions.map((g) => (
              <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={aggregation} onValueChange={(v) => setAggregation(v as ChartDSL["aggregation"])}>
          <SelectTrigger className="h-8 text-xs w-[90px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AGGREGATION_OPTIONS.map((a) => (
              <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-6 h-6 rounded-full border border-border cursor-pointer p-0 bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-none"
          title="Chart color"
        />
      </div>

      {/* Row 3: Rolling average (conditional) */}
      {showWindow && (
        <div className="flex gap-1.5 items-center">
          <p className="text-xs font-medium text-muted-foreground">Rolling avg</p>
          <Select value={String(window)} onValueChange={(v) => setWindow(Number(v))}>
            <SelectTrigger className="h-8 text-xs w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WINDOW_OPTIONS.map((w) => (
                <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Loading (initial) */}
      {loading && !preview && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Preview */}
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
