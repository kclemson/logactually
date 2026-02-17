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
  entryCount: number;  // Number of raw DB entries merged into this point
  duration_minutes?: number;  // For cardio exercises
  distance_miles?: number;    // For distance-based cardio (walk_run, cycling)
  repsPerSet?: number;  // undefined if reps vary across sets, number if consistent
  exercise_metadata?: Record<string, number> | null;  // For calorie overrides, incline, effort
}

export interface ExerciseTrend {
  exercise_key: string;
  exercise_subtype?: string | null;
  description: string;
  sessionCount: number;
  maxWeight: number;
  maxDuration: number;  // For cardio exercises
  maxDistance: number;  // Maximum distance in a single session
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
        .select('exercise_key, exercise_subtype, description, sets, reps, weight_lbs, logged_date, duration_minutes, distance_miles, exercise_metadata')
        .gte('logged_date', startDate)
        .order('logged_date', { ascending: true });

      if (error) throw error;

      // Aggregate by exercise_key + exercise_subtype
      const exerciseMap = new Map<string, ExerciseTrend>();

      (data || []).forEach(row => {
        const exerciseKey = row.exercise_key;
        const subtype = row.exercise_subtype || null;
        // Use subtype as part of the map key when present
        const shouldSplitBySubtype = exerciseKey === 'walk_run';
        const mapKey = shouldSplitBySubtype && subtype ? `${exerciseKey}::${subtype}` : exerciseKey;
        const weight = Number(row.weight_lbs);
        const duration = Number(row.duration_minutes) || 0;
        const distance = Number(row.distance_miles) || 0;

        if (!exerciseMap.has(mapKey)) {
          exerciseMap.set(mapKey, {
            exercise_key: exerciseKey,
            exercise_subtype: subtype,
            description: row.description,
            sessionCount: 0,
            maxWeight: 0,
            maxDuration: 0,
            maxDistance: 0,
            weightData: [],
          });
        }

        const trend = exerciseMap.get(mapKey)!;
        trend.maxWeight = Math.max(trend.maxWeight, weight);
        trend.maxDuration = Math.max(trend.maxDuration, duration);
        trend.maxDistance = Math.max(trend.maxDistance, distance);

        // For cardio, aggregate by date only; for weights, aggregate by date + weight
        const isCardio = duration > 0 && weight === 0;
        const existing = trend.weightData.find(
          d => isCardio 
            ? d.date === row.logged_date 
            : (d.date === row.logged_date && d.weight === weight)
        );
        
        // reps is already per-set in the DB, use directly for uniformity tracking
        const rowRepsPerSet = row.reps;
        
        if (existing) {
          existing.entryCount += 1;
          existing.sets += row.sets;
          existing.reps += row.reps;
          existing.volume += row.sets * row.reps * weight;
          existing.duration_minutes = (existing.duration_minutes || 0) + duration;
          existing.distance_miles = (existing.distance_miles || 0) + distance;
          // Merge exercise_metadata: sum calories_burned across aggregated entries
          if (row.exercise_metadata && typeof row.exercise_metadata === 'object') {
            const incoming = row.exercise_metadata as Record<string, number>;
            if (incoming.calories_burned != null) {
              if (!existing.exercise_metadata) {
                existing.exercise_metadata = { calories_burned: incoming.calories_burned };
              } else {
                existing.exercise_metadata = {
                  ...existing.exercise_metadata,
                  calories_burned: (existing.exercise_metadata.calories_burned ?? 0) + incoming.calories_burned,
                };
              }
            }
          }
          // Track reps uniformity: if new reps-per-set differs, mark as undefined
          if (existing.repsPerSet !== undefined && existing.repsPerSet !== rowRepsPerSet) {
            existing.repsPerSet = undefined;
          }
        } else {
          trend.weightData.push({
            date: row.logged_date,
            weight,
            sets: row.sets,
            reps: row.reps,
            volume: row.sets * row.reps * weight,
            entryCount: 1,
            duration_minutes: duration > 0 ? duration : undefined,
            distance_miles: distance > 0 ? distance : undefined,
            repsPerSet: rowRepsPerSet,
            exercise_metadata: row.exercise_metadata as Record<string, number> | null,
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
