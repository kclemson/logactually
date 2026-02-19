// ── Shared type contracts for the chart system ──────────────
// No logic, no side effects. Imported by chart-dsl, chart-data, and useGenerateChart.

// ── Per-day aggregates ──────────────────────────────────────

export interface FoodDayTotals {
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sat_fat: number;
  sodium: number;
  chol: number;
  entries: number;
}

export interface ExerciseDayTotals {
  sets: number;
  duration: number;
  distance: number;
  cal_burned: number;
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
    total_duration: number;
    avg_duration: number;
    total_distance: number;
    avg_heart_rate: number | null;
    avg_effort: number | null;
    total_cal_burned: number;
  }>;
  /** Populated when groupBy === "hourOfDay" and source === "food" */
  foodByHour?: HourlyTotals<FoodDayTotals>;
  /** Populated when groupBy === "hourOfDay" and source === "exercise" */
  exerciseByHour?: HourlyTotals<ExerciseDayTotals>;
  /** Populated when groupBy === "item" and source === "food" */
  foodByItem?: Record<string, { count: number; totalCal: number; totalProtein: number }>;
  /** Populated when groupBy === "item" and source === "exercise" */
  exerciseByItem?: Record<string, { description: string; count: number; totalSets: number; totalDuration: number; totalCalBurned: number }>;
  /** Populated when groupBy === "category" and source === "exercise" */
  exerciseByCategory?: Record<string, ExerciseDayTotals>;
}

// ── DSL schema ─────────────────────────────────────────────

export interface ChartDSL {
  chartType: "bar" | "line" | "area";
  title: string;

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
}
