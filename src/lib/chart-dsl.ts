import type { ChartDSL, DailyTotals } from "./chart-types";
import { isCardioExercise } from "./exercise-metadata";
import type { ChartSpec } from "@/components/trends/DynamicChart";
import { format, getDay, getISOWeek, getISOWeekYear } from "date-fns";

// Re-export ChartDSL for backward compat
export type { ChartDSL } from "./chart-types";

// ── Backward compatibility for saved charts with old metric keys ──
const METRIC_COMPAT: Record<string, string> = {
  cal: "calories",
  sat_fat: "saturated_fat",
  chol: "cholesterol",
  duration: "duration_minutes",
  distance: "distance_miles",
  cal_burned: "calories_burned",
};

// ── Known metrics ─────────────────────────────────────────

const FOOD_METRICS = ["calories", "protein", "carbs", "fat", "fiber", "sugar", "saturated_fat", "sodium", "cholesterol", "entries"] as const;
const EXERCISE_METRICS = ["sets", "reps", "weight_lbs", "duration_minutes", "distance_miles", "calories_burned", "heart_rate", "unique_exercises", "entries"] as const;

// Metrics that need decimal precision (not rounded to integers)
const DECIMAL_METRICS = new Set(["distance_miles"]);

// Intensity metrics where 0 means "no data", not "zero activity" — skip calendar gap filling
const INTENSITY_METRICS = new Set(["heart_rate", "effort", "speed_mph", "cadence_rpm", "incline_pct"]);

// Derived formulas compute from raw food daily totals
const DERIVED_FORMULAS: Record<string, (t: Record<string, number>) => number> = {
  protein_pct: (t) => {
    const total = (t.protein || 0) * 4 + (t.carbs || 0) * 4 + (t.fat || 0) * 9;
    return total > 0 ? Math.round(((t.protein || 0) * 4 / total) * 100) : 0;
  },
  carbs_pct: (t) => {
    const total = (t.protein || 0) * 4 + (t.carbs || 0) * 4 + (t.fat || 0) * 9;
    return total > 0 ? Math.round(((t.carbs || 0) * 4 / total) * 100) : 0;
  },
  fat_pct: (t) => {
    const total = (t.protein || 0) * 4 + (t.carbs || 0) * 4 + (t.fat || 0) * 9;
    return total > 0 ? Math.round(((t.fat || 0) * 9 / total) * 100) : 0;
  },
  net_carbs: (t) => Math.round((t.carbs || 0) - (t.fiber || 0)),
  cal_per_meal: (t) => t.entries > 0 ? Math.round((t.calories || 0) / t.entries) : 0,
  protein_per_meal: (t) => t.entries > 0 ? Math.round((t.protein || 0) / t.entries) : 0,
};

// ── Helpers ───────────────────────────────────────────────

/** Convert raw metric keys to compact human-readable labels */
function humanizeMetricLabel(key: string): string {
  const MAP: Record<string, string> = {
    calories: "cal",
    protein: "protein",
    carbs: "carbs",
    fat: "fat",
    fiber: "fiber",
    sugar: "sugar",
    saturated_fat: "sat fat",
    sodium: "sodium",
    cholesterol: "chol",
    sets: "sets",
    reps: "reps",
    weight_lbs: "lbs",
    duration_minutes: "min",
    distance_miles: "mi",
    calories_burned: "cal burned",
    calories_burned_estimate: "est cal burned",
    heart_rate: "bpm",
    entries: "entries",
    unique_exercises: "exercises",
    days: "days",
  };
  return MAP[key] ?? key.replace(/_/g, " ");
}

/** Format a number compactly: use toLocaleString for ≥1000, 1 decimal for small decimals, else round */
function fmtNum(v: number, forceDecimal = false): string {
  if (forceDecimal || (v > 0 && v < 10 && v !== Math.round(v))) {
    return (Math.round(v * 10) / 10).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
  const rounded = Math.round(v);
  return rounded >= 1000 ? rounded.toLocaleString("en-US") : String(rounded);
}

type DetailPair = { label: string; value: string };

/** Build a compact secondary-details array, filtering out zeros and the primary metric */
function buildDetails(
  pairs: Array<{ label: string; value: number | null | undefined }>,
  excludeLabel?: string,
): DetailPair[] {
  return pairs
    .filter((p) => p.label !== excludeLabel && p.value != null && p.value !== 0)
    .map((p) => ({
      label: humanizeMetricLabel(p.label),
      value: typeof p.value === "number"
        ? fmtNum(p.value!)
        : String(p.value),
    }));
}

/** Build a range string like "1,820–2,340" from an array of values */
function rangeStr(values: number[], unit?: string): string {
  if (values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const isDecimal = min < 10 && min !== Math.round(min);
  const suffix = unit ? ` ${unit}` : "";
  if (min === max) return `${fmtNum(min, isDecimal)}${suffix}`;
  return `${fmtNum(min, isDecimal)}–${fmtNum(max, isDecimal)}${suffix}`;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const HOUR_LABELS = [
  "12am", "1am", "2am", "3am", "4am", "5am", "6am", "7am",
  "8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm",
  "4pm", "5pm", "6pm", "7pm", "8pm", "9pm", "10pm", "11pm",
];

function getDayOfWeek(dateStr: string): number {
  return getDay(new Date(`${dateStr}T12:00:00`));
}

function extractValue(
  source: "food" | "exercise",
  metric: string,
  derivedMetric: string | undefined,
  dailyTotals: DailyTotals,
  dateStr: string,
): number | null {
  if (derivedMetric && DERIVED_FORMULAS[derivedMetric]) {
    const foodDay = dailyTotals.food[dateStr];
    if (!foodDay) return null;
    return DERIVED_FORMULAS[derivedMetric](foodDay as unknown as Record<string, number>);
  }

  if (source === "food") {
    const day = dailyTotals.food[dateStr];
    if (!day) return null;
    const val = (day as any)[metric];
    return val !== undefined ? val : null;
  }

  if (source === "exercise") {
    const day = dailyTotals.exercise[dateStr];
    if (!day) return null;
    const val = (day as any)[metric];
    return val !== undefined ? val : null;
  }

  return null;
}

function aggregate(values: number[], method: ChartDSL["aggregation"]): number {
  if (values.length === 0) return 0;
  switch (method) {
    case "sum":
      return values.reduce((a, b) => a + b, 0);
    case "average":
      return values.reduce((a, b) => a + b, 0) / values.length;
    case "max":
      return Math.max(...values);
    case "min":
      return Math.min(...values);
    case "count":
      return values.length;
  }
}

// ── Post-processing helpers ────────────────────────────────

function applyWindow(dataPoints: Array<Record<string, any>>, window: number, useDecimal = false): void {
  for (let i = 0; i < dataPoints.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = dataPoints.slice(start, i + 1).map((p) => p.value);
    const avg = slice.reduce((a: number, b: number) => a + b, 0) / slice.length;
    dataPoints[i].value = useDecimal ? Math.round(avg * 10) / 10 : Math.round(avg);
  }
}

function applyCumulative(dataPoints: Array<Record<string, any>>): void {
  let running = 0;
  for (const point of dataPoints) {
    running += point.value;
    point.value = running;
  }
}

// ── Main engine ───────────────────────────────────────────

export function executeDSL(dsl: ChartDSL, dailyTotals: DailyTotals): ChartSpec {
  // Normalize old metric keys from saved charts
  if (METRIC_COMPAT[dsl.metric]) {
    dsl = { ...dsl, metric: METRIC_COMPAT[dsl.metric] };
  }
  if (dsl.compare?.metric && METRIC_COMPAT[dsl.compare.metric]) {
    dsl = { ...dsl, compare: { ...dsl.compare, metric: METRIC_COMPAT[dsl.compare.metric] } };
  }

  // Collect all dates from the relevant source
  const sourceMap = dsl.source === "food" ? dailyTotals.food : dailyTotals.exercise;
  let dates = Object.keys(sourceMap).sort();

  // Apply filters
  if (dsl.filter?.dayOfWeek) {
    const allowed = new Set(dsl.filter.dayOfWeek);
    dates = dates.filter((d) => allowed.has(getDayOfWeek(d)));
  }

  // Extract values per date
  const dateValues: Array<{ date: string; value: number }> = [];
  for (const d of dates) {
    const v = extractValue(dsl.source, dsl.metric, dsl.derivedMetric, dailyTotals, d);
    if (v !== null) {
      dateValues.push({ date: d, value: v });
    }
  }

  // Group by dimension
  let dataPoints: Array<Record<string, any>> = [];

  switch (dsl.groupBy) {
    case "date": {
      const isDecimal = DECIMAL_METRICS.has(dsl.metric);
      const roundVal = (v: number) => isDecimal ? Math.round(v * 10) / 10 : Math.round(v);

      dataPoints = dateValues.map(({ date, value }) => {
        let finalValue = value;
        let cmpVal: number | null = null;
        let cmpMetric: string | undefined;
        if (dsl.compare) {
          const cmpSource = dsl.compare.source ?? dsl.source;
          cmpMetric = METRIC_COMPAT[dsl.compare.metric] ?? dsl.compare.metric;
          cmpVal = extractValue(cmpSource, cmpMetric, undefined, dailyTotals, date);
          if (cmpVal !== null) finalValue -= cmpVal;
        }
        if (dsl.offset) finalValue -= dsl.offset;

        // Build secondary details for non-compare date charts
        const details: DetailPair[] = [];
        if (!dsl.compare && !dsl.offset) {
          if (dsl.source === "food") {
            const day = dailyTotals.food[date];
            if (day) {
              const secondaryPairs: Array<{ label: string; value: number | null }> = [
                { label: "protein", value: day.protein },
                { label: "carbs", value: day.carbs },
                { label: "fat", value: day.fat },
                { label: "fiber", value: day.fiber },
                { label: "entries", value: day.entries },
              ];
              details.push(...buildDetails(secondaryPairs, dsl.metric));
            }
          } else {
            const day = dailyTotals.exercise[date];
            if (day) {
              const secondaryPairs: Array<{ label: string; value: number | null }> = [
                { label: "sets", value: day.sets },
                { label: "duration_minutes", value: day.duration_minutes },
                { label: "distance_miles", value: day.distance_miles },
                { label: "calories_burned", value: day.calories_burned || day.calories_burned_estimate },
                { label: "entries", value: day.entries },
              ];
              details.push(...buildDetails(secondaryPairs, dsl.metric));
            }
          }
        }

        return {
          rawDate: date,
          label: format(new Date(`${date}T12:00:00`), "MMM d"),
          value: roundVal(finalValue),
          _details: (dsl.compare || dsl.offset) ? [] : details,
          _compareBreakdown: (dsl.compare || dsl.offset) ? {
            primary: roundVal(value),
            primaryLabel: dsl.derivedMetric || dsl.metric,
            compare: cmpVal !== null ? roundVal(cmpVal) : null,
            compareLabel: cmpMetric,
            offset: dsl.offset ?? null,
          } : undefined,
        };
      });

      // Fill calendar gaps for accurate rolling windows on sparse data
      // Skip for intensity metrics (heart_rate, effort, etc.) where 0 ≠ "no activity"
      if (dsl.window && dsl.window > 1 && dataPoints.length >= 2 && !INTENSITY_METRICS.has(dsl.metric)) {
        const filled: Array<Record<string, any>> = [];
        const byDate = new Map(dataPoints.map(p => [p.rawDate as string, p]));
        const startDate = new Date(`${dataPoints[0].rawDate}T12:00:00`);
        const endDate = new Date(`${dataPoints[dataPoints.length - 1].rawDate}T12:00:00`);
        const cur = new Date(startDate);
        while (cur <= endDate) {
          const ds = format(cur, "yyyy-MM-dd");
          if (byDate.has(ds)) {
            filled.push(byDate.get(ds)!);
          } else {
            filled.push({
              rawDate: ds,
              label: format(cur, "MMM d"),
              value: 0,
              _details: [],
              _calendarFill: true,
            });
          }
          cur.setDate(cur.getDate() + 1);
        }
        applyWindow(filled, dsl.window, isDecimal);
        // Strip filler days that had no original data
        dataPoints = filled.filter(p => !p._calendarFill);
      } else if (dsl.window && dsl.window > 1) {
        applyWindow(dataPoints, dsl.window, isDecimal);
      }

      if (dsl.transform === "cumulative") applyCumulative(dataPoints);
      break;
    }
    case "dayOfWeek": {
      const buckets: Record<number, number[]> = {};
      for (const { date, value } of dateValues) {
        const dow = getDayOfWeek(date);
        (buckets[dow] ??= []).push(value);
      }
      const dayOrder = [1, 2, 3, 4, 5, 6, 0];
      const unit = humanizeMetricLabel(dsl.metric);
      for (const dow of dayOrder) {
        const vals = buckets[dow];
        if (!vals || vals.length === 0) continue;
        const details: DetailPair[] = [{ label: "days", value: String(vals.length) }];
        if (vals.length > 1) {
          details.push({ label: "range", value: rangeStr(vals, unit) });
        }
        dataPoints.push({
          label: DAY_NAMES[dow],
          value: Math.round(aggregate(vals, dsl.aggregation)),
          _details: details,
        });
      }
      break;
    }
    case "weekdayVsWeekend": {
      const weekday: number[] = [];
      const weekend: number[] = [];
      for (const { date, value } of dateValues) {
        const dow = getDayOfWeek(date);
        if (dow === 0 || dow === 6) weekend.push(value);
        else weekday.push(value);
      }
      const wUnit = humanizeMetricLabel(dsl.metric);
      for (const [lbl, vals] of [["Weekdays", weekday], ["Weekends", weekend]] as const) {
        if (vals.length === 0) continue;
        const details: DetailPair[] = [{ label: "days", value: String(vals.length) }];
        if (vals.length > 1) {
          details.push({ label: "range", value: rangeStr(vals, wUnit) });
        }
        dataPoints.push({ label: lbl, value: Math.round(aggregate(vals, dsl.aggregation)), _details: details });
      }
      break;
    }
    case "week": {
      const buckets: Record<string, number[]> = {};
      const primaryBuckets: Record<string, number[]> = {};
      const compareBuckets: Record<string, number[]> = {};
      const weekDates: Record<string, string> = {};
      let weekCmpMetric: string | undefined;
      for (const { date, value } of dateValues) {
        let finalValue = value;
        let cmpVal: number | null = null;
        if (dsl.compare) {
          const cmpSource = dsl.compare.source ?? dsl.source;
          weekCmpMetric = METRIC_COMPAT[dsl.compare.metric] ?? dsl.compare.metric;
          cmpVal = extractValue(cmpSource, weekCmpMetric, undefined, dailyTotals, date);
          if (cmpVal !== null) finalValue -= cmpVal;
        }
        if (dsl.offset) finalValue -= dsl.offset;
        const d = new Date(`${date}T12:00:00`);
        const weekKey = `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, "0")}`;
        (buckets[weekKey] ??= []).push(finalValue);
        (primaryBuckets[weekKey] ??= []).push(value);
        (compareBuckets[weekKey] ??= []).push(cmpVal !== null ? cmpVal : 0);
        if (!weekDates[weekKey] || date > weekDates[weekKey]) {
          weekDates[weekKey] = date;
        }
      }
      const wkUnit = humanizeMetricLabel(dsl.metric);
      const isWkDecimal = DECIMAL_METRICS.has(dsl.metric);
      for (const weekKey of Object.keys(buckets).sort()) {
        const primarySum = primaryBuckets[weekKey]?.reduce((a, b) => a + b, 0) ?? 0;
        const compareSum = compareBuckets[weekKey]?.reduce((a, b) => a + b, 0) ?? 0;
        const dayCount = buckets[weekKey].length;
        const aggValue = aggregate(buckets[weekKey], dsl.aggregation);
        const details: DetailPair[] = [];
        if (!dsl.compare) {
          details.push({ label: "days", value: String(dayCount) });
          if (dayCount > 0 && dsl.aggregation === "sum") {
            const avg = aggValue / dayCount;
            details.push({ label: "avg/day", value: `${fmtNum(avg, isWkDecimal)} ${wkUnit}` });
          }
        }
        dataPoints.push({
          rawDate: weekDates[weekKey],
          label: weekKey,
          value: Math.round(aggValue),
          _details: details,
          _compareBreakdown: (dsl.compare || dsl.offset) ? {
            primary: Math.round(primarySum),
            primaryLabel: dsl.derivedMetric || dsl.metric,
            compare: Math.round(compareSum),
            compareLabel: weekCmpMetric,
            offset: dsl.offset ?? null,
          } : undefined,
        });
      }
      if (dsl.window && dsl.window > 1) applyWindow(dataPoints, dsl.window, DECIMAL_METRICS.has(dsl.metric));
      if (dsl.transform === "cumulative") applyCumulative(dataPoints);
      break;
    }
    case "hourOfDay": {
      const hourlySource = dsl.source === "food"
        ? dailyTotals.foodByHour
        : dailyTotals.exerciseByHour;

      if (!hourlySource) break;

      const hUnit = humanizeMetricLabel(dsl.metric);
      for (let hour = 0; hour < 24; hour++) {
        const entries = hourlySource[hour];
        if (!entries || entries.length === 0) continue;

        const values = entries.map((entry) => {
          if (dsl.derivedMetric && DERIVED_FORMULAS[dsl.derivedMetric]) {
            return DERIVED_FORMULAS[dsl.derivedMetric](entry as unknown as Record<string, number>);
          }
          return (entry as any)[dsl.metric] ?? 0;
        });

        const details: DetailPair[] = [{ label: "entries", value: String(entries.length) }];
        if (values.length > 1) {
          details.push({ label: "range", value: rangeStr(values, hUnit) });
        }

        dataPoints.push({
          label: HOUR_LABELS[hour],
          value: Math.round(aggregate(values, dsl.aggregation)),
          _details: details,
        });
      }
      break;
    }
    case "item": {
      if (dsl.source === "food" && dailyTotals.foodByItem) {
        const entries = Object.entries(dailyTotals.foodByItem);
        const usePerEntry = dsl.aggregation === "max" || dsl.aggregation === "min";
        for (const [label, item] of entries) {
          const divisor = dsl.aggregation === "average"
            ? ((item as any).uniqueDays?.size || 1)
            : 1;

          let metricValue: number;
          if (usePerEntry && item.valuesPerEntry?.[dsl.metric]) {
            const vals = item.valuesPerEntry[dsl.metric];
            metricValue = dsl.aggregation === "max" ? Math.max(...vals) : Math.min(...vals);
          } else {
            metricValue =
              dsl.metric === "entries"       ? item.count :
              dsl.metric === "calories"      ? item.totalCalories / divisor :
              dsl.metric === "protein"       ? item.totalProtein / divisor :
              dsl.metric === "carbs"         ? item.totalCarbs / divisor :
              dsl.metric === "fat"           ? item.totalFat / divisor :
              dsl.metric === "fiber"         ? item.totalFiber / divisor :
              dsl.metric === "sugar"         ? item.totalSugar / divisor :
              dsl.metric === "saturated_fat" ? item.totalSaturatedFat / divisor :
              dsl.metric === "sodium"        ? item.totalSodium / divisor :
              dsl.metric === "cholesterol"   ? item.totalCholesterol / divisor :
              item.count;
          }
          if (metricValue === 0) continue;
          // Build enriched details with per-entry average
          const foodItemDetails = buildDetails([
            { label: "entries", value: item.count },
            { label: "calories", value: item.totalCalories },
            { label: "protein", value: item.totalProtein },
          ], dsl.metric === "entries" ? "entries" : dsl.metric === "calories" ? "calories" : dsl.metric === "protein" ? "protein" : undefined);
          // Add per-entry average for sums
          if (dsl.aggregation === "sum" && item.count > 1 && metricValue > 0) {
            const avg = metricValue / item.count;
            foodItemDetails.push({ label: "avg each", value: `${fmtNum(avg)} ${humanizeMetricLabel(dsl.metric)}` });
          }
          dataPoints.push({
            label: label.length > 25 ? label.slice(0, 22) + "…" : label,
            value: Math.round(dsl.aggregation === "count" ? item.count : metricValue),
            _details: foodItemDetails,
            _samples: item.recentSamples ?? [],
          });
        }
      } else if (dsl.source === "exercise" && dailyTotals.exerciseByItem) {
        const entries = Object.entries(dailyTotals.exerciseByItem);
        const usePerEntry = dsl.aggregation === "max" || dsl.aggregation === "min";
        for (const [, item] of entries) {
          const divisor = dsl.aggregation === "average"
            ? ((item as any).uniqueDays?.size || 1)
            : 1;
          const heartRateDivisor = (item as any).heartRateCount > 0 ? (item as any).heartRateCount : 1;

          let metricValue: number;
          if (usePerEntry && item.valuesPerEntry?.[dsl.metric]) {
            const vals = item.valuesPerEntry[dsl.metric];
            metricValue = dsl.aggregation === "max" ? Math.max(...vals) : Math.min(...vals);
          } else {
            metricValue =
              dsl.metric === "sets"             ? item.totalSets / divisor :
              dsl.metric === "reps"             ? ((item as any).totalReps ?? 0) / divisor :
              dsl.metric === "weight_lbs"       ? ((item as any).totalWeightLbs ?? 0) / divisor :
              dsl.metric === "duration_minutes" ? item.totalDurationMinutes / divisor :
              dsl.metric === "distance_miles"   ? ((item as any).totalDistanceMiles ?? 0) / divisor :
              dsl.metric === "calories_burned"  ? item.totalCaloriesBurned / divisor :
              dsl.metric === "heart_rate"       ? (item as any).totalHeartRate / heartRateDivisor :
              item.count;
          }
          if (metricValue === 0) continue;
          // Build enriched details: entries first, then per-entry range, then secondary metrics
          const exItemDetails: DetailPair[] = [];
          exItemDetails.push({ label: "entries", value: String(item.count) });
          // Per-entry range for the primary metric
          const perEntryVals = item.valuesPerEntry?.[dsl.metric];
          if (perEntryVals && perEntryVals.length > 1) {
            exItemDetails.push({ label: "each", value: rangeStr(perEntryVals, humanizeMetricLabel(dsl.metric)) });
          } else if (dsl.aggregation === "sum" && item.count > 1 && metricValue > 0) {
            const avg = metricValue / item.count;
            exItemDetails.push({ label: "avg each", value: `${fmtNum(avg, DECIMAL_METRICS.has(dsl.metric))} ${humanizeMetricLabel(dsl.metric)}` });
          }
          // Secondary metrics (excluding primary)
          const exSecondary = buildDetails([
            { label: "sets", value: item.totalSets },
            { label: "duration_minutes", value: item.totalDurationMinutes },
            { label: "distance_miles", value: (item as any).totalDistanceMiles },
            { label: "calories_burned", value: item.totalCaloriesBurned },
            { label: "heart_rate", value: (item as any).heartRateCount > 0 ? Math.round((item as any).totalHeartRate / (item as any).heartRateCount) : null },
          ], dsl.metric === "sets" ? "sets" : dsl.metric === "duration_minutes" ? "duration_minutes" : dsl.metric === "calories_burned" ? "calories_burned" : dsl.metric === "distance_miles" ? "distance_miles" : dsl.metric === "heart_rate" ? "heart_rate" : undefined);
          exItemDetails.push(...exSecondary);

          dataPoints.push({
            label: item.description.length > 25 ? item.description.slice(0, 22) + "…" : item.description,
            value: Math.round(dsl.aggregation === "count" ? item.count : metricValue),
            _details: exItemDetails,
            _samples: item.recentSamples ?? [],
          });
        }
      }
      break;
    }
    case "category": {
      if (dsl.source === "exercise" && dailyTotals.exerciseByCategory) {
        for (const [label, totals] of Object.entries(dailyTotals.exerciseByCategory)) {
          const metricValue =
            dsl.metric === "sets" ? totals.sets :
            dsl.metric === "reps" ? totals.reps :
            dsl.metric === "weight_lbs" ? totals.weight_lbs :
            dsl.metric === "duration_minutes" ? totals.duration_minutes :
            dsl.metric === "distance_miles" ? totals.distance_miles :
            dsl.metric === "calories_burned" ? totals.calories_burned :
            totals.sets;
          // Reorder: entries first, then secondary metrics, cal burned last
          dataPoints.push({
            label,
            value: Math.round(metricValue),
            _details: buildDetails([
              { label: "entries", value: totals.entries },
              { label: "sets", value: totals.sets },
              { label: "reps", value: totals.reps },
              { label: "duration_minutes", value: totals.duration_minutes },
              { label: "distance_miles", value: totals.distance_miles },
              { label: "weight_lbs", value: totals.weight_lbs },
              { label: "calories_burned", value: totals.calories_burned },
            ], dsl.metric),
          });
        }
      }
      break;
    }
    case "dayClassification": {
      const classify = dsl.classify;
      if (!classify) break;

      let trueCount = 0;
      let falseCount = 0;
      const trueValues: number[] = [];
      const falseValues: number[] = [];

      if (classify.rule === "threshold" && dsl.source === "food") {
        // Food threshold: partition food days by metric value
        for (const [date, day] of Object.entries(dailyTotals.food)) {
          const val = (day as any)[dsl.metric] ?? 0;
          const { thresholdValue = 0, thresholdOp = "gte" } = classify;
          const matches =
            thresholdOp === "gte" ? val >= thresholdValue :
            thresholdOp === "lte" ? val <= thresholdValue :
            thresholdOp === "gt"  ? val > thresholdValue :
            thresholdOp === "lt"  ? val < thresholdValue : false;
          if (matches) { trueCount++; trueValues.push(val); }
          else { falseCount++; falseValues.push(val); }
        }
      } else {
        // Exercise-based classification
        const keysByDate = dailyTotals.exerciseKeysByDate ?? {};
        for (const [date, tokens] of Object.entries(keysByDate)) {
          const tokenSet = new Set(tokens);
          // Derive plain keys (no colon) for cardio checks
          const plainKeys = tokens.filter(t => !t.includes(":"));

          let matches = false;
          switch (classify.rule) {
            case "any_strength":
              matches = plainKeys.some(k => !isCardioExercise(k));
              break;
            case "all_cardio":
              matches = plainKeys.length > 0 && plainKeys.every(k => isCardioExercise(k));
              break;
            case "any_cardio":
              matches = plainKeys.some(k => isCardioExercise(k));
              break;
            case "any_key": {
              const allowlist = new Set(classify.keys ?? []);
              matches = tokens.some(t => allowlist.has(t));
              break;
            }
            case "only_keys": {
              const allowlist = classify.keys ?? [];
              const tokensToEvaluate = tokens.filter(token => {
                if (token.includes(":")) return true;
                return !tokens.some(t => t.startsWith(`${token}:`));
              });
              matches = tokensToEvaluate.length > 0 && tokensToEvaluate.every(token => {
                return allowlist.some(entry => {
                  if (entry === token) return true;
                  if (!entry.includes(":") && token.startsWith(`${entry}:`)) return true;
                  if (entry.includes(":")) {
                    const entryBase = entry.split(":")[0];
                    if (!token.includes(":") && token === entryBase) return true;
                    if (token.includes(":") && token.startsWith(`${entryBase}:`)) return true;
                  }
                  return false;
                });
              });
              break;
            }
            default:
              matches = false;
          }

          if (matches) trueCount++; else falseCount++;
        }
      }

      const totalDays = trueCount + falseCount;
      const buildClassDetails = (count: number, vals: number[]): DetailPair[] => {
        const details: DetailPair[] = [];
        if (totalDays > 0) {
          const pct = Math.round((count / totalDays) * 100);
          details.push({ label: `of ${fmtNum(totalDays)} days`, value: `${pct}%` });
        }
        // For threshold, show avg on matching days
        if (classify.rule === "threshold" && vals.length > 0) {
          const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
          details.push({ label: `avg ${humanizeMetricLabel(dsl.metric)}`, value: fmtNum(avg) });
        }
        return details;
      };

      if (trueCount > 0) {
        dataPoints.push({ label: classify.trueLabel, value: trueCount, _details: buildClassDetails(trueCount, trueValues) });
      }
      if (falseCount > 0) {
        dataPoints.push({ label: classify.falseLabel, value: falseCount, _details: buildClassDetails(falseCount, falseValues) });
      }
      break;
    }
  }

  // Apply sorting for categorical charts
  if (dsl.sort && dsl.groupBy !== "date" && dsl.groupBy !== "week") {
    switch (dsl.sort) {
      case "value_asc":
        dataPoints.sort((a, b) => a.value - b.value);
        break;
      case "value_desc":
        dataPoints.sort((a, b) => b.value - a.value);
        break;
    }
  }

  // Apply limit
  if (dsl.limit && dsl.limit > 0) {
    dataPoints = dataPoints.slice(0, dsl.limit);
  }

  // Determine color
  const metricColors: Record<string, string> = {
    calories: "#2563EB",
    protein: "#115E83",
    carbs: "#00B4D8",
    fat: "#90E0EF",
    sets: "#7C3AED",
    duration_minutes: "#7C3AED",
    distance_miles: "#7C3AED",
    calories_burned: "#7C3AED",
  };
  const color = metricColors[dsl.metric] ?? "#2563EB";

  // Build ChartSpec
  const chartSpec: ChartSpec = {
    chartType: dsl.chartType === "area" ? "line" : dsl.chartType,
    title: dsl.title,
    aiNote: dsl.aiNote ?? undefined,
    xAxis: { field: "label", label: dsl.groupBy === "date" ? "Date" : dsl.groupBy },
    yAxis: { label: dsl.derivedMetric || dsl.metric },
    color,
    data: dataPoints,
    dataKey: "value",
    dataSource: dsl.source,
    groupBy: dsl.groupBy,
    ...(DECIMAL_METRICS.has(dsl.metric) ? { valueFormat: "decimal1" as const } : {}),
  };

  return chartSpec;
}
