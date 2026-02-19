import type { ChartSpec } from "@/components/trends/DynamicChart";
import type { DailyTotals } from "@/hooks/useGenerateChart";

export interface VerificationResult {
  status: "success" | "unavailable";
  total?: number;
  matched?: number;
  accuracy?: number;
  toleranceLabel?: string;
  mismatches?: Array<{ date: string; ai: number; actual: number; delta: number }>;
  allComparisons?: Array<{ label: string; ai: number; actual: number; delta: number; match: boolean }>;
  reason?: string;
}

/* ── Tolerance check (shared) ────────────────────────────── */

function isClose(ai: number, actual: number, method?: string): boolean {
  const delta = Math.abs(ai - actual);
  if (method === "average" || method === "percentage") {
    return delta < 2 || (actual > 0 && delta / actual < 0.02);
  }
  return delta < 5 || (actual > 0 && delta / actual < 0.01);
}

/* ── Declaration-driven verification ─────────────────────── */

function verifyDaily(
  spec: ChartSpec,
  dailyTotals: DailyTotals,
): VerificationResult {
  const v = spec.verification!;

  // Cross-check: if the heuristic knows a mapping for this dataKey, prefer it
  const heuristicField = FOOD_KEY_MAP[spec.dataKey] || EXERCISE_KEY_MAP[spec.dataKey];
  const derivedFormula = !heuristicField ? DERIVED_FORMULAS[spec.dataKey] : undefined;
  const field = heuristicField || (derivedFormula ? null : v.field);
  const source = heuristicField
    ? (FOOD_KEY_MAP[spec.dataKey] ? dailyTotals.food : dailyTotals.exercise)
    : derivedFormula
      ? dailyTotals[derivedFormula.source]
      : dailyTotals[v.source];
  const toleranceMethod = derivedFormula?.tolerance;

  const mismatches: VerificationResult["mismatches"] = [];
  const allComparisons: VerificationResult["allComparisons"] = [];
  let matched = 0;
  let total = 0;

  for (const point of spec.data) {
    const rawDate = point.rawDate as string;
    if (!rawDate) continue;
    total++;

    const aiValue = Number(point[spec.dataKey]) || 0;
    const record = source[rawDate];

    let actualValue: number;
    if (derivedFormula && record) {
      actualValue = derivedFormula.compute(record);
    } else if (field && record) {
      actualValue = Number((record as any)[field]) || 0;
    } else {
      actualValue = record ? Number((record as any)[v.field]) || 0 : 0;
    }

    const isMatch = isClose(aiValue, actualValue, toleranceMethod);

    allComparisons.push({ label: rawDate, ai: aiValue, actual: Math.round(actualValue * 10) / 10, delta: Math.round((aiValue - actualValue) * 10) / 10, match: isMatch });

    if (isMatch) {
      matched++;
    } else {
      mismatches.push({ date: rawDate, ai: aiValue, actual: Math.round(actualValue * 10) / 10, delta: Math.round((aiValue - actualValue) * 10) / 10 });
    }
  }

  const dailyToleranceLabel = toleranceMethod === "percentage" ? "within 2% or 2 units" : "within 1% or 5 units";
  return { status: "success", total, matched, accuracy: total > 0 ? Math.round((matched / total) * 100) : 100, toleranceLabel: dailyToleranceLabel, mismatches, allComparisons };
}

function verifyAggregate(
  spec: ChartSpec,
  dailyTotals: DailyTotals,
): VerificationResult {
  const v = spec.verification!;
  if (!v.breakdown || !v.method) {
    return { status: "unavailable", reason: "Aggregate verification missing breakdown or method" };
  }

  const source = dailyTotals[v.source];
  const xField = spec.xAxis.field;
  const mismatches: VerificationResult["mismatches"] = [];
  const allComparisons: VerificationResult["allComparisons"] = [];
  let matched = 0;
  let total = 0;

  for (const bucket of v.breakdown) {
    // Find the data point whose xAxisField value matches this bucket's label
    const point = spec.data.find((d) => d[xField] === bucket.label);
    if (!point) continue;

    total++;
    const aiValue = Number(point[spec.dataKey]) || 0;

    // Collect actual values from daily totals for the listed dates
    const values: number[] = [];
    for (const date of bucket.dates) {
      const record = source[date];
      values.push(record ? Number((record as any)[v.field]) || 0 : 0);
    }

    let actual: number;
    switch (v.method) {
      case "average":
        actual = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        break;
      case "sum":
        actual = values.reduce((a, b) => a + b, 0);
        break;
      case "count":
        actual = values.filter((v) => v > 0).length;
        break;
      case "max":
        actual = values.length > 0 ? Math.max(...values) : 0;
        break;
      case "min":
        actual = values.length > 0 ? Math.min(...values) : 0;
        break;
      default:
        actual = values.reduce((a, b) => a + b, 0);
    }

    const isMatch = isClose(aiValue, actual, v.method);
    allComparisons.push({ label: bucket.label, ai: aiValue, actual: Math.round(actual), delta: Math.round(aiValue - actual), match: isMatch });

    if (isMatch) {
      matched++;
    } else {
      mismatches.push({ date: bucket.label, ai: aiValue, actual: Math.round(actual), delta: Math.round(aiValue - actual) });
    }
  }

  const toleranceLabel = v.method === "average" ? "within 2% or 20 units" : "within 1% or 5 units";
  return { status: "success", total, matched, accuracy: total > 0 ? Math.round((matched / total) * 100) : 100, toleranceLabel, mismatches, allComparisons };
}

/* ── Legacy heuristic fallback (for old cached charts) ───── */

const FOOD_KEY_MAP: Record<string, string> = {
  calories: "cal", cal: "cal", total_calories: "cal",
  protein: "protein",
  carbs: "carbs",
  fat: "fat",
  fiber: "fiber",
  sugar: "sugar",
  sodium: "sodium",
  cholesterol: "chol", chol: "chol",
  sat_fat: "sat_fat", saturated_fat: "sat_fat",
  entries: "entries", meals: "entries", meal_count: "entries", meal_entries: "entries",
};

const EXERCISE_KEY_MAP: Record<string, string> = {
  sets: "sets", logged_sets: "sets",
  duration: "duration", duration_min: "duration",
  distance: "distance",
  cal_burned: "cal_burned",
};

/* ── Derived formulas for computable metrics ──────────────── */

interface DerivedFormula {
  source: "food" | "exercise";
  compute: (r: any) => number;
  tolerance: "percentage" | "default";
}

const safePct = (num: number, den: number) => den > 0 ? (num / den) * 100 : 0;
const safeDiv = (num: number, den: number) => den > 0 ? num / den : 0;

const DERIVED_FORMULAS: Record<string, DerivedFormula> = {
  // Macro % of total calories
  fat_pct:           { source: "food", compute: (r) => safePct(r.fat * 9, r.cal), tolerance: "percentage" },
  fat_percentage:    { source: "food", compute: (r) => safePct(r.fat * 9, r.cal), tolerance: "percentage" },
  fat_calories_pct:  { source: "food", compute: (r) => safePct(r.fat * 9, r.cal), tolerance: "percentage" },
  protein_pct:       { source: "food", compute: (r) => safePct(r.protein * 4, r.cal), tolerance: "percentage" },
  protein_percentage:{ source: "food", compute: (r) => safePct(r.protein * 4, r.cal), tolerance: "percentage" },
  carbs_pct:         { source: "food", compute: (r) => safePct(r.carbs * 4, r.cal), tolerance: "percentage" },
  carbs_percentage:  { source: "food", compute: (r) => safePct(r.carbs * 4, r.cal), tolerance: "percentage" },
  // Per-meal metrics
  cal_per_meal:      { source: "food", compute: (r) => safeDiv(r.cal, r.entries), tolerance: "default" },
  calories_per_meal: { source: "food", compute: (r) => safeDiv(r.cal, r.entries), tolerance: "default" },
  protein_per_meal:  { source: "food", compute: (r) => safeDiv(r.protein, r.entries), tolerance: "default" },
  // Calories from macro
  fat_calories:          { source: "food", compute: (r) => r.fat * 9, tolerance: "default" },
  calories_from_fat:     { source: "food", compute: (r) => r.fat * 9, tolerance: "default" },
  protein_calories:      { source: "food", compute: (r) => r.protein * 4, tolerance: "default" },
  calories_from_protein: { source: "food", compute: (r) => r.protein * 4, tolerance: "default" },
  carbs_calories:        { source: "food", compute: (r) => r.carbs * 4, tolerance: "default" },
  calories_from_carbs:   { source: "food", compute: (r) => r.carbs * 4, tolerance: "default" },
};

function verifyLegacy(
  spec: ChartSpec,
  dailyTotals: DailyTotals,
): VerificationResult {
  const { data, dataKey } = spec;

  // Guard: mixed data source
  if (spec.dataSource === "mixed") {
    return { status: "unavailable", reason: "Verification isn't available for charts combining food and exercise data" };
  }

  // Guard: no rawDate fields
  const hasRawDate = data.length > 0 && data.some((d) => d.rawDate);
  if (!hasRawDate) {
    return { status: "unavailable", reason: "Verification isn't available for this chart type (no date-based data)" };
  }

  // Guard: duplicate rawDates
  const rawDates = data.map((d) => d.rawDate as string).filter(Boolean);
  const uniqueDates = new Set(rawDates);
  if (uniqueDates.size < rawDates.length) {
    return { status: "unavailable", reason: "Verification isn't available for aggregated charts (multiple points share the same date)" };
  }

  // Guard: non-date x-axis
  const xField = spec.xAxis.field.toLowerCase();
  if (!xField.includes("date")) {
    return { status: "unavailable", reason: "Verification isn't available for categorical charts" };
  }

  // Determine source and field — check direct maps first, then derived formulas
  const foodField = FOOD_KEY_MAP[dataKey];
  const exerciseField = EXERCISE_KEY_MAP[dataKey];
  const derivedFormula = DERIVED_FORMULAS[dataKey];

  if (!foodField && !exerciseField && !derivedFormula) {
    return { status: "unavailable", reason: `Verification isn't available for metric "${dataKey}"` };
  }

  const source = derivedFormula
    ? dailyTotals[derivedFormula.source]
    : foodField ? dailyTotals.food : dailyTotals.exercise;
  const field = foodField || exerciseField; // null when using derived formula
  const toleranceMethod = derivedFormula?.tolerance;

  const mismatches: VerificationResult["mismatches"] = [];
  const allComparisons: VerificationResult["allComparisons"] = [];
  let matched = 0;
  let total = 0;

  for (const point of data) {
    const rawDate = point.rawDate as string;
    if (!rawDate) continue;
    total++;
    const aiValue = Number(point[dataKey]) || 0;
    const record = source[rawDate];

    let actualValue: number;
    if (derivedFormula && record) {
      actualValue = derivedFormula.compute(record);
    } else if (field && record) {
      actualValue = Number((record as any)[field]) || 0;
    } else {
      actualValue = 0;
    }

    const isMatch = isClose(aiValue, actualValue, toleranceMethod);

    allComparisons.push({ label: rawDate, ai: aiValue, actual: Math.round(actualValue * 10) / 10, delta: Math.round((aiValue - actualValue) * 10) / 10, match: isMatch });

    if (isMatch) {
      matched++;
    } else {
      mismatches.push({ date: rawDate, ai: aiValue, actual: Math.round(actualValue * 10) / 10, delta: Math.round((aiValue - actualValue) * 10) / 10 });
    }
  }

  const toleranceLabel = toleranceMethod === "percentage" ? "within 2% or 2 units" : "within 1% or 5 units";
  return { status: "success", total, matched, accuracy: total > 0 ? Math.round((matched / total) * 100) : 100, toleranceLabel, mismatches, allComparisons };
}

/* ── Main entry point ────────────────────────────────────── */

export function verifyChartData(
  spec: ChartSpec,
  dailyTotals: DailyTotals,
): VerificationResult {
  // 1. Try deterministic heuristic first — it's trustworthy and catches the
  //    "null cop-out" where the AI skips verification on a verifiable chart.
  const heuristicResult = verifyLegacy(spec, dailyTotals);
  if (heuristicResult.status === "success") {
    return heuristicResult;
  }

  // 2. Heuristic couldn't help — fall back to AI's self-declared verification
  if (spec.verification && spec.verification.type) {
    if (spec.verification.type === "daily") {
      return verifyDaily(spec, dailyTotals);
    }
    if (spec.verification.type === "aggregate") {
      return verifyAggregate(spec, dailyTotals);
    }
  }

  // 3. AI explicitly declared null → unverifiable
  if (spec.verification === null) {
    return { status: "unavailable", reason: "The AI indicated this chart uses derived metrics that can't be verified against daily totals" };
  }

  // 4. No verification possible
  return heuristicResult;
}
