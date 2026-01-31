import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays, startOfDay } from 'date-fns';

export interface WeightPoint {
  date: string;
  weight: number;
  sets: number;
  reps: number;
  volume: number;  // Pre-calculated volume for accurate aggregation
  duration_minutes?: number;  // For cardio exercises
}

export interface ExerciseTrend {
  exercise_key: string;
  description: string;
  sessionCount: number;
  maxWeight: number;
  maxDuration: number;  // For cardio exercises
  weightData: WeightPoint[];
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
        .select('exercise_key, description, sets, reps, weight_lbs, logged_date, duration_minutes')
        .gte('logged_date', startDate)
        .order('logged_date', { ascending: true });

      if (error) throw error;

      // Aggregate by exercise_key
      const exerciseMap = new Map<string, ExerciseTrend>();

      (data || []).forEach(row => {
        const exerciseKey = row.exercise_key;
        const weight = Number(row.weight_lbs);
        const duration = Number(row.duration_minutes) || 0;

        if (!exerciseMap.has(exerciseKey)) {
          exerciseMap.set(exerciseKey, {
            exercise_key: exerciseKey,
            description: row.description,
            sessionCount: 0,
            maxWeight: 0,
            maxDuration: 0,
            weightData: [],
          });
        }

        const trend = exerciseMap.get(exerciseKey)!;
        trend.maxWeight = Math.max(trend.maxWeight, weight);
        trend.maxDuration = Math.max(trend.maxDuration, duration);

        // For cardio, aggregate by date only; for weights, aggregate by date + weight
        const isCardio = duration > 0 && weight === 0;
        const compositeKey = isCardio ? row.logged_date : `${row.logged_date}_${weight}`;
        const existing = trend.weightData.find(
          d => isCardio 
            ? d.date === row.logged_date 
            : (d.date === row.logged_date && d.weight === weight)
        );
        if (existing) {
          existing.sets += row.sets;
          existing.reps += row.reps;
          existing.volume += row.sets * row.reps * weight;
          existing.duration_minutes = (existing.duration_minutes || 0) + duration;
        } else {
          trend.weightData.push({
            date: row.logged_date,
            weight,
            sets: row.sets,
            reps: row.reps,
            volume: row.sets * row.reps * weight,
            duration_minutes: duration > 0 ? duration : undefined,
          });
        }
      });

      // Sort weight data by date, then by weight ascending
      const results = Array.from(exerciseMap.values());
      results.forEach(ex => {
        ex.weightData.sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return a.weight - b.weight;
        });
        // Count unique dates as sessions
        const uniqueDates = new Set(ex.weightData.map(d => d.date));
        ex.sessionCount = uniqueDates.size;
      });

      return results.sort((a, b) => b.sessionCount - a.sessionCount);
    },
    enabled: !!user,
  });
}
