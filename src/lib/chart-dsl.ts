import type { ChartDSL, DailyTotals } from "./chart-types";
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
const EXERCISE_METRICS = ["sets", "duration_minutes", "distance_miles", "calories_burned", "unique_exercises", "entries"] as const;

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

type DetailPair = { label: string; value: string };

/** Build a compact secondary-details array, filtering out zeros and the primary metric */
function buildDetails(
  pairs: Array<{ label: string; value: number | null | undefined }>,
  excludeLabel?: string,
): DetailPair[] {
  return pairs
    .filter((p) => p.label !== excludeLabel && p.value != null && p.value !== 0)
    .map((p) => ({
      label: p.label,
      value: typeof p.value === "number"
        ? (p.value >= 1000 ? p.value.toLocaleString("en-US", { maximumFractionDigits: 0 }) : String(Math.round(p.value!)))
        : String(p.value),
    }));
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
      dataPoints = dateValues.map(({ date, value }) => {
        const foodDay = dailyTotals.food[date];
        const exDay = dailyTotals.exercise[date];
        const details = dsl.source === "food"
          ? buildDetails([
              { label: "calories", value: foodDay?.calories },
              { label: "protein", value: foodDay?.protein },
              { label: "carbs", value: foodDay?.carbs },
              { label: "fat", value: foodDay?.fat },
              { label: "fiber", value: foodDay?.fiber },
              { label: "entries", value: foodDay?.entries },
            ], dsl.derivedMetric || dsl.metric)
          : buildDetails([
              { label: "sets", value: exDay?.sets },
              { label: "duration_minutes", value: exDay?.duration_minutes },
              { label: "distance_miles", value: exDay?.distance_miles },
              { label: "calories_burned", value: exDay?.calories_burned },
              { label: "entries", value: exDay?.entries },
            ], dsl.metric);
        return {
          rawDate: date,
          label: format(new Date(`${date}T12:00:00`), "MMM d"),
          value: Math.round(value),
          _details: details,
        };
      });
      break;
    }
    case "dayOfWeek": {
      const buckets: Record<number, number[]> = {};
      for (const { date, value } of dateValues) {
        const dow = getDayOfWeek(date);
        (buckets[dow] ??= []).push(value);
      }
      const dayOrder = [1, 2, 3, 4, 5, 6, 0];
      for (const dow of dayOrder) {
        const vals = buckets[dow];
        if (!vals || vals.length === 0) continue;
        dataPoints.push({
          label: DAY_NAMES[dow],
          value: Math.round(aggregate(vals, dsl.aggregation)),
          _details: [{ label: "days", value: String(vals.length) }],
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
      if (weekday.length > 0) {
        dataPoints.push({ label: "Weekdays", value: Math.round(aggregate(weekday, dsl.aggregation)), _details: [{ label: "days", value: String(weekday.length) }] });
      }
      if (weekend.length > 0) {
        dataPoints.push({ label: "Weekends", value: Math.round(aggregate(weekend, dsl.aggregation)), _details: [{ label: "days", value: String(weekend.length) }] });
      }
      break;
    }
    case "week": {
      const buckets: Record<string, number[]> = {};
      const weekDates: Record<string, string> = {};
      for (const { date, value } of dateValues) {
        const d = new Date(`${date}T12:00:00`);
        const weekKey = `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, "0")}`;
        (buckets[weekKey] ??= []).push(value);
        if (!weekDates[weekKey] || date > weekDates[weekKey]) {
          weekDates[weekKey] = date;
        }
      }
      for (const weekKey of Object.keys(buckets).sort()) {
        dataPoints.push({
          rawDate: weekDates[weekKey],
          label: weekKey,
          value: Math.round(aggregate(buckets[weekKey], dsl.aggregation)),
          _details: [{ label: "days", value: String(buckets[weekKey].length) }],
        });
      }
      break;
    }
    case "hourOfDay": {
      const hourlySource = dsl.source === "food"
        ? dailyTotals.foodByHour
        : dailyTotals.exerciseByHour;

      if (!hourlySource) break;

      for (let hour = 0; hour < 24; hour++) {
        const entries = hourlySource[hour];
        if (!entries || entries.length === 0) continue;

        const values = entries.map((entry) => {
          if (dsl.derivedMetric && DERIVED_FORMULAS[dsl.derivedMetric]) {
            return DERIVED_FORMULAS[dsl.derivedMetric](entry as unknown as Record<string, number>);
          }
          return (entry as any)[dsl.metric] ?? 0;
        });

        dataPoints.push({
          label: HOUR_LABELS[hour],
          value: Math.round(aggregate(values, dsl.aggregation)),
          _details: [{ label: "entries", value: String(entries.length) }],
        });
      }
      break;
    }
    case "item": {
      if (dsl.source === "food" && dailyTotals.foodByItem) {
        const entries = Object.entries(dailyTotals.foodByItem);
        for (const [label, item] of entries) {
          const metricValue =
            dsl.metric === "entries" ? item.count :
            dsl.metric === "calories" ? item.totalCalories :
            dsl.metric === "protein" ? item.totalProtein :
            item.count;
          dataPoints.push({
            label: label.length > 25 ? label.slice(0, 22) + "…" : label,
            value: Math.round(dsl.aggregation === "count" ? item.count : metricValue),
            _details: buildDetails([
              { label: "entries", value: item.count },
              { label: "calories", value: item.totalCalories },
              { label: "protein", value: item.totalProtein },
            ], dsl.metric === "entries" ? "entries" : dsl.metric === "calories" ? "calories" : dsl.metric === "protein" ? "protein" : undefined),
          });
        }
      } else if (dsl.source === "exercise" && dailyTotals.exerciseByItem) {
        const entries = Object.entries(dailyTotals.exerciseByItem);
        for (const [, item] of entries) {
          const metricValue =
            dsl.metric === "sets" ? item.totalSets :
            dsl.metric === "duration_minutes" ? item.totalDurationMinutes :
            dsl.metric === "calories_burned" ? item.totalCaloriesBurned :
            item.count;
          dataPoints.push({
            label: item.description.length > 25 ? item.description.slice(0, 22) + "…" : item.description,
            value: Math.round(dsl.aggregation === "count" ? item.count : metricValue),
            _details: buildDetails([
              { label: "entries", value: item.count },
              { label: "sets", value: item.totalSets },
              { label: "duration_minutes", value: item.totalDurationMinutes },
              { label: "calories_burned", value: item.totalCaloriesBurned },
            ], dsl.metric === "sets" ? "sets" : dsl.metric === "duration_minutes" ? "duration_minutes" : dsl.metric === "calories_burned" ? "calories_burned" : undefined),
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
            dsl.metric === "duration_minutes" ? totals.duration_minutes :
            dsl.metric === "distance_miles" ? totals.distance_miles :
            dsl.metric === "calories_burned" ? totals.calories_burned :
            totals.sets;
          dataPoints.push({
            label,
            value: Math.round(metricValue),
            _details: buildDetails([
              { label: "sets", value: totals.sets },
              { label: "duration_minutes", value: totals.duration_minutes },
              { label: "distance_miles", value: totals.distance_miles },
              { label: "calories_burned", value: totals.calories_burned },
              { label: "entries", value: totals.entries },
            ], dsl.metric),
          });
        }
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
    xAxis: { field: "label", label: dsl.groupBy === "date" ? "Date" : dsl.groupBy },
    yAxis: { label: dsl.derivedMetric || dsl.metric },
    color,
    data: dataPoints,
    dataKey: "value",
    dataSource: dsl.source,
  };

  return chartSpec;
}
