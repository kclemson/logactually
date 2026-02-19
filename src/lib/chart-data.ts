// ── Client-side data fetcher for v2 chart pipeline ──────────
// Queries food_entries / weight_sets via the Supabase JS client,
// aggregates into DailyTotals shape that the DSL engine consumes.

import { format, subDays } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type {
  ChartDSL,
  DailyTotals,
  FoodDayTotals,
  ExerciseDayTotals,
  HourlyTotals,
} from "./chart-types";

type TypedClient = SupabaseClient<Database>;

// ── Constants ───────────────────────────────────────────────

const EMPTY_FOOD: FoodDayTotals = {
  cal: 0, protein: 0, carbs: 0, fat: 0,
  fiber: 0, sugar: 0, sat_fat: 0, sodium: 0, chol: 0, entries: 0,
};

const EMPTY_EXERCISE: ExerciseDayTotals = {
  sets: 0, duration: 0, distance: 0, cal_burned: 0, unique_exercises: 0,
};

// ── Public API ──────────────────────────────────────────────

export async function fetchChartData(
  supabase: TypedClient,
  dsl: ChartDSL,
  period: number,
): Promise<DailyTotals> {
  const startDate = format(subDays(new Date(), period), "yyyy-MM-dd");
  const needsHourly = dsl.groupBy === "hourOfDay";

  if (dsl.source === "food") {
    return fetchFoodData(supabase, startDate, needsHourly);
  }
  return fetchExerciseData(supabase, startDate, needsHourly, dsl.filter?.exerciseKey);
}

// ── Food fetcher ────────────────────────────────────────────

async function fetchFoodData(
  supabase: TypedClient,
  startDate: string,
  needsHourly: boolean,
): Promise<DailyTotals> {
  const { data, error } = await supabase
    .from("food_entries")
    .select("eaten_date, food_items, created_at")
    .gte("eaten_date", startDate)
    .order("eaten_date", { ascending: true });

  if (error) throw error;

  const food: Record<string, FoodDayTotals> = {};
  const foodByHour: HourlyTotals<FoodDayTotals> | undefined = needsHourly ? {} : undefined;

  for (const row of data ?? []) {
    const items = row.food_items as any[];
    if (!Array.isArray(items)) continue;

    // Accumulate entry-level totals from individual items
    const entryTotals: FoodDayTotals = { ...EMPTY_FOOD, entries: 1 };
    for (const item of items) {
      entryTotals.cal += item.calories || 0;
      entryTotals.protein += item.protein || 0;
      entryTotals.carbs += item.carbs || 0;
      entryTotals.fat += item.fat || 0;
      entryTotals.fiber += item.fiber || 0;
      entryTotals.sugar += item.sugar || 0;
      entryTotals.sat_fat += item.saturated_fat || 0;
      entryTotals.sodium += item.sodium || 0;
      entryTotals.chol += item.cholesterol || 0;
    }

    // Daily aggregation
    const date = row.eaten_date;
    const existing = food[date] ?? { ...EMPTY_FOOD };
    existing.cal += entryTotals.cal;
    existing.protein += entryTotals.protein;
    existing.carbs += entryTotals.carbs;
    existing.fat += entryTotals.fat;
    existing.fiber += entryTotals.fiber;
    existing.sugar += entryTotals.sugar;
    existing.sat_fat += entryTotals.sat_fat;
    existing.sodium += entryTotals.sodium;
    existing.chol += entryTotals.chol;
    existing.entries += 1;
    food[date] = existing;

    // Hourly aggregation
    if (foodByHour && row.created_at) {
      const hour = new Date(row.created_at).getHours();
      (foodByHour[hour] ??= []).push(entryTotals);
    }
  }

  return { food, exercise: {}, foodByHour };
}

// ── Exercise fetcher ────────────────────────────────────────

async function fetchExerciseData(
  supabase: TypedClient,
  startDate: string,
  needsHourly: boolean,
  exerciseKeyFilter?: string,
): Promise<DailyTotals> {
  let query = supabase
    .from("weight_sets")
    .select("logged_date, exercise_key, sets, duration_minutes, distance_miles, exercise_metadata, created_at")
    .gte("logged_date", startDate)
    .order("logged_date", { ascending: true });

  if (exerciseKeyFilter) {
    query = query.eq("exercise_key", exerciseKeyFilter);
  }

  const { data, error } = await query;
  if (error) throw error;

  const exercise: Record<string, ExerciseDayTotals> = {};
  const exerciseByHour: HourlyTotals<ExerciseDayTotals> | undefined = needsHourly ? {} : undefined;
  const seenKeys: Record<string, Set<string>> = {};

  for (const row of data ?? []) {
    const date = row.logged_date;
    const meta = row.exercise_metadata as Record<string, any> | null;

    const setTotals: ExerciseDayTotals = {
      sets: 1,
      duration: row.duration_minutes ?? 0,
      distance: row.distance_miles ?? 0,
      cal_burned: meta?.calories_burned ?? 0,
      unique_exercises: 0, // computed after
    };

    // Daily aggregation
    const existing = exercise[date] ?? { ...EMPTY_EXERCISE };
    existing.sets += 1;
    existing.duration += setTotals.duration;
    existing.distance += setTotals.distance;
    existing.cal_burned += setTotals.cal_burned;
    // Track unique exercises
    (seenKeys[date] ??= new Set()).add(row.exercise_key);
    existing.unique_exercises = seenKeys[date].size;
    exercise[date] = existing;

    // Hourly aggregation
    if (exerciseByHour && row.created_at) {
      const hour = new Date(row.created_at).getHours();
      (exerciseByHour[hour] ??= []).push(setTotals);
    }
  }

  return { food: {}, exercise, exerciseByHour };
}
