import { useState, useMemo, useCallback, useEffect } from "react";
import { AskTrendsAIDialog } from "@/components/AskTrendsAIDialog";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfDay } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { Card, CardContent, CardHeader, ChartTitle, ChartSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Dumbbell } from "lucide-react";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { FEATURES } from "@/lib/feature-flags";
import { useWeightTrends, ExerciseTrend } from "@/hooks/useWeightTrends";
import { useIsAdmin } from "@/hooks/useIsAdmin";

import { useUserSettings } from "@/hooks/useUserSettings";
import { type WeightUnit, formatDurationMmSs } from "@/lib/weight-units";
import { useMergeExercises } from "@/hooks/useMergeExercises";
import { DuplicateExercisePrompt, type DuplicateGroup } from "@/components/DuplicateExercisePrompt";
import { getMuscleGroupDisplayWithTooltip, hasDistanceTracking } from "@/lib/exercise-metadata";
import { cn } from "@/lib/utils";

function formatWalkingDuration(minutes: number): string {
  const rounded = Math.round(minutes);
  if (rounded >= 60) {
    const h = Math.floor(rounded / 60);
    const m = rounded % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
  }
  return `${rounded}`;
}
import { useHasHover } from "@/hooks/use-has-hover";
import { FoodChart, StackedMacroChart, VolumeChart } from "@/components/trends/FoodChart";
import { CalorieBurnChart } from "@/components/trends/CalorieBurnChart";
import { useDailyCalorieBurn } from "@/hooks/useDailyCalorieBurn";

// Chart color palette (hex RGB format for easy editing)
const CHART_COLORS = {
  calories: "#2563EB",
  protein: "#115E83",
  carbs: "#00B4D8",
  fat: "#90E0EF",
  trainingVolume: "hsl(262 83% 58%)",
  calorieBurn: "#2563EB", // Same blue as calories chart
} as const;

const CompactTooltip = ({ 
  active, 
  payload, 
  label, 
  formatter, 
  totalKey, 
  totalLabel, 
  totalColor,
  // Touch device props
  isTouchDevice,
  onGoToDay,
  rawDate,
}: any) => {
  if (!active || !payload?.length) return null;

  // Get total from the first payload item's data if totalKey is provided
  const totalValue = totalKey && payload[0]?.payload?.[totalKey];

  return (
    <div className="rounded-md border border-border/50 bg-white dark:bg-slate-800 px-2 py-1 shadow-md">
      <p className="text-[10px] font-medium text-slate-900 dark:text-slate-100 mb-0.5">{label}</p>
      {totalValue !== undefined && (
        <p className="text-[10px] font-semibold mb-0.5" style={{ color: totalColor || '#2563EB' }}>
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
          
          // Handle array returns for multi-line display
          if (Array.isArray(displayValue)) {
            return displayValue.map((line: string, lineIndex: number) => (
              <p key={`${entry.dataKey || index}-${lineIndex}`} className="text-[10px]" style={{ color: entry.color }}>
                {line}
              </p>
            ));
          }
          
          return (
            <p key={entry.dataKey || index} className="text-[10px]" style={{ color: entry.color }}>
              {displayValue}
            </p>
          );
        })}
      {/* Touch device "Go to day" button */}
      {isTouchDevice && onGoToDay && rawDate && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onGoToDay(rawDate);
          }}
          className="mt-1.5 w-full text-left text-[10px] text-primary hover:underline"
        >
          Go to day →
        </button>
      )}
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
  const isTouchDevice = !useHasHover();
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  
  // Detect cardio exercise: has duration or distance data and no meaningful weight
  const isCardio = exercise.maxWeight === 0 && (exercise.maxDuration > 0 || exercise.maxDistance > 0);
  
  // Speed toggle for distance-based exercises (walk_run, cycling)
  const supportsSpeedToggle = isCardio && hasDistanceTracking(exercise.exercise_key);
  
  type CardioViewMode = 'time' | 'mph' | 'distance';
  const isWalking = exercise.exercise_subtype === 'walking';
  
  const [cardioMode, setCardioMode] = useState<CardioViewMode>(() => {
    if (!supportsSpeedToggle) return 'time';
    
    // Check for new key first
    const saved = localStorage.getItem(`trends-cardio-mode-${exercise.exercise_key}`);
    // Walking doesn't support mph mode — fall back to 'time'
    if (saved === 'mph' && isWalking) return 'time';
    if (saved === 'mph' || saved === 'distance') return saved;
    
    // Migration: convert old boolean to new mode
    const legacyMph = localStorage.getItem(`trends-mph-${exercise.exercise_key}`);
    if (legacyMph === 'true') {
      localStorage.removeItem(`trends-mph-${exercise.exercise_key}`);
      if (!isWalking) {
        localStorage.setItem(`trends-cardio-mode-${exercise.exercise_key}`, 'mph');
        return 'mph';
      }
    }
    
    return 'time';
  });

  // Reset active bar when chart data changes (e.g., mode toggle)
  useEffect(() => {
    setActiveBarIndex(null);
  }, [cardioMode]);

  const handleBarClick = (data: any, index: number) => {
    if (isTouchDevice) {
      // Toggle: tap same bar to close, different bar to switch
      setActiveBarIndex(prev => prev === index ? null : index);
    } else {
      onBarClick(data.rawDate);
    }
  };

  const handleGoToDay = (date: string) => {
    setActiveBarIndex(null);
    onBarClick(date);
  };
  
  const chartData = useMemo(() => {
    // For mph/distance modes, filter to only entries with distance data
    const sourceData = (cardioMode === 'mph' || cardioMode === 'distance')
      ? exercise.weightData.filter(d => d.distance_miles && d.distance_miles > 0)
      : exercise.weightData;
    
    const dataLength = sourceData.length;
    // Calculate how often to show labels based on column count
    // Extended thresholds for high-density views (35+ data points)
    const labelInterval = 
      dataLength <= 12 ? 1 : 
      dataLength <= 20 ? 2 : 
      dataLength <= 35 ? 4 :
      dataLength <= 50 ? 6 : 
      dataLength <= 70 ? 10 : 
      dataLength <= 90 ? 15 : 20;

    return sourceData.map((d, index) => {
      const displayWeight = unit === "kg" ? Math.round(d.weight * LBS_TO_KG) : d.weight;
      // Calculate mph: distance / (duration / 60), pace: duration / distance
      const mph = d.distance_miles && d.duration_minutes 
        ? Number((d.distance_miles / (d.duration_minutes / 60)).toFixed(1))
        : null;
      const pace = d.distance_miles && d.duration_minutes
        ? Number((d.duration_minutes / d.distance_miles).toFixed(1))
        : null;
      
      // Count from right (end) to prioritize recent data - rightmost column always labeled
      const distanceFromEnd = dataLength - 1 - index;
      
      // Label based on cardio mode: time shows duration, mph shows speed, distance shows miles
      const cardioLabel = cardioMode === 'mph' 
        ? `${mph}` 
        : cardioMode === 'distance'
          ? `${Number(d.distance_miles || 0).toFixed(2)}`
          : isWalking
            ? formatWalkingDuration(Number(d.duration_minutes || 0))
            : `${Number(d.duration_minutes || 0).toFixed(1)}`;
      
      return {
        ...d,
        rawDate: d.date, // Keep original date for navigation
        weight: displayWeight,
        dateLabel: format(new Date(`${d.date}T12:00:00`), "MMM d"),
        mph,
        pace,
        // For weight exercises: "3×10×135" (uniform reps) or "1×22×135" (varying reps); for cardio: mode-dependent label
        label: isCardio ? cardioLabel : 
          d.repsPerSet !== undefined 
            ? `${d.sets}×${d.repsPerSet}×${displayWeight}`  // Uniform: "3×10×135"
            : `1×${d.reps}×${displayWeight}`,               // Varying: "1×22×135"
        // Show label using right-to-left counting (distance 0 = rightmost column)
        showLabel: distanceFromEnd % labelInterval === 0,
      };
    });
  }, [exercise.weightData, unit, isCardio, cardioMode]);

  const maxWeightDisplay = unit === "kg" ? Math.round(exercise.maxWeight * LBS_TO_KG) : exercise.maxWeight;

  // Label renderer for WEIGHT exercises with closure access to chartData for showLabel lookup
  const renderWeightLabel = (props: any) => {
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

  // Simple label renderer for CARDIO exercises (duration or mph)
  const renderCardioLabel = (props: any) => {
    const { x, y, width, value, index } = props;

    const dataPoint = chartData[index];
    if (!dataPoint?.showLabel) return null;

    if (!value || typeof x !== "number" || typeof width !== "number") return null;

    const centerX = x + width / 2;

    return (
      <text x={centerX} y={y - 4} fill="hsl(262 83% 58%)" textAnchor="middle" fontSize={7} fontWeight={500}>
        {value}
      </text>
    );
  };

  const handleHeaderClick = supportsSpeedToggle 
    ? () => {
        const nextMode: CardioViewMode = 
          isWalking
            ? (cardioMode === 'time' ? 'distance' : 'time')
            : (cardioMode === 'time' ? 'mph' : cardioMode === 'mph' ? 'distance' : 'time');
        localStorage.setItem(`trends-cardio-mode-${exercise.exercise_key}`, nextMode);
        setCardioMode(nextMode);
      }
    : undefined;

  return (
    <Card className="border-0 shadow-none relative">
      {/* Click-away overlay to dismiss tooltip on touch devices */}
      {isTouchDevice && activeBarIndex !== null && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setActiveBarIndex(null)}
        />
      )}
      
      <div className="relative z-20">
        <CardHeader 
          className={cn("p-2 pb-1", supportsSpeedToggle && "cursor-pointer")}
          onClick={handleHeaderClick}
        >
          <div className="flex flex-col gap-0.5">
            <ChartTitle className="truncate">{exercise.description}</ChartTitle>
            <ChartSubtitle>
              {supportsSpeedToggle ? (
                <>Cardio · {cardioMode} <span className="opacity-50">▾</span></>
              ) : isCardio ? (
                <>Cardio</>
              ) : (
                <>
                  Max: {maxWeightDisplay} {unit}
                  {(() => {
                    const muscleInfo = getMuscleGroupDisplayWithTooltip(exercise.exercise_key);
                    if (!muscleInfo) return null;
                    return (
                      <span title={muscleInfo.full}> · {muscleInfo.display}</span>
                    );
                  })()}
                </>
              )}
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
                  wrapperStyle={{ pointerEvents: 'auto', zIndex: 50 }}
                  active={isTouchDevice ? activeBarIndex !== null : undefined}
                  payload={isTouchDevice && activeBarIndex !== null 
                    ? [{ payload: chartData[activeBarIndex] }] 
                    : undefined}
                  label={isTouchDevice && activeBarIndex !== null 
                    ? chartData[activeBarIndex]?.dateLabel 
                    : undefined}
                  content={
                    <CompactTooltip
                      isTouchDevice={isTouchDevice}
                      onGoToDay={handleGoToDay}
                      rawDate={activeBarIndex !== null ? chartData[activeBarIndex]?.rawDate : undefined}
                      formatter={(value: number, name: string, entry: any) => {
                        if (isCardio) {
                          const duration = formatDurationMmSs(Number(entry.payload.duration_minutes || 0));
                          const distance = entry.payload.distance_miles;
                          const mph = entry.payload.mph;
                          const paceDecimal = entry.payload.pace;
                          
                          // Show 3-row format when we have distance data
                          if (distance && mph && paceDecimal) {
                            const paceFormatted = formatDurationMmSs(paceDecimal);
                            return [
                              `${paceFormatted} /mi`,           // Pace in mm:ss
                              `${mph} mph`,                      // Speed
                              `${Number(distance).toFixed(2)} mi in ${duration}`   // Distance + Time combined
                            ];
                          }
                          
                          // Fallback for cardio without distance (e.g., stationary bike with time only)
                          if (distance) {
                            return [duration, `${Number(distance).toFixed(2)} mi`];
                          }
                          return duration;
                        }
                        const { sets, reps, weight, repsPerSet } = entry.payload;
                        return repsPerSet !== undefined
                          ? `${sets} sets × ${repsPerSet} reps @ ${weight} ${unit}`
                          : `${sets} sets, ${reps} total reps @ ${weight} ${unit}`;
                      }}
                    />
                  }
                  offset={20}
                  cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                />
                <Bar 
                  dataKey={isCardio ? (cardioMode === 'mph' ? "mph" : cardioMode === 'distance' ? "distance_miles" : "duration_minutes") : "weight"}
                  fill="hsl(262 83% 58%)" 
                  radius={[2, 2, 0, 0]}
                  onClick={(data, index) => handleBarClick(data, index)}
                  className="cursor-pointer"
                >
                  <LabelList dataKey="label" content={isCardio ? renderCardioLabel : renderWeightLabel} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

const Trends = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const saved = localStorage.getItem("trends-period");
    return saved && [7, 30, 90].includes(Number(saved)) ? Number(saved) : 30;
  });
  const [visibleExerciseCount, setVisibleExerciseCount] = useState(10);
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
  const showWeights = (FEATURES.WEIGHT_TRACKING || isAdmin) && settings.showWeights;
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
        // Skip cardio/bodyweight entries (0 lbs = 0 volume anyway)
        if (point.weight === 0) return;
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
      dataLength <= 35 ? 4 : 
      dataLength <= 50 ? 5 : 
      dataLength <= 70 ? 7 : 10;

    // Full-width charts have ~2x horizontal space
    const labelIntervalFullWidth = 
      dataLength <= 14 ? 1 :
      dataLength <= 28 ? 2 :
      dataLength <= 42 ? 3 :
      dataLength <= 70 ? 4 : 
      dataLength <= 90 ? 5 : 7;

    return entries.map((d, index) => {
      // Count from right (end) to prioritize recent data
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

    return dailyCalorieBurn.map((d) => ({
      rawDate: d.date,
      date: format(new Date(`${d.date}T12:00:00`), "MMM d"),
      low: d.low,
      high: d.high,
      base: d.low,
      band: d.high - d.low,
    }));
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
      dataLength <= 35 ? 4 : 
      dataLength <= 50 ? 5 : 
      dataLength <= 70 ? 7 : 10;

    // Full-width charts have ~2x horizontal space, so use more generous thresholds
    const labelIntervalFullWidth = 
      dataLength <= 14 ? 1 :
      dataLength <= 28 ? 2 :
      dataLength <= 42 ? 3 :
      dataLength <= 70 ? 4 : 
      dataLength <= 90 ? 5 : 7;

    return data.map((d, index) => {
      // Count from right (end) to prioritize recent data
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

  const charts = [
    { key: "calories", label: "Calories", color: CHART_COLORS.calories },
    { key: "protein", label: "Protein", color: CHART_COLORS.protein },
    { key: "carbs", label: "Carbs", color: CHART_COLORS.carbs },
    { key: "fat", label: "Fat", color: CHART_COLORS.fat },
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
      <CollapsibleSection title="Food Trends" icon={UtensilsCrossed} defaultOpen={true} storageKey="trends-food" headerAction={isAdmin ? <button onClick={() => setFoodAIOpen(true)} className="text-xs text-primary hover:underline flex items-center gap-1">Ask AI</button> : undefined}>
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
              <FoodChart
                title={`Calories (avg: ${averages.calories})`}
                chartData={chartData}
                dataKey="calories"
                color={CHART_COLORS.calories}
                onNavigate={(date) => navigate(`/?date=${date}`)}
                referenceLine={settings.dailyCalorieTarget ? { value: settings.dailyCalorieTarget, color: "hsl(var(--muted-foreground))" } : undefined}
              />

              {/* Macro Split Chart (100% stacked by calorie %) */}
              <StackedMacroChart
                title="Macro Split (%)"
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
              referenceLine={settings.dailyCalorieTarget ? { value: settings.dailyCalorieTarget, color: "hsl(var(--muted-foreground))" } : undefined}
            />

            {/* Row 2: Protein + Carbs + Fat */}
            <div className="grid grid-cols-3 gap-3">
              {charts.slice(1).map(({ key, label, color }) => (
                <FoodChart
                  key={key}
                  title={`${label} (avg: ${averages[key as keyof typeof averages]})`}
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
        <CollapsibleSection title="Exercise Trends" icon={Dumbbell} iconClassName="text-[hsl(262_83%_58%)]" defaultOpen={true} storageKey="trends-weights" headerAction={isAdmin ? <button onClick={() => setExerciseAIOpen(true)} className="text-xs text-primary hover:underline flex items-center gap-1">Ask AI</button> : undefined}>
          {weightLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : weightExercises.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No weight training data for this period</div>
          ) : (
            <div className="space-y-3">
              {/* Duplicate exercise prompt */}
              {duplicateGroups.length > 0 && (
                <DuplicateExercisePrompt
                  groups={duplicateGroups}
                  onMerge={handleMerge}
                  onDismissGroup={handleDismissGroup}
                  isPending={mergeMutation.isPending}
                />
              )}

              {/* All exercise charts in a single 2-column grid */}
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
                {calorieBurnChartData.length > 0 && (
                  <CalorieBurnChart
                    title="Estimated Calorie Burn"
                    subtitle="Daily range"
                    chartData={calorieBurnChartData}
                    color={CHART_COLORS.calorieBurn}
                    onNavigate={(date) => navigate(`/weights?date=${date}`)}
                  />
                )}
                {visibleExercises.map((exercise) => (
                  <ExerciseChart 
                    key={exercise.exercise_key} 
                    exercise={exercise} 
                    unit={settings.weightUnit}
                    onBarClick={handleExerciseBarClick}
                  />
                ))}
              </div>

              {/* Show more button */}
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
      <AskTrendsAIDialog mode="food" open={foodAIOpen} onOpenChange={setFoodAIOpen} />
      <AskTrendsAIDialog mode="exercise" open={exerciseAIOpen} onOpenChange={setExerciseAIOpen} />
    </div>
  );
};

export default Trends;
