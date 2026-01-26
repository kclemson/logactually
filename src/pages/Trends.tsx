import { useState, useMemo } from 'react';
import { format, subDays, startOfDay } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const periods = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

const Trends = () => {
  const [selectedPeriod, setSelectedPeriod] = useState(7);

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

    return Object.entries(byDate).map(([date, totals]) => ({
      date: format(new Date(date), 'MMM d'),
      ...totals,
    }));
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
    { key: 'calories', label: 'Calories', color: 'hsl(var(--primary))' },
    { key: 'protein', label: 'Protein (g)', color: 'hsl(142 76% 36%)' },
    { key: 'carbs', label: 'Carbs (g)', color: 'hsl(38 92% 50%)' },
    { key: 'fat', label: 'Fat (g)', color: 'hsl(346 77% 49%)' },
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {charts.map(({ key, label }) => (
          <Card key={key} className="text-center">
            <CardContent className="p-4">
              <p className="text-title">
                {averages[key as keyof typeof averages]}
              </p>
              <p className="text-muted-foreground">
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
        <div className="space-y-6">
          {/* Stacked Macros Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-semibold">Macros Breakdown (g)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                      width={35}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: 12 }}
                      iconSize={10}
                    />
                    <Bar
                      dataKey="carbs"
                      name="Carbs"
                      stackId="macros"
                      fill="hsl(38 92% 50%)"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="protein"
                      name="Protein"
                      stackId="macros"
                      fill="hsl(142 76% 36%)"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="fat"
                      name="Fat"
                      stackId="macros"
                      fill="hsl(346 77% 49%)"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {charts.map(({ key, label, color }) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardTitle className="font-semibold">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        stroke="hsl(var(--muted-foreground))"
                        width={35}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
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
      )}
    </div>
  );
};

export default Trends;
