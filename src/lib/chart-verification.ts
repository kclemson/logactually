import type { ChartSpec } from "@/components/trends/DynamicChart";
import type { DailyTotals } from "@/hooks/useGenerateChart";

/** Maps AI dataKey names to the corresponding field in dailyTotals */
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

export interface VerificationResult {
  status: "success" | "unavailable";
  total?: number;
  matched?: number;
  accuracy?: number;
  mismatches?: Array<{ date: string; ai: number; actual: number; delta: number }>;
  reason?: string;
}

export function verifyChartData(
  spec: ChartSpec,
  dailyTotals: DailyTotals
): VerificationResult {
  const { data, dataKey } = spec;

  // Check if data has rawDate fields
  const hasRawDate = data.length > 0 && data.some((d) => d.rawDate);
  if (!hasRawDate) {
    return { status: "unavailable", reason: "Verification isn't available for this chart type (no date-based data)" };
  }

  // Determine which totals source and field to use
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

    const delta = aiValue - actualValue;
    const isMatch =
      Math.abs(delta) < 5 ||
      (actualValue > 0 && Math.abs(delta / actualValue) < 0.01);

    if (isMatch) {
      matched++;
    } else {
      mismatches.push({ date: rawDate, ai: aiValue, actual: actualValue, delta });
    }
  }

  return {
    status: "success",
    total,
    matched,
    accuracy: total > 0 ? Math.round((matched / total) * 100) : 100,
    mismatches,
  };
}
