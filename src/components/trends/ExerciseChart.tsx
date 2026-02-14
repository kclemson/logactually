import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { Card, CardContent, CardHeader, ChartTitle, ChartSubtitle } from "@/components/ui/card";
import { CompactChartTooltip } from "@/components/trends/CompactChartTooltip";
import { useHasHover } from "@/hooks/use-has-hover";
import { getMuscleGroupDisplayWithTooltip, hasDistanceTracking } from "@/lib/exercise-metadata";
import { formatDurationMmSs } from "@/lib/weight-units";
import { type ExerciseTrend } from "@/hooks/useWeightTrends";
import { type WeightUnit } from "@/lib/weight-units";
import { getExerciseLabelInterval } from "@/lib/chart-label-interval";
import { cn } from "@/lib/utils";

const LBS_TO_KG = 0.453592;

function formatWalkingDuration(minutes: number): string {
  const rounded = Math.round(minutes);
  if (rounded >= 60) {
    const h = Math.floor(rounded / 60);
    const m = rounded % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
  }
  return `${rounded}`;
}

interface ExerciseChartProps {
  exercise: ExerciseTrend;
  unit: WeightUnit;
  onBarClick: (date: string) => void;
}

export const ExerciseChart = ({ exercise, unit, onBarClick }: ExerciseChartProps) => {
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
    
    const saved = localStorage.getItem(`trends-cardio-mode-${exercise.exercise_key}`);
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
    const sourceData = (cardioMode === 'mph' || cardioMode === 'distance')
      ? exercise.weightData.filter(d => d.distance_miles && d.distance_miles > 0)
      : exercise.weightData;
    
    const dataLength = sourceData.length;
    const labelInterval = getExerciseLabelInterval(dataLength);

    return sourceData.map((d, index) => {
      const displayWeight = unit === "kg" ? Math.round(d.weight * LBS_TO_KG) : d.weight;
      const mph = d.distance_miles && d.duration_minutes 
        ? Number((d.distance_miles / (d.duration_minutes / 60)).toFixed(1))
        : null;
      const pace = d.distance_miles && d.duration_minutes
        ? Number((d.duration_minutes / d.distance_miles).toFixed(1))
        : null;
      
      const distanceFromEnd = dataLength - 1 - index;
      
      const cardioLabel = cardioMode === 'mph' 
        ? `${mph}` 
        : cardioMode === 'distance'
          ? `${Number(d.distance_miles || 0).toFixed(2)}`
          : isWalking
            ? formatWalkingDuration(Number(d.duration_minutes || 0))
            : `${Number(d.duration_minutes || 0).toFixed(1)}`;
      
      return {
        ...d,
        rawDate: d.date,
        weight: displayWeight,
        dateLabel: format(new Date(`${d.date}T12:00:00`), "MMM d"),
        mph,
        pace,
        label: isCardio ? cardioLabel : 
          d.repsPerSet !== undefined 
            ? `${d.sets}×${d.repsPerSet}×${displayWeight}`
            : `1×${d.reps}×${displayWeight}`,
        showLabel: distanceFromEnd % labelInterval === 0,
      };
    });
  }, [exercise.weightData, unit, isCardio, cardioMode]);

  const maxWeightDisplay = unit === "kg" ? Math.round(exercise.maxWeight * LBS_TO_KG) : exercise.maxWeight;

  const renderWeightLabel = (props: any) => {
    const { x, y, width, height, value, index } = props;

    const dataPoint = chartData[index];
    if (!dataPoint?.showLabel) return null;

    if (!value || typeof x !== "number" || typeof width !== "number") return null;

    const centerX = x + width / 2;

    const parts = value.split("×");
    if (parts.length !== 3) return null;

    const [sets, reps, weight] = parts;

    const weightY = y - 4;

    const insideLines = [sets, "×", reps];
    const lineHeight = 8;
    const totalTextHeight = insideLines.length * lineHeight;
    const startY = y + ((height || 0) - totalTextHeight) / 2 + lineHeight / 2;

    return (
      <g>
        <text x={centerX} y={weightY} fill="hsl(262 83% 58%)" textAnchor="middle" fontSize={7} fontWeight={500}>
          {weight}
        </text>
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
                    <CompactChartTooltip
                      isTouchDevice={isTouchDevice}
                      onGoToDay={handleGoToDay}
                      rawDate={activeBarIndex !== null ? chartData[activeBarIndex]?.rawDate : undefined}
                      formatter={(value: number, name: string, entry: any) => {
                        if (isCardio) {
                          const duration = formatDurationMmSs(Number(entry.payload.duration_minutes || 0));
                          const distance = entry.payload.distance_miles;
                          const mph = entry.payload.mph;
                          const paceDecimal = entry.payload.pace;
                          
                          if (distance && mph && paceDecimal) {
                            const paceFormatted = formatDurationMmSs(paceDecimal);
                            return [
                              `${paceFormatted} /mi`,
                              `${mph} mph`,
                              `${Number(distance).toFixed(2)} mi in ${duration}`
                            ];
                          }
                          
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
