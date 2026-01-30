import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfDay } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { Card, CardContent, CardHeader, ChartTitle, ChartSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Dumbbell, ChevronDown } from "lucide-react";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { FEATURES } from "@/lib/feature-flags";
import { useWeightTrends, ExerciseTrend, WeightPoint } from "@/hooks/useWeightTrends";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUserSettings } from "@/hooks/useUserSettings";
import type { WeightUnit } from "@/lib/weight-units";
import { useMergeExercises } from "@/hooks/useMergeExercises";
import { DuplicateExercisePrompt, type DuplicateGroup } from "@/components/DuplicateExercisePrompt";
import { getMuscleGroupDisplayWithTooltip } from "@/lib/exercise-metadata";

// Chart color palette (hex RGB format for easy editing)
const CHART_COLORS = {
  calories: "#0033CC",
  protein: "#115E83",
  carbs: "#00B4D8",
  fat: "#90E0EF",
  trainingVolume: "hsl(262 83% 58%)", // Bright purple matching exercise charts (kept separate const for future adjustment)
} as const;

// Density-based spacing helpers for food charts
const getFoodLabelOffsetPx = (dataLength: number): number =>
  dataLength > 35 ? 11 : dataLength > 21 ? 8 : 4;

const getFoodChartMarginTop = (dataLength: number): number =>
  dataLength > 35 ? 22 : dataLength > 21 ? 18 : 12;

// Helper to create food chart label renderer with interval-based visibility
const createFoodLabelRenderer = (
  chartData: Array<{ showLabel: boolean }>,
  color: string,
  yOffsetPx: number = 4
) => (props: any) => {
  const { x, y, width, value, index } = props;
  
  const dataPoint = chartData[index];
  if (!dataPoint?.showLabel) return null;
  if (!value || typeof x !== 'number' || typeof width !== 'number') return null;
  
  return (
    <text
      x={x + width / 2}
      y={y - yOffsetPx}
      fill={color}
      textAnchor="middle"
      fontSize={7}
      fontWeight={500}
    >
      {Math.round(value)}
    </text>
  );
};

const CompactTooltip = ({ active, payload, label, formatter, totalKey, totalLabel, totalColor }: any) => {
  if (!active || !payload?.length) return null;

  // Get total from the first payload item's data if totalKey is provided
  const totalValue = totalKey && payload[0]?.payload?.[totalKey];

  return (
    <div className="rounded-md border border-border/50 bg-white dark:bg-slate-800 px-2 py-1 shadow-md">
      <p className="text-[10px] font-medium text-slate-900 dark:text-slate-100 mb-0.5">{label}</p>
      {totalValue !== undefined && (
        <p className="text-[10px] font-semibold mb-0.5" style={{ color: totalColor || '#0033CC' }}>
          {totalLabel || 'Total'}: {Math.round(totalValue)} cal
        </p>
      )}
      {payload
        .slice()
        .reverse()
        .map((entry: any, index: number) => {
          const displayValue = formatter
            ? formatter(entry.value, entry.name, entry, index, entry.payload)
            : `${entry.name}: ${Math.round(entry.value)}`;
          return (
            <p key={entry.dataKey || index} className="text-[10px]" style={{ color: entry.color }}>
              {Array.isArray(displayValue) ? displayValue[0] : displayValue}
            </p>
          );
        })}
    </div>
  );
};

const periods = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

const LBS_TO_KG = 0.453592;

const ExerciseChart = ({ exercise, unit, onBarClick }: { exercise: ExerciseTrend; unit: WeightUnit; onBarClick: (date: string) => void }) => {
  const chartData = useMemo(() => {
    const dataLength = exercise.weightData.length;
    // Calculate how often to show labels based on column count
    const labelInterval = dataLength <= 12 ? 1 : dataLength <= 20 ? 2 : 3;

    return exercise.weightData.map((d, index) => {
      const displayWeight = unit === "kg" ? Math.round(d.weight * LBS_TO_KG) : d.weight;
      return {
        ...d,
        rawDate: d.date, // Keep original date for navigation
        weight: displayWeight,
        dateLabel: format(new Date(`${d.date}T12:00:00`), "MMM d"),
        label: `${d.sets}×${d.reps}×${displayWeight}`,
        // Show label on interval OR always on last column
        showLabel: index % labelInterval === 0 || index === dataLength - 1,
      };
    });
  }, [exercise.weightData, unit]);

  const maxWeightDisplay = unit === "kg" ? Math.round(exercise.maxWeight * LBS_TO_KG) : exercise.maxWeight;

  // Label renderer with closure access to chartData for showLabel lookup
  const renderLabel = (props: any) => {
    const { x, y, width, height, value, index } = props;

    // Access showLabel from chartData using index
    const dataPoint = chartData[index];
    if (!dataPoint?.showLabel) return null;

    if (!value || typeof x !== "number" || typeof width !== "number") return null;

    const centerX = x + width / 2;

    // Parse the label "3×10×160" into parts
    const parts = value.split("×");
    if (parts.length !== 3) return null;

    const [sets, reps, weight] = parts;

    // Weight label appears ABOVE the bar in purple
    const weightY = y - 4;

    // Sets×reps inside the bar (stacked: "3", "×", "10")
    const insideLines = [sets, "×", reps];
    const lineHeight = 8;
    const totalTextHeight = insideLines.length * lineHeight;
    const startY = y + ((height || 0) - totalTextHeight) / 2 + lineHeight / 2;

    return (
      <g>
        {/* Weight label above bar - purple color matching bar */}
        <text x={centerX} y={weightY} fill="hsl(262 83% 58%)" textAnchor="middle" fontSize={7} fontWeight={500}>
          {weight}
        </text>

        {/* Sets×reps inside bar - white color */}
        <text x={centerX} fill="#FFFFFF" textAnchor="middle" fontSize={7} fontWeight={500}>
          {insideLines.map((line, i) => (
            <tspan key={i} x={centerX} y={startY + i * lineHeight}>
              {line}
            </tspan>
          ))}
        </text>
      </g>
    );
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="p-2 pb-1">
        <div className="flex flex-col gap-0.5">
          <ChartTitle className="truncate">{exercise.description}</ChartTitle>
          <ChartSubtitle>
            Max: {maxWeightDisplay} {unit}
            {(() => {
              const muscleInfo = getMuscleGroupDisplayWithTooltip(exercise.exercise_key);
              if (!muscleInfo) return null;
              return (
                <span title={muscleInfo.full}> · {muscleInfo.display}</span>
              );
            })()}
          </ChartSubtitle>
        </div>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 12, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 8 }}
                stroke="hsl(var(--muted-foreground))"
                interval="preserveStartEnd"
                tickMargin={2}
                height={16}
              />
              <Tooltip
                content={
                  <CompactTooltip
                    formatter={(value: number, name: string, entry: any) => {
                      const { sets, reps, weight } = entry.payload;
                      return `${sets} sets × ${reps} reps @ ${weight} ${unit}`;
                    }}
                  />
                }
                offset={20}
                cursor={{ fill: "hsl(var(--muted)/0.3)" }}
              />
              <Bar 
                dataKey="weight" 
                fill="hsl(262 83% 58%)" 
                radius={[2, 2, 0, 0]}
                onClick={(data) => onBarClick(data.rawDate)}
                className="cursor-pointer"
              >
                <LabelList dataKey="label" content={renderLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const Trends = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const saved = localStorage.getItem("trends-period");
    return saved && [7, 30, 90].includes(Number(saved)) ? Number(saved) : 30;
  });
  const [extraExercise, setExtraExercise] = useState<string | null>(null);
  const [dismissedDuplicates, setDismissedDuplicates] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("dismissed-duplicate-exercises");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const { data: isAdmin } = useIsAdmin();
  const { settings } = useUserSettings();
  const showWeights = FEATURES.WEIGHT_TRACKING || isAdmin;
  const mergeMutation = useMergeExercises();

  const handleExerciseBarClick = useCallback((date: string) => {
    navigate(`/weights?date=${date}`);
  }, [navigate]);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["food-entries-trends", selectedPeriod],
    queryFn: async () => {
      const startDate = format(subDays(startOfDay(new Date()), selectedPeriod - 1), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("food_entries")
        .select("eaten_date, total_calories, total_protein, total_carbs, total_fat")
        .gte("eaten_date", startDate)
        .order("eaten_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Weight trends query
  const { data: weightExercises = [], isLoading: weightLoading } = useWeightTrends(selectedPeriod);

  // Detect duplicate exercises (same description, different keys)
  // Filter out already-dismissed groups
  const duplicateGroups = useMemo((): DuplicateGroup[] => {
    const byDescription = new Map<string, ExerciseTrend[]>();

    weightExercises.forEach((ex) => {
      const normalized = ex.description.toLowerCase().trim();
      const group = byDescription.get(normalized) || [];
      group.push(ex);
      byDescription.set(normalized, group);
    });

    // Filter to only groups with 2+ exercises, then structure for UI
    return [...byDescription.entries()]
      .filter(([_, exs]) => exs.length > 1)
      .filter(([description]) => !dismissedDuplicates.includes(description))
      .map(([description, exercises]) => {
        // Winner = most sessions
        const sorted = [...exercises].sort((a, b) => b.sessionCount - a.sessionCount);
        return {
          description,
          exercises,
          winner: sorted[0],
          losers: sorted.slice(1),
        };
      });
  }, [weightExercises, dismissedDuplicates]);

  const handleMerge = (group: DuplicateGroup) => {
    mergeMutation.mutate({
      keepKey: group.winner.exercise_key,
      mergeKeys: group.losers.map((ex) => ex.exercise_key),
    });
  };

  const handleDismissGroup = (description: string) => {
    const updated = [...dismissedDuplicates, description];
    localStorage.setItem("dismissed-duplicate-exercises", JSON.stringify(updated));
    setDismissedDuplicates(updated);
  };

  // Aggregate total volume by day across all exercises
  const volumeByDay = useMemo(() => {
    const byDate: Record<string, number> = {};

    weightExercises.forEach((exercise) => {
      exercise.weightData.forEach((point) => {
        // Use pre-calculated volume (correctly accumulated per-row)
        byDate[point.date] = (byDate[point.date] || 0) + point.volume;
      });
    });

    const entries = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, volumeLbs]) => {
        const volume = settings.weightUnit === "kg" 
          ? Math.round(volumeLbs * LBS_TO_KG) 
          : Math.round(volumeLbs);
        return {
          rawDate: date, // Keep original date for navigation
          date: format(new Date(`${date}T12:00:00`), "MMM d"),
          volume,
          label: `${Math.round(volume / 1000)}k`,
        };
      });

    // Add showLabel based on interval
    const dataLength = entries.length;
    const labelInterval = 
      dataLength <= 7 ? 1 :
      dataLength <= 14 ? 2 :
      dataLength <= 21 ? 3 :
      dataLength <= 35 ? 4 : 5;

    return entries.map((d, index) => ({
      ...d,
      showLabel: index % labelInterval === 0 || index === dataLength - 1,
    }));
  }, [weightExercises, settings.weightUnit]);

  // Split into top 25 and remaining
  const top25Exercises = weightExercises.slice(0, 25);
  const remainingExercises = weightExercises.slice(25);
  const selectedExtra = remainingExercises.find((e) => e.exercise_key === extraExercise);

  // Aggregate by date
  const chartData = useMemo(() => {
    const byDate: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};

    entries.forEach((entry) => {
      const date = entry.eaten_date;
      if (!byDate[date]) {
        byDate[date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      byDate[date].calories += entry.total_calories;
      byDate[date].protein += Number(entry.total_protein);
      byDate[date].carbs += Number(entry.total_carbs);
      byDate[date].fat += Number(entry.total_fat);
    });

    const data = Object.entries(byDate).map(([date, totals]) => {
      // Calculate calorie contribution from each macro
      const proteinCals = totals.protein * 4;
      const carbsCals = totals.carbs * 4;
      const fatCals = totals.fat * 9;
      const totalMacroCals = proteinCals + carbsCals + fatCals;

      // Calculate percentages
      const proteinPct = totalMacroCals > 0 ? Math.round((proteinCals / totalMacroCals) * 100) : 0;
      const carbsPct = totalMacroCals > 0 ? Math.round((carbsCals / totalMacroCals) * 100) : 0;
      const fatPct = totalMacroCals > 0 ? Math.round((fatCals / totalMacroCals) * 100) : 0;

      return {
        rawDate: date, // Keep original date for navigation
        date: format(new Date(`${date}T12:00:00`), "MMM d"),
        ...totals,
        // Calorie values for each macro (for stacked chart)
        proteinCals,
        carbsCals,
        fatCals,
        proteinPct,
        carbsPct,
        fatPct,
      };
    });

    // Add showLabel based on interval (same logic as weight charts)
    const dataLength = data.length;
    const labelInterval = 
      dataLength <= 7 ? 1 :
      dataLength <= 14 ? 2 :
      dataLength <= 21 ? 3 :
      dataLength <= 35 ? 4 : 5;

    return data.map((d, index) => ({
      ...d,
      showLabel: index % labelInterval === 0 || index === dataLength - 1,
    }));
  }, [entries]);

  // Calculate averages
  const averages = useMemo(() => {
    if (chartData.length === 0) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

    const sum = chartData.reduce(
      (acc, day) => ({
        calories: acc.calories + day.calories,
        protein: acc.protein + day.protein,
        carbs: acc.carbs + day.carbs,
        fat: acc.fat + day.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    return {
      calories: Math.round(sum.calories / chartData.length),
      protein: Math.round(sum.protein / chartData.length),
      carbs: Math.round(sum.carbs / chartData.length),
      fat: Math.round(sum.fat / chartData.length),
    };
  }, [chartData]);

  const charts = [
    { key: "calories", label: "Calories", color: CHART_COLORS.calories },
    { key: "protein", label: "Protein (g)", color: CHART_COLORS.protein },
    { key: "carbs", label: "Carbs (g)", color: CHART_COLORS.carbs },
    { key: "fat", label: "Fat (g)", color: CHART_COLORS.fat },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2">
        {periods.map(({ label, days }) => (
          <Button
            key={days}
            variant={selectedPeriod === days ? "default" : "outline"}
            size="sm"
            onClick={() => {
              localStorage.setItem("trends-period", String(days));
              setSelectedPeriod(days);
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Food Trends Section */}
      <CollapsibleSection title="Food Trends" icon={UtensilsCrossed} defaultOpen={true}>
        <div className="grid grid-cols-4 gap-2">
          {charts.map(({ key, label }) => (
            <Card key={key} className="text-center border-0 shadow-none">
              <CardContent className="p-2">
                <p className="text-base font-semibold">{averages[key as keyof typeof averages]}</p>
                <p className="text-[10px] text-muted-foreground">Avg {label.split(" ")[0]}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">No data for this period</div>
        ) : (
          <div className="space-y-3">
            {/* Row 1: Calories + Macros Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              {/* Calories Chart */}
              <Card className="border-0 shadow-none">
                <CardHeader className="p-2 pb-1">
                  <ChartTitle>Calories</ChartTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0">
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: getFoodChartMarginTop(chartData.length), right: 0, left: 0, bottom: 0 }}>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 8 }}
                          stroke="hsl(var(--muted-foreground))"
                          interval="preserveStartEnd"
                          tickMargin={2}
                          height={16}
                        />
                        <Tooltip content={<CompactTooltip />} offset={20} cursor={{ fill: "hsl(var(--muted)/0.3)" }} />
                        <Bar 
                          dataKey="calories" 
                          fill={CHART_COLORS.calories} 
                          radius={[2, 2, 0, 0]}
                          onClick={(data) => navigate(`/?date=${data.rawDate}`)}
                          className="cursor-pointer"
                        >
                          <LabelList dataKey="calories" content={createFoodLabelRenderer(chartData, CHART_COLORS.calories, getFoodLabelOffsetPx(chartData.length))} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Macro Split Chart (100% stacked by calorie %) */}
              <Card className="border-0 shadow-none">
                <CardHeader className="p-2 pb-1">
                  <ChartTitle>Macro Split (%)</ChartTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0">
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 8 }}
                          stroke="hsl(var(--muted-foreground))"
                          interval="preserveStartEnd"
                          tickMargin={2}
                          height={16}
                        />
                        <Tooltip
                          content={<CompactTooltip formatter={(value, name) => `${name}: ${value}%`} />}
                          offset={20}
                          cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                        />
                        <Bar 
                          dataKey="fatPct" 
                          name="Fat" 
                          stackId="macros" 
                          fill={CHART_COLORS.fat}
                          onClick={(data) => navigate(`/?date=${data.rawDate}`)}
                          className="cursor-pointer"
                        />
                        <Bar 
                          dataKey="carbsPct" 
                          name="Carbs" 
                          stackId="macros" 
                          fill={CHART_COLORS.carbs}
                          onClick={(data) => navigate(`/?date=${data.rawDate}`)}
                          className="cursor-pointer"
                        />
                        <Bar
                          dataKey="proteinPct"
                          name="Protein"
                          stackId="macros"
                          fill={CHART_COLORS.protein}
                          radius={[2, 2, 0, 0]}
                          onClick={(data) => navigate(`/?date=${data.rawDate}`)}
                          className="cursor-pointer"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* NEW: Combined Calories + Macros Chart (Experimental) */}
            <Card className="border-0 shadow-none">
              <CardHeader className="p-2 pb-1">
                <ChartTitle>Combined Calories + Macros</ChartTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: getFoodChartMarginTop(chartData.length), right: 0, left: 0, bottom: 0 }}>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 8 }}
                        stroke="hsl(var(--muted-foreground))"
                        interval="preserveStartEnd"
                        tickMargin={2}
                        height={16}
                      />
                      <Tooltip
                        content={
                          <CompactTooltip 
                            formatter={(value, name) => `${name}: ${Math.round(value)} cal`}
                            totalKey="calories"
                            totalLabel="Calories"
                            totalColor={CHART_COLORS.calories}
                          />
                        }
                        offset={20}
                        cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                      />
                      {/* Stacked bars - first rendered = bottom */}
                      <Bar 
                        dataKey="fatCals" 
                        name="Fat" 
                        stackId="macroCals" 
                        fill={CHART_COLORS.fat}
                        onClick={(data) => navigate(`/?date=${data.rawDate}`)}
                        className="cursor-pointer"
                      />
                      <Bar 
                        dataKey="carbsCals" 
                        name="Carbs" 
                        stackId="macroCals" 
                        fill={CHART_COLORS.carbs}
                        onClick={(data) => navigate(`/?date=${data.rawDate}`)}
                        className="cursor-pointer"
                      />
                      <Bar
                        dataKey="proteinCals"
                        name="Protein"
                        stackId="macroCals"
                        fill={CHART_COLORS.protein}
                        radius={[2, 2, 0, 0]}
                        onClick={(data) => navigate(`/?date=${data.rawDate}`)}
                        className="cursor-pointer"
                      >
                        {/* Total calories label above the stack - uses existing showLabel threshold logic */}
                        <LabelList dataKey="calories" content={createFoodLabelRenderer(chartData, CHART_COLORS.calories, getFoodLabelOffsetPx(chartData.length))} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Row 2: Protein + Carbs + Fat */}
            <div className="grid grid-cols-3 gap-3">
              {charts.slice(1).map(({ key, label, color }) => (
                <Card key={key} className="border-0 shadow-none">
                  <CardHeader className="p-2 pb-1">
                    <ChartTitle>{label}</ChartTitle>
                  </CardHeader>
                  <CardContent className="p-2 pt-0">
                    <div className="h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: getFoodChartMarginTop(chartData.length), right: 0, left: 0, bottom: 0 }}>
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 8 }}
                            stroke="hsl(var(--muted-foreground))"
                            interval="preserveStartEnd"
                            tickMargin={2}
                            height={16}
                          />
                          <Tooltip
                            content={<CompactTooltip />}
                            offset={20}
                            cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                          />
                          <Bar 
                            dataKey={key} 
                            fill={color} 
                            radius={[2, 2, 0, 0]}
                            onClick={(data) => navigate(`/?date=${data.rawDate}`)}
                            className="cursor-pointer"
                          >
                            <LabelList dataKey={key} content={createFoodLabelRenderer(chartData, color, getFoodLabelOffsetPx(chartData.length))} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* Weight Trends Section */}
      {showWeights && (
        <CollapsibleSection title="Weights Trends" icon={Dumbbell} defaultOpen={true}>
          {weightLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : weightExercises.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No weight training data for this period</div>
          ) : (
            <div className="space-y-3">
              {/* Total Volume Chart */}
              {volumeByDay.length > 0 && (
                <Card className="border-0 shadow-none">
                  <CardHeader className="p-2 pb-1">
                    <ChartTitle>Total Volume ({settings.weightUnit})</ChartTitle>
                  </CardHeader>
                  <CardContent className="p-2 pt-0">
                    <div className="h-24">
                      <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={volumeByDay} margin={{ top: 12, right: 0, left: 0, bottom: 0 }}>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 8 }}
                          stroke="hsl(var(--muted-foreground))"
                          interval="preserveStartEnd"
                          tickMargin={2}
                          height={16}
                        />
                        <Tooltip
                          content={
                            <CompactTooltip
                              formatter={(value: number) => `${value.toLocaleString()} ${settings.weightUnit}`}
                            />
                          }
                          offset={20}
                          cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                        />
                        <Bar 
                          dataKey="volume" 
                          fill={CHART_COLORS.trainingVolume} 
                          radius={[2, 2, 0, 0]}
                          onClick={(data) => navigate(`/weights?date=${data.rawDate}`)}
                          className="cursor-pointer"
                        >
                          <LabelList 
                            dataKey="label" 
                            content={(props: any) => {
                              const { x, y, width, value, index } = props;
                              const dataPoint = volumeByDay[index];
                              if (!dataPoint?.showLabel) return null;
                              if (!value || typeof x !== 'number' || typeof width !== 'number') return null;
                              
                              return (
                                <text
                                  x={x + width / 2}
                                  y={y - 4}
                                  fill={CHART_COLORS.trainingVolume}
                                  textAnchor="middle"
                                  fontSize={7}
                                  fontWeight={500}
                                >
                                  {value}
                                </text>
                              );
                            }}
                          />
                        </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Duplicate exercise prompt */}
              {duplicateGroups.length > 0 && (
                <DuplicateExercisePrompt
                  groups={duplicateGroups}
                  onMerge={handleMerge}
                  onDismissGroup={handleDismissGroup}
                  isPending={mergeMutation.isPending}
                />
              )}

              {/* Top 25 exercises in 2-column grid */}
              <div className="grid grid-cols-2 gap-3">
                {top25Exercises.map((exercise) => (
                  <ExerciseChart 
                    key={exercise.exercise_key} 
                    exercise={exercise} 
                    unit={settings.weightUnit}
                    onBarClick={handleExerciseBarClick}
                  />
                ))}
              </div>

              {/* Dropdown for remaining exercises */}
              {remainingExercises.length > 0 && (
                <div className="space-y-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        {selectedExtra ? selectedExtra.description : "More exercises..."}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-1 bg-popover z-50">
                      <div className="flex flex-col gap-1">
                        {remainingExercises.map((ex) => (
                          <Button
                            key={ex.exercise_key}
                            variant="ghost"
                            size="sm"
                            className="justify-start"
                            onClick={() => setExtraExercise(ex.exercise_key)}
                          >
                            {ex.description}
                            <span className="ml-auto text-muted-foreground text-xs">{ex.sessionCount} sessions</span>
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Show selected extra exercise chart */}
                  {selectedExtra && (
                    <ExerciseChart 
                      exercise={selectedExtra} 
                      unit={settings.weightUnit}
                      onBarClick={handleExerciseBarClick}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </CollapsibleSection>
      )}
    </div>
  );
};

export default Trends;
