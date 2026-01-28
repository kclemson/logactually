import { useState, useMemo } from 'react';
import { format, subDays, startOfDay } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { Card, CardContent, CardHeader, ChartTitle, ChartSubtitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, Dumbbell, ChevronDown } from 'lucide-react';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { FEATURES } from '@/lib/feature-flags';
import { useWeightTrends, ExerciseTrend, WeightPoint } from '@/hooks/useWeightTrends';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const CompactTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="rounded-md border border-border bg-card px-2 py-1 shadow-sm">
      <p className="text-[10px] font-medium text-foreground mb-0.5">{label}</p>
      {payload.map((entry: any, index: number) => {
        const displayValue = formatter 
          ? formatter(entry.value, entry.name, entry, index, entry.payload)
          : `${entry.name}: ${Math.round(entry.value)}`;
        return (
          <p 
            key={entry.dataKey || index} 
            className="text-[10px]"
            style={{ color: entry.color }}
          >
            {Array.isArray(displayValue) ? displayValue[0] : displayValue}
          </p>
        );
      })}
    </div>
  );
};

const periods = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

const renderGroupedLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  
  if (!value || typeof x !== 'number' || typeof width !== 'number') return null;
  
  const centerX = x + width / 2;
  
  // Parse the label "3×10×160" into parts
  const parts = value.split('×');
  if (parts.length !== 3) return null;
  
  const [sets, reps, weight] = parts;
  
  // Weight label appears ABOVE the bar in purple
  const weightY = y - 4;
  
  // Sets×reps inside the bar (stacked: "3", "×", "10")
  const insideLines = [sets, '×', reps];
  const lineHeight = 8;
  const totalTextHeight = insideLines.length * lineHeight;
  const startY = y + ((height || 0) - totalTextHeight) / 2 + lineHeight / 2;
  
  return (
    <g>
      {/* Weight label above bar - purple color matching bar */}
      <text
        x={centerX}
        y={weightY}
        fill="hsl(262 83% 58%)"
        textAnchor="middle"
        fontSize={7}
        fontWeight={500}
      >
        {weight}
      </text>
      
      {/* Sets×reps inside bar - white color */}
      <text
        x={centerX}
        fill="#FFFFFF"
        textAnchor="middle"
        fontSize={7}
        fontWeight={500}
      >
        {insideLines.map((line, i) => (
          <tspan
            key={i}
            x={centerX}
            y={startY + i * lineHeight}
          >
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};

const ExerciseChart = ({ exercise }: { exercise: ExerciseTrend }) => {
  const chartData = useMemo(() => {
    return exercise.weightData.map((d) => ({
      ...d,
      dateLabel: format(new Date(`${d.date}T12:00:00`), 'MMM d'),
      label: `${d.sets}×${d.reps}×${d.weight}`,
    }));
  }, [exercise.weightData]);

  return (
    <Card>
      <CardHeader className="p-2 pb-1">
        <div className="flex flex-col gap-0.5">
          <ChartTitle className="truncate">{exercise.description}</ChartTitle>
          <ChartSubtitle>Max: {exercise.maxWeight} lbs</ChartSubtitle>
        </div>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 12, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 8 }}
                stroke="hsl(var(--muted-foreground))"
                interval="preserveStartEnd"
              />
              <Tooltip
                content={<CompactTooltip formatter={(value: number, name: string) => 
                  name === 'weight' ? `${value} lbs` : value
                } />}
                offset={20}
                cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
              />
              <Bar
                dataKey="weight"
                fill="hsl(262 83% 58%)"
                radius={[2, 2, 0, 0]}
              >
                <LabelList dataKey="label" content={renderGroupedLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const Trends = () => {
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [extraExercise, setExtraExercise] = useState<string | null>(null);
  const { data: isAdmin } = useIsAdmin();
  const showWeights = FEATURES.WEIGHT_TRACKING || isAdmin;

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['food-entries-trends', selectedPeriod],
    queryFn: async () => {
      const startDate = format(
        subDays(startOfDay(new Date()), selectedPeriod - 1),
        'yyyy-MM-dd'
      );

      const { data, error } = await supabase
        .from('food_entries')
        .select('eaten_date, total_calories, total_protein, total_carbs, total_fat')
        .gte('eaten_date', startDate)
        .order('eaten_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Weight trends query
  const { data: weightExercises = [], isLoading: weightLoading } = useWeightTrends(selectedPeriod);

  // Split into top 6 and remaining
  const top6Exercises = weightExercises.slice(0, 6);
  const remainingExercises = weightExercises.slice(6);
  const selectedExtra = remainingExercises.find(e => e.exercise_key === extraExercise);

  // Aggregate by date
  const chartData = useMemo(() => {
    const byDate: Record<
      string,
      { calories: number; protein: number; carbs: number; fat: number }
    > = {};

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

    return Object.entries(byDate).map(([date, totals]) => {
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
        date: format(new Date(`${date}T12:00:00`), 'MMM d'),
        ...totals,
        proteinPct,
        carbsPct,
        fatPct,
      };
    });
  }, [entries]);

  // Calculate averages
  const averages = useMemo(() => {
    if (chartData.length === 0)
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };

    const sum = chartData.reduce(
      (acc, day) => ({
        calories: acc.calories + day.calories,
        protein: acc.protein + day.protein,
        carbs: acc.carbs + day.carbs,
        fat: acc.fat + day.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      calories: Math.round(sum.calories / chartData.length),
      protein: Math.round(sum.protein / chartData.length),
      carbs: Math.round(sum.carbs / chartData.length),
      fat: Math.round(sum.fat / chartData.length),
    };
  }, [chartData]);

  const charts = [
    { key: 'calories', label: 'Calories', color: '#0033CC' },
    { key: 'protein', label: 'Protein (g)', color: '#43EBD7' },
    { key: 'carbs', label: 'Carbs (g)', color: '#9933FF' },
    { key: 'fat', label: 'Fat (g)', color: '#00CCFF' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2">
        {periods.map(({ label, days }) => (
          <Button
            key={days}
            variant={selectedPeriod === days ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(days)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Food Trends Section */}
      <CollapsibleSection title="Food Trends" icon={UtensilsCrossed} defaultOpen={true}>
        <div className="grid grid-cols-4 gap-2">
          {charts.map(({ key, label }) => (
            <Card key={key} className="text-center">
              <CardContent className="p-2">
                <p className="text-base font-semibold">
                  {averages[key as keyof typeof averages]}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Avg {label.split(' ')[0]}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No data for this period
          </div>
        ) : (
          <div className="space-y-3">
            {/* Row 1: Calories + Macros Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              {/* Calories Chart */}
              <Card>
                <CardHeader className="p-2 pb-1">
                  <ChartTitle>Calories</ChartTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0">
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 8 }}
                          stroke="hsl(var(--muted-foreground))"
                          interval="preserveStartEnd"
                        />
                        <Tooltip
                          content={<CompactTooltip />}
                          offset={20}
                          cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                        />
                        <Bar dataKey="calories" fill="#0033CC" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Macro Split Chart (100% stacked by calorie %) */}
              <Card>
                <CardHeader className="p-2 pb-1">
                  <ChartTitle>Macro Split (%)</ChartTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0">
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 8 }}
                          stroke="hsl(var(--muted-foreground))"
                          interval="preserveStartEnd"
                        />
                        <Tooltip
                          content={<CompactTooltip formatter={(value, name) => 
                            `${name}: ${value}%`
                          } />}
                          offset={20}
                          cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                        />
                        <Bar dataKey="proteinPct" name="Protein" stackId="macros" fill="#43EBD7" />
                        <Bar dataKey="carbsPct" name="Carbs" stackId="macros" fill="#9933FF" />
                        <Bar dataKey="fatPct" name="Fat" stackId="macros" fill="#00CCFF" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 2: Protein + Carbs + Fat */}
            <div className="grid grid-cols-3 gap-3">
              {charts.slice(1).map(({ key, label, color }) => (
                <Card key={key}>
                  <CardHeader className="p-2 pb-1">
                    <ChartTitle>{label}</ChartTitle>
                  </CardHeader>
                  <CardContent className="p-2 pt-0">
                    <div className="h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 8 }}
                            stroke="hsl(var(--muted-foreground))"
                            interval="preserveStartEnd"
                          />
                          <Tooltip
                            content={<CompactTooltip />}
                            offset={20}
                            cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                          />
                          <Bar
                            dataKey={key}
                            fill={color}
                            radius={[2, 2, 0, 0]}
                          />
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
        <CollapsibleSection title="Weight Trends" icon={Dumbbell} defaultOpen={true}>
          {weightLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : weightExercises.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No weight training data for this period
            </div>
          ) : (
            <div className="space-y-3">
              {/* Top 6 exercises in 2-column grid */}
              <div className="grid grid-cols-2 gap-3">
                {top6Exercises.map(exercise => (
                  <ExerciseChart key={exercise.exercise_key} exercise={exercise} />
                ))}
              </div>

              {/* Dropdown for remaining exercises */}
              {remainingExercises.length > 0 && (
                <div className="space-y-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        {selectedExtra ? selectedExtra.description : 'More exercises...'}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-1 bg-popover z-50">
                      <div className="flex flex-col gap-1">
                        {remainingExercises.map(ex => (
                          <Button
                            key={ex.exercise_key}
                            variant="ghost"
                            size="sm"
                            className="justify-start"
                            onClick={() => setExtraExercise(ex.exercise_key)}
                          >
                            {ex.description}
                            <span className="ml-auto text-muted-foreground text-xs">
                              {ex.sessionCount} sessions
                            </span>
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Show selected extra exercise chart */}
                  {selectedExtra && (
                    <ExerciseChart exercise={selectedExtra} />
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
