import { useState, useMemo, useCallback } from "react";
import { AskTrendsAIDialog } from "@/components/AskTrendsAIDialog";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfDay } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, ChartTitle, ChartSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Dumbbell, ClipboardList } from "lucide-react";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { useWeightTrends, ExerciseTrend } from "@/hooks/useWeightTrends";

import { useUserSettings } from "@/hooks/useUserSettings";
import { getEffectiveDailyTarget, ACTIVITY_MULTIPLIERS } from "@/lib/calorie-target";
import { computeAbsoluteBMR } from "@/lib/calorie-burn";
import { useMergeExercises } from "@/hooks/useMergeExercises";
import { DuplicateExercisePrompt, type DuplicateGroup } from "@/components/DuplicateExercisePrompt";

import { FoodChart, StackedMacroChart, VolumeChart } from "@/components/trends/FoodChart";
import { CalorieBurnChart } from "@/components/trends/CalorieBurnChart";
import { ExerciseChart } from "@/components/trends/ExerciseChart";
import { CustomLogTrendChart } from "@/components/trends/CustomLogTrendChart";
import { useDailyCalorieBurn } from "@/hooks/useDailyCalorieBurn";
import { useCustomLogTrends } from "@/hooks/useCustomLogTrends";
import { getLabelInterval, getFullWidthLabelInterval } from "@/lib/chart-label-interval";

// Chart color palette (hex RGB format for easy editing)
const CHART_COLORS = {
  calories: "#2563EB",
  protein: "#115E83",
  carbs: "#00B4D8",
  fat: "#90E0EF",
  trainingVolume: "hsl(262 83% 58%)",
  calorieBurn: "#2563EB",
} as const;

const periods = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

const LBS_TO_KG = 0.453592;

const Trends = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const saved = localStorage.getItem("trends-period");
    return saved && [7, 30, 90].includes(Number(saved)) ? Number(saved) : 30;
  });
  const [visibleExerciseCount, setVisibleExerciseCount] = useState(4);
  const [dismissedDuplicates, setDismissedDuplicates] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("dismissed-duplicate-exercises");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const { settings } = useUserSettings();
  const showWeights = settings.showWeights;
  const mergeMutation = useMergeExercises();
  const [foodAIOpen, setFoodAIOpen] = useState(false);
  const [exerciseAIOpen, setExerciseAIOpen] = useState(false);

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
  const { data: dailyCalorieBurn } = useDailyCalorieBurn(selectedPeriod);
  const { data: customLogTrends = [] } = useCustomLogTrends(selectedPeriod);
  const showCustomLogs = settings.showCustomLogs;

  // Detect duplicate exercises (same description, different keys)
  const duplicateGroups = useMemo((): DuplicateGroup[] => {
    const byDescription = new Map<string, ExerciseTrend[]>();

    weightExercises.forEach((ex) => {
      const normalized = ex.description.toLowerCase().trim();
      const group = byDescription.get(normalized) || [];
      group.push(ex);
      byDescription.set(normalized, group);
    });

    return [...byDescription.entries()]
      .filter(([_, exs]) => exs.length > 1)
      .filter(([description]) => !dismissedDuplicates.includes(description))
      .map(([description, exercises]) => {
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
        if (point.weight === 0) return;
        byDate[point.date] = (byDate[point.date] || 0) + point.volume;
      });
    });

    const data = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, volumeLbs]) => {
        const volume = settings.weightUnit === "kg" 
          ? Math.round(volumeLbs * LBS_TO_KG) 
          : Math.round(volumeLbs);
        return {
          rawDate: date,
          date: format(new Date(`${date}T12:00:00`), "MMM d"),
          volume,
          label: `${Math.round(volume / 1000)}k`,
        };
      });

    const dataLength = data.length;
    const labelInterval = getLabelInterval(dataLength);
    const labelIntervalFullWidth = getFullWidthLabelInterval(dataLength);

    return data.map((d, index) => {
      const distanceFromEnd = dataLength - 1 - index;
      return {
        ...d,
        showLabel: distanceFromEnd % labelInterval === 0,
        showLabelFullWidth: distanceFromEnd % labelIntervalFullWidth === 0,
      };
    });
  }, [weightExercises, settings.weightUnit]);

  // Calorie burn chart data (range bars)
  const calorieBurnChartData = useMemo(() => {
    if (dailyCalorieBurn.length === 0) return [];

    const dataLength = dailyCalorieBurn.length;
    const labelInterval = getLabelInterval(dataLength);

    return dailyCalorieBurn.map((d, index) => {
      const distanceFromEnd = dataLength - 1 - index;
      return {
        rawDate: d.date,
        date: format(new Date(`${d.date}T12:00:00`), "MMM d"),
        low: d.low,
        high: d.high,
        midpoint: Math.round((d.low + d.high) / 2),
        showLabel: distanceFromEnd % labelInterval === 0,
        exerciseCount: d.exerciseCount,
        cardioCount: d.cardioCount,
        strengthCount: d.strengthCount,
      };
    });
  }, [dailyCalorieBurn]);

  // Visible exercises (load more pattern)
  const visibleExercises = weightExercises.slice(0, visibleExerciseCount);
  const hasMoreExercises = weightExercises.length > visibleExerciseCount;

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
      const proteinCals = totals.protein * 4;
      const carbsCals = totals.carbs * 4;
      const fatCals = totals.fat * 9;
      const totalMacroCals = proteinCals + carbsCals + fatCals;

      const proteinPct = totalMacroCals > 0 ? Math.round((proteinCals / totalMacroCals) * 100) : 0;
      const carbsPct = totalMacroCals > 0 ? Math.round((carbsCals / totalMacroCals) * 100) : 0;
      const fatPct = totalMacroCals > 0 ? Math.round((fatCals / totalMacroCals) * 100) : 0;

      return {
        rawDate: date,
        date: format(new Date(`${date}T12:00:00`), "MMM d"),
        ...totals,
        proteinCals,
        carbsCals,
        fatCals,
        proteinPct,
        carbsPct,
        fatPct,
      };
    });

    const dataLength = data.length;
    const labelInterval = getLabelInterval(dataLength);
    const labelIntervalFullWidth = getFullWidthLabelInterval(dataLength);

    return data.map((d, index) => {
      const distanceFromEnd = dataLength - 1 - index;
      return {
        ...d,
        showLabel: distanceFromEnd % labelInterval === 0,
        showLabelFullWidth: distanceFromEnd % labelIntervalFullWidth === 0,
      };
    });
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

  const todayValues = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayEntry = chartData.find(d => d.rawDate === todayStr);
    return {
      protein: Math.round(todayEntry?.protein || 0),
      carbs: Math.round(todayEntry?.carbs || 0),
      fat: Math.round(todayEntry?.fat || 0),
      calories: Math.round(todayEntry?.calories || 0),
    };
  }, [chartData]);

  const charts = [
    { key: "calories", label: "Calories", color: CHART_COLORS.calories },
    { key: "protein", label: "Protein", color: CHART_COLORS.protein },
    { key: "carbs", label: "Carbs", color: CHART_COLORS.carbs },
    { key: "fat", label: "Fat", color: CHART_COLORS.fat },
  ];

  return (
    <div className="space-y-6 -mx-1">
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
      <CollapsibleSection title="Food Trends" icon={UtensilsCrossed} defaultOpen={true} storageKey="trends-food" iconClassName="text-blue-500 dark:text-blue-400" headerAction={<button onClick={() => setFoodAIOpen(true)} className="text-xs text-primary hover:underline flex items-center gap-1">Ask AI</button>}>
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
              <FoodChart
                title="Calories"
                subtitle={`avg: ${averages.calories}, today: ${todayValues.calories}`}
                chartData={chartData}
                dataKey="calories"
                color={CHART_COLORS.calories}
                onNavigate={(date) => navigate(`/?date=${date}`)}
                referenceLine={(() => {
                  const t = getEffectiveDailyTarget(settings);
                  return t ? { value: t, color: "hsl(var(--muted-foreground))" } : undefined;
                })()}
              />

              <StackedMacroChart
                title="Macro Split (%)"
                subtitle={`avg: ${averages.protein}/${averages.carbs}/${averages.fat}, today: ${todayValues.protein}/${todayValues.carbs}/${todayValues.fat}`}
                chartData={chartData}
                bars={[
                  { dataKey: "fatPct", name: "Fat", color: CHART_COLORS.fat },
                  { dataKey: "carbsPct", name: "Carbs", color: CHART_COLORS.carbs },
                  { dataKey: "proteinPct", name: "Protein", color: CHART_COLORS.protein, isTop: true },
                ]}
                onNavigate={(date) => navigate(`/?date=${date}`)}
                formatter={(value, name) => `${name}: ${value}%`}
              />
            </div>

            {/* Combined Calories + Macros Chart */}
            <StackedMacroChart
              title="Combined Calories + Macros"
              chartData={chartData}
              bars={[
                { dataKey: "fatCals", name: "Fat", color: CHART_COLORS.fat },
                { dataKey: "carbsCals", name: "Carbs", color: CHART_COLORS.carbs },
                { dataKey: "proteinCals", name: "Protein", color: CHART_COLORS.protein, isTop: true },
              ]}
              onNavigate={(date) => navigate(`/?date=${date}`)}
              formatter={(value, name) => `${name}: ${Math.round(value)} cal`}
              totalKey="calories"
              totalLabel="Calories"
              totalColor={CHART_COLORS.calories}
              labelDataKey="calories"
              labelColor={CHART_COLORS.calories}
              height="h-28"
              referenceLine={(() => {
                const t = getEffectiveDailyTarget(settings);
                return t ? { value: t, color: "hsl(var(--muted-foreground))" } : undefined;
              })()}
            />

            {/* Row 2: Protein + Carbs + Fat */}
            <div className="grid grid-cols-3 gap-1">
              {charts.slice(1).map(({ key, label, color }) => (
                <FoodChart
                  key={key}
                  title={label}
                  subtitle={`avg: ${averages[key as keyof typeof averages]}, today: ${todayValues[key as keyof typeof todayValues]}`}
                  chartData={chartData}
                  dataKey={key}
                  color={color}
                  onNavigate={(date) => navigate(`/?date=${date}`)}
                />
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* Weight Trends Section */}
      {showWeights && (
        <CollapsibleSection title="Exercise Trends" icon={Dumbbell} iconClassName="text-[hsl(262_83%_58%)]" defaultOpen={true} storageKey="trends-weights" headerAction={<button onClick={() => setExerciseAIOpen(true)} className="text-xs text-primary hover:underline flex items-center gap-1">Ask AI</button>}>
          {weightLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : weightExercises.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No weight training data for this period</div>
          ) : (
            <div className="space-y-3">
              {duplicateGroups.length > 0 && (
                <DuplicateExercisePrompt
                  groups={duplicateGroups}
                  onMerge={handleMerge}
                  onDismissGroup={handleDismissGroup}
                  isPending={mergeMutation.isPending}
                />
              )}

              <div className="grid grid-cols-2 gap-3">
                {volumeByDay.length > 0 && (
                  <VolumeChart
                    title={`Total Volume (${settings.weightUnit})`}
                    subtitle="Across weight exercises"
                    chartData={volumeByDay}
                    color={CHART_COLORS.trainingVolume}
                    unit={settings.weightUnit}
                    onNavigate={(date) => navigate(`/weights?date=${date}`)}
                  />
                )}
                {calorieBurnChartData.length > 0 && (() => {
                  const bmr = computeAbsoluteBMR(settings);
                  const sedentaryTDEE = bmr != null ? Math.round(bmr * ACTIVITY_MULTIPLIERS.sedentary) : null;
                    const subtitle = sedentaryTDEE != null
                      ? `TDEE (excluding exercise): ~${sedentaryTDEE.toLocaleString()}`
                      : "Set bio in Settings for precision";
                  return (
                    <CalorieBurnChart
                      title="Estimated Daily Calorie Burn"
                      subtitle={subtitle}
                      chartData={calorieBurnChartData}
                      color={CHART_COLORS.calorieBurn}
                      onNavigate={(date) => navigate(`/weights?date=${date}`)}
                      sedentaryTDEE={sedentaryTDEE}
                    />
                  );
                })()}
                {visibleExercises.map((exercise) => (
                  <ExerciseChart 
                    key={exercise.exercise_key} 
                    exercise={exercise} 
                    unit={settings.weightUnit}
                    onBarClick={handleExerciseBarClick}
                  />
                ))}
              </div>

              {hasMoreExercises && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setVisibleExerciseCount(prev => prev + 10)}
                >
                  Show more
                </Button>
              )}
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* Other Trends Section */}
      {showCustomLogs && customLogTrends.length > 0 && (
        <CollapsibleSection title="Custom Trends" icon={ClipboardList} iconClassName="text-teal-500 dark:text-teal-400" defaultOpen={true} storageKey="trends-other">
          <div className="grid grid-cols-2 gap-3">
            {customLogTrends.map((trend) => (
              <CustomLogTrendChart key={trend.logTypeId} trend={trend} days={selectedPeriod} onNavigate={(date) => navigate(`/custom?date=${date}`)} />
            ))}
          </div>
        </CollapsibleSection>
      )}
      <AskTrendsAIDialog mode="food" open={foodAIOpen} onOpenChange={setFoodAIOpen} />
      <AskTrendsAIDialog mode="exercise" open={exerciseAIOpen} onOpenChange={setExerciseAIOpen} />
    </div>
  );
};

export default Trends;
