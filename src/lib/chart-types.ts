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
  /** Per-date set of compound tokens: plain key ("walk_run") and key:subtype ("walk_run:walking") */
  exerciseKeysByDate?: Record<string, string[]>;
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

  groupBy: "date" | "dayOfWeek" | "hourOfDay" | "weekdayVsWeekend" | "week" | "item" | "category" | "dayClassification";

  /**
   * Required when groupBy === "dayClassification".
   * Partitions days into two labeled buckets based on that day's exercise/food composition.
   */
  classify?: {
    /**
     * any_strength: TRUE if ANY exercise that day has isCardio=false
     * all_cardio:   TRUE if ALL exercises that day are cardio
     * any_cardio:   TRUE if ANY cardio exercise was logged
     * any_key:      TRUE if ANY key in keys[] appears on that day (supports "key" or "key:subtype" tokens)
     * only_keys:    TRUE if EVERY exercise on that day is within keys[] (allowlist — inverse of any_key)
     * threshold:    TRUE if the daily food metric meets thresholdOp + thresholdValue
     */
    rule: "any_strength" | "all_cardio" | "any_cardio" | "any_key" | "only_keys" | "threshold";
    /** For any_key / only_keys: array of "exerciseKey" or "exerciseKey:subtype" tokens */
    keys?: string[];
    /** For threshold: numeric value to compare against */
    thresholdValue?: number;
    /** For threshold: comparison operator */
    thresholdOp?: "gte" | "lte" | "gt" | "lt";
    /** Label for days matching the condition */
    trueLabel: string;
    /** Label for days NOT matching the condition */
    falseLabel: string;
  };
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
