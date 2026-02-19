import type { ChartDSL, DailyTotals } from "./chart-types";
import type { ChartSpec } from "@/components/trends/DynamicChart";
import { format, getDay, getISOWeek, getISOWeekYear } from "date-fns";

// Re-export ChartDSL for backward compat
export type { ChartDSL } from "./chart-types";

// ── Known metrics ─────────────────────────────────────────

const FOOD_METRICS = ["cal", "protein", "carbs", "fat", "fiber", "sugar", "sat_fat", "sodium", "chol", "entries"] as const;
const EXERCISE_METRICS = ["sets", "duration", "distance", "cal_burned", "unique_exercises"] as const;

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
  cal_per_meal: (t) => t.entries > 0 ? Math.round((t.cal || 0) / t.entries) : 0,
  protein_per_meal: (t) => t.entries > 0 ? Math.round((t.protein || 0) / t.entries) : 0,
};

// ── Helpers ───────────────────────────────────────────────

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
      dataPoints = dateValues.map(({ date, value }) => ({
        rawDate: date,
        label: format(new Date(`${date}T12:00:00`), "MMM d"),
        value: Math.round(dsl.aggregation === "average" ? value : value),
      }));
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
        dataPoints.push({ label: "Weekdays", value: Math.round(aggregate(weekday, dsl.aggregation)) });
      }
      if (weekend.length > 0) {
        dataPoints.push({ label: "Weekends", value: Math.round(aggregate(weekend, dsl.aggregation)) });
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
            dsl.metric === "cal" ? item.totalCal :
            dsl.metric === "protein" ? item.totalProtein :
            item.count;
          dataPoints.push({
            label: label.length > 25 ? label.slice(0, 22) + "…" : label,
            value: Math.round(dsl.aggregation === "count" ? item.count : metricValue),
          });
        }
      } else if (dsl.source === "exercise" && dailyTotals.exerciseByItem) {
        const entries = Object.entries(dailyTotals.exerciseByItem);
        for (const [, item] of entries) {
          const metricValue =
            dsl.metric === "sets" ? item.totalSets :
            dsl.metric === "duration" ? item.totalDuration :
            dsl.metric === "cal_burned" ? item.totalCalBurned :
            item.count;
          dataPoints.push({
            label: item.description.length > 25 ? item.description.slice(0, 22) + "…" : item.description,
            value: Math.round(dsl.aggregation === "count" ? item.count : metricValue),
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

  // Determine color
  const metricColors: Record<string, string> = {
    cal: "#2563EB",
    protein: "#115E83",
    carbs: "#00B4D8",
    fat: "#90E0EF",
    sets: "#7C3AED",
    duration: "#7C3AED",
    distance: "#7C3AED",
    cal_burned: "#7C3AED",
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
