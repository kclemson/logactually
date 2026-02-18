import type { ChartSpec } from "@/components/trends/DynamicChart";
import type { DailyTotals } from "@/hooks/useGenerateChart";

export interface VerificationResult {
  status: "success" | "unavailable";
  total?: number;
  matched?: number;
  accuracy?: number;
  mismatches?: Array<{ date: string; ai: number; actual: number; delta: number }>;
  reason?: string;
}

/* ── Tolerance check (shared) ────────────────────────────── */

function isClose(ai: number, actual: number): boolean {
  const delta = Math.abs(ai - actual);
  return delta < 5 || (actual > 0 && delta / actual < 0.01);
}

/* ── Declaration-driven verification ─────────────────────── */

function verifyDaily(
  spec: ChartSpec,
  dailyTotals: DailyTotals,
): VerificationResult {
  const v = spec.verification!;
  const source = dailyTotals[v.source];
  const mismatches: VerificationResult["mismatches"] = [];
  let matched = 0;
  let total = 0;

  for (const point of spec.data) {
    const rawDate = point.rawDate as string;
    if (!rawDate) continue;
    total++;

    const aiValue = Number(point[spec.dataKey]) || 0;
    const record = source[rawDate];
    const actualValue = record ? Number((record as any)[v.field]) || 0 : 0;

    if (isClose(aiValue, actualValue)) {
      matched++;
    } else {
      mismatches.push({ date: rawDate, ai: aiValue, actual: actualValue, delta: aiValue - actualValue });
    }
  }

  return { status: "success", total, matched, accuracy: total > 0 ? Math.round((matched / total) * 100) : 100, mismatches };
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

    if (isClose(aiValue, actual)) {
      matched++;
    } else {
      mismatches.push({ date: bucket.label, ai: aiValue, actual: Math.round(actual), delta: Math.round(aiValue - actual) });
    }
  }

  return { status: "success", total, matched, accuracy: total > 0 ? Math.round((matched / total) * 100) : 100, mismatches };
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
};

const EXERCISE_KEY_MAP: Record<string, string> = {
  sets: "sets", logged_sets: "sets",
  duration: "duration", duration_min: "duration",
  distance: "distance",
  cal_burned: "cal_burned",
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

  // Determine source and field
  const foodField = FOOD_KEY_MAP[dataKey];
  const exerciseField = EXERCISE_KEY_MAP[dataKey];
  if (!foodField && !exerciseField) {
    return { status: "unavailable", reason: `Verification isn't available for metric "${dataKey}"` };
  }

  const source = foodField ? dailyTotals.food : dailyTotals.exercise;
  const field = (foodField || exerciseField)!;

  const mismatches: VerificationResult["mismatches"] = [];
  let matched = 0;
  let total = 0;

  for (const point of data) {
    const rawDate = point.rawDate as string;
    if (!rawDate) continue;
    total++;
    const aiValue = Number(point[dataKey]) || 0;
    const actualRecord = source[rawDate];
    const actualValue = actualRecord ? Number((actualRecord as any)[field]) || 0 : 0;

    if (isClose(aiValue, actualValue)) {
      matched++;
    } else {
      mismatches.push({ date: rawDate, ai: aiValue, actual: actualValue, delta: aiValue - actualValue });
    }
  }

  return { status: "success", total, matched, accuracy: total > 0 ? Math.round((matched / total) * 100) : 100, mismatches };
}

/* ── Main entry point ────────────────────────────────────── */

export function verifyChartData(
  spec: ChartSpec,
  dailyTotals: DailyTotals,
): VerificationResult {
  // 1. AI explicitly declared verification as null → unverifiable
  if (spec.verification === null) {
    return { status: "unavailable", reason: "The AI indicated this chart uses derived metrics that can't be verified against daily totals" };
  }

  // 2. AI declared a verification object → use it
  if (spec.verification && spec.verification.type) {
    if (spec.verification.type === "daily") {
      return verifyDaily(spec, dailyTotals);
    }
    if (spec.verification.type === "aggregate") {
      return verifyAggregate(spec, dailyTotals);
    }
  }

  // 3. No verification field (old cached chart) → legacy heuristic fallback
  return verifyLegacy(spec, dailyTotals);
}
