import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays, startOfDay } from 'date-fns';

interface DailyProgress {
  date: string;
  maxWeight: number;
  totalVolume: number;
  totalSets: number;
}

export interface ExerciseTrend {
  exercise_key: string;
  description: string;
  sessionCount: number;
  maxWeight: number;
  dailyData: DailyProgress[];
}

export function useWeightTrends(days: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['weight-trends', days, user?.id],
    queryFn: async (): Promise<ExerciseTrend[]> => {
      if (!user) return [];

      const startDate = format(
        subDays(startOfDay(new Date()), days - 1),
        'yyyy-MM-dd'
      );

      const { data, error } = await supabase
        .from('weight_sets')
        .select('exercise_key, description, sets, reps, weight_lbs, logged_date')
        .gte('logged_date', startDate)
        .order('logged_date', { ascending: true });

      if (error) throw error;

      // Aggregate by exercise_key
      const exerciseMap = new Map<string, ExerciseTrend>();

      (data || []).forEach(row => {
        const key = row.exercise_key;
        const weight = Number(row.weight_lbs);
        const volume = row.sets * row.reps * weight;

        if (!exerciseMap.has(key)) {
          exerciseMap.set(key, {
            exercise_key: key,
            description: row.description,
            sessionCount: 0,
            maxWeight: 0,
            dailyData: [],
          });
        }

        const trend = exerciseMap.get(key)!;
        trend.maxWeight = Math.max(trend.maxWeight, weight);

        // Aggregate by date
        const existing = trend.dailyData.find(d => d.date === row.logged_date);
        if (existing) {
          existing.maxWeight = Math.max(existing.maxWeight, weight);
          existing.totalVolume += volume;
          existing.totalSets += row.sets;
        } else {
          trend.dailyData.push({
            date: row.logged_date,
            maxWeight: weight,
            totalVolume: volume,
            totalSets: row.sets,
          });
        }
      });

      // Count sessions and sort by frequency
      const results = Array.from(exerciseMap.values());
      results.forEach(ex => {
        ex.sessionCount = ex.dailyData.length;
      });

      return results.sort((a, b) => b.sessionCount - a.sessionCount);
    },
    enabled: !!user,
  });
}
