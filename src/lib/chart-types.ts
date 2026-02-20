// ── Shared type contracts for the chart system ──────────────
// No logic, no side effects. Imported by chart-dsl, chart-data, and useGenerateChart.

// ── Per-day aggregates ──────────────────────────────────────

export interface FoodDayTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  saturated_fat: number;
  sodium: number;
  cholesterol: number;
  entries: number;
}

export interface ExerciseDayTotals {
  sets: number;
  duration_minutes: number;
  distance_miles: number;
  calories_burned: number;
  heart_rate: number;
  unique_exercises: number;
  entries: number;
}

// ── Hourly aggregates (keyed 0-23) ─────────────────────────

export type HourlyTotals<T> = Record<number, T[]>;

// ── Composite data container ───────────────────────────────

export interface DailyTotals {
  food: Record<string, FoodDayTotals>;
  exercise: Record<string, ExerciseDayTotals>;
  exerciseByKey?: Record<string, {
    description: string;
    count: number;
    total_sets: number;
    total_duration_minutes: number;
    avg_duration_minutes: number;
    total_distance_miles: number;
    avg_heart_rate: number | null;
    avg_effort: number | null;
    total_calories_burned: number;
  }>;
  /** Populated when groupBy === "hourOfDay" and source === "food" */
  foodByHour?: HourlyTotals<FoodDayTotals>;
  /** Populated when groupBy === "hourOfDay" and source === "exercise" */
  exerciseByHour?: HourlyTotals<ExerciseDayTotals>;
  /** Populated when groupBy === "item" and source === "food" */
  foodByItem?: Record<string, {
    count: number;
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    totalFiber: number;
    totalSugar: number;
    totalSaturatedFat: number;
    totalSodium: number;
    totalCholesterol: number;
    recentSamples: string[];
  }>;
  /** Populated when groupBy === "item" and source === "exercise" */
  exerciseByItem?: Record<string, { description: string; count: number; totalSets: number; totalDurationMinutes: number; totalDistanceMiles: number; totalCaloriesBurned: number; totalHeartRate: number; heartRateCount: number; uniqueDays: Set<string>; recentSamples: string[] }>;
  /** Populated when groupBy === "category" and source === "exercise" */
  exerciseByCategory?: Record<string, ExerciseDayTotals>;
}

// ── DSL schema ─────────────────────────────────────────────

export interface ChartDSL {
  chartType: "bar" | "line" | "area";
  title: string;
  aiNote?: string;

  source: "food" | "exercise";
  metric: string;
  derivedMetric?: string;

  groupBy: "date" | "dayOfWeek" | "hourOfDay" | "weekdayVsWeekend" | "week" | "item" | "category";
  aggregation: "sum" | "average" | "max" | "min" | "count";

  filter?: {
    exerciseKey?: string;
    exerciseSubtype?: string;
    dayOfWeek?: number[]; // 0=Sun … 6=Sat
    category?: "Cardio" | "Strength";
  };

  compare?: {
    metric: string;
    source?: "food" | "exercise";
  };

  sort?: "label" | "value_asc" | "value_desc";
  limit?: number;
  /** Trailing N-period rolling average. Only valid when groupBy is "date" or "week". */
  window?: number;
  /** Prefix-sum cumulative transform. Only valid when groupBy is "date" or "week". Applied after window (if any). */
  transform?: "cumulative";
}
