import { describe, it, expect } from "vitest";
import { executeDSL, type ChartDSL } from "./chart-dsl";
import type { DailyTotals } from "@/hooks/useGenerateChart";

const makeTotals = (): DailyTotals => ({
  food: {
    "2026-02-16": { cal: 2000, protein: 150, carbs: 200, fat: 80, fiber: 25, sugar: 40, sat_fat: 20, sodium: 1500, chol: 200, entries: 3 },
    "2026-02-17": { cal: 1800, protein: 130, carbs: 180, fat: 70, fiber: 20, sugar: 35, sat_fat: 18, sodium: 1200, chol: 180, entries: 2 },
    "2026-02-18": { cal: 2200, protein: 160, carbs: 220, fat: 90, fiber: 30, sugar: 50, sat_fat: 25, sodium: 1800, chol: 250, entries: 4 },
    // 2026-02-16 = Mon, 17 = Tue, 18 = Wed
  },
  exercise: {
    "2026-02-16": { sets: 12, duration: 45, distance: 0, cal_burned: 300, unique_exercises: 4 },
    "2026-02-17": { sets: 0, duration: 30, distance: 3.5, cal_burned: 250, unique_exercises: 1 },
  },
});

describe("executeDSL", () => {
  it("produces daily time series for food calories", () => {
    const dsl: ChartDSL = {
      chartType: "bar",
      title: "Daily Calories",
      source: "food",
      metric: "cal",
      groupBy: "date",
      aggregation: "sum",
    };
    const result = executeDSL(dsl, makeTotals());
    expect(result.chartType).toBe("bar");
    expect(result.data).toHaveLength(3);
    expect(result.data[0].value).toBe(2000);
    expect(result.data[2].value).toBe(2200);
    expect(result.dataKey).toBe("value");
  });

  it("groups by dayOfWeek with average aggregation", () => {
    const dsl: ChartDSL = {
      chartType: "bar",
      title: "Avg Calories by Day",
      source: "food",
      metric: "cal",
      groupBy: "dayOfWeek",
      aggregation: "average",
    };
    const result = executeDSL(dsl, makeTotals());
    // Mon=2000, Tue=1800, Wed=2200 — each day has 1 value
    expect(result.data).toHaveLength(3);
    expect(result.data[0].label).toBe("Mon");
    expect(result.data[0].value).toBe(2000);
  });

  it("groups weekday vs weekend", () => {
    const dsl: ChartDSL = {
      chartType: "bar",
      title: "Weekday vs Weekend",
      source: "food",
      metric: "cal",
      groupBy: "weekdayVsWeekend",
      aggregation: "average",
    };
    const result = executeDSL(dsl, makeTotals());
    // All 3 dates are weekdays
    expect(result.data).toHaveLength(1);
    expect(result.data[0].label).toBe("Weekdays");
  });

  it("computes derived metric protein_pct", () => {
    const dsl: ChartDSL = {
      chartType: "line",
      title: "Protein %",
      source: "food",
      metric: "cal",
      derivedMetric: "protein_pct",
      groupBy: "date",
      aggregation: "sum",
    };
    const result = executeDSL(dsl, makeTotals());
    // Day 1: protein=150 → 600cal / (600+800+720)=2120 → 28%
    expect(result.data[0].value).toBe(28);
  });

  it("handles exercise source", () => {
    const dsl: ChartDSL = {
      chartType: "bar",
      title: "Daily Sets",
      source: "exercise",
      metric: "sets",
      groupBy: "date",
      aggregation: "sum",
    };
    const result = executeDSL(dsl, makeTotals());
    expect(result.data).toHaveLength(2);
    expect(result.data[0].value).toBe(12);
  });

  it("applies dayOfWeek filter", () => {
    const dsl: ChartDSL = {
      chartType: "bar",
      title: "Monday Calories",
      source: "food",
      metric: "cal",
      groupBy: "date",
      aggregation: "sum",
      filter: { dayOfWeek: [1] }, // Monday only
    };
    const result = executeDSL(dsl, makeTotals());
    expect(result.data).toHaveLength(1);
    expect(result.data[0].value).toBe(2000);
  });

  it("sorts by value_desc", () => {
    const dsl: ChartDSL = {
      chartType: "bar",
      title: "Calories by Day",
      source: "food",
      metric: "cal",
      groupBy: "dayOfWeek",
      aggregation: "sum",
      sort: "value_desc",
    };
    const result = executeDSL(dsl, makeTotals());
    expect(result.data[0].value).toBeGreaterThanOrEqual(result.data[1].value);
  });

  it("maps area chartType to line", () => {
    const dsl: ChartDSL = {
      chartType: "area",
      title: "Test",
      source: "food",
      metric: "cal",
      groupBy: "date",
      aggregation: "sum",
    };
    const result = executeDSL(dsl, makeTotals());
    expect(result.chartType).toBe("line");
  });
});
