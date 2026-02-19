import { describe, it, expect } from "vitest";
import { executeDSL } from "./chart-dsl";
import type { ChartDSL, DailyTotals } from "./chart-types";

const makeTotals = (): DailyTotals => ({
  food: {
    "2026-02-16": { calories: 2000, protein: 150, carbs: 200, fat: 80, fiber: 25, sugar: 40, saturated_fat: 20, sodium: 1500, cholesterol: 200, entries: 3 },
    "2026-02-17": { calories: 1800, protein: 130, carbs: 180, fat: 70, fiber: 20, sugar: 35, saturated_fat: 18, sodium: 1200, cholesterol: 180, entries: 2 },
    "2026-02-18": { calories: 2200, protein: 160, carbs: 220, fat: 90, fiber: 30, sugar: 50, saturated_fat: 25, sodium: 1800, cholesterol: 250, entries: 4 },
    // 2026-02-16 = Mon, 17 = Tue, 18 = Wed
  },
  exercise: {
    "2026-02-16": { sets: 12, duration_minutes: 45, distance_miles: 0, calories_burned: 300, unique_exercises: 4, entries: 6 },
    "2026-02-17": { sets: 0, duration_minutes: 30, distance_miles: 3.5, calories_burned: 250, unique_exercises: 1, entries: 1 },
  },
});

describe("executeDSL", () => {
  it("produces daily time series for food calories", () => {
    const dsl: ChartDSL = {
      chartType: "bar",
      title: "Daily Calories",
      source: "food",
      metric: "calories",
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
      metric: "calories",
      groupBy: "dayOfWeek",
      aggregation: "average",
    };
    const result = executeDSL(dsl, makeTotals());
    expect(result.data).toHaveLength(3);
    expect(result.data[0].label).toBe("Mon");
    expect(result.data[0].value).toBe(2000);
  });

  it("groups weekday vs weekend", () => {
    const dsl: ChartDSL = {
      chartType: "bar",
      title: "Weekday vs Weekend",
      source: "food",
      metric: "calories",
      groupBy: "weekdayVsWeekend",
      aggregation: "average",
    };
    const result = executeDSL(dsl, makeTotals());
    expect(result.data).toHaveLength(1);
    expect(result.data[0].label).toBe("Weekdays");
  });

  it("computes derived metric protein_pct", () => {
    const dsl: ChartDSL = {
      chartType: "line",
      title: "Protein %",
      source: "food",
      metric: "calories",
      derivedMetric: "protein_pct",
      groupBy: "date",
      aggregation: "sum",
    };
    const result = executeDSL(dsl, makeTotals());
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
      metric: "calories",
      groupBy: "date",
      aggregation: "sum",
      filter: { dayOfWeek: [1] },
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
      metric: "calories",
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
      metric: "calories",
      groupBy: "date",
      aggregation: "sum",
    };
    const result = executeDSL(dsl, makeTotals());
    expect(result.chartType).toBe("line");
  });

  it("groups by hourOfDay using foodByHour data", () => {
    const totals: DailyTotals = {
      food: {},
      exercise: {},
      foodByHour: {
        7:  [{ calories: 400, protein: 20, carbs: 50, fat: 15, fiber: 5, sugar: 10, saturated_fat: 5, sodium: 300, cholesterol: 50, entries: 1 }],
        12: [
          { calories: 600, protein: 30, carbs: 70, fat: 20, fiber: 8, sugar: 15, saturated_fat: 7, sodium: 500, cholesterol: 80, entries: 1 },
          { calories: 500, protein: 25, carbs: 60, fat: 18, fiber: 6, sugar: 12, saturated_fat: 6, sodium: 400, cholesterol: 70, entries: 1 },
        ],
        19: [{ calories: 800, protein: 40, carbs: 90, fat: 30, fiber: 10, sugar: 20, saturated_fat: 10, sodium: 700, cholesterol: 100, entries: 1 }],
      },
    };

    const dsl: ChartDSL = {
      chartType: "bar",
      title: "Calories by Hour",
      source: "food",
      metric: "calories",
      groupBy: "hourOfDay",
      aggregation: "sum",
    };

    const result = executeDSL(dsl, totals);
    expect(result.data).toHaveLength(3);
    expect(result.data[0].label).toBe("7am");
    expect(result.data[0].value).toBe(400);
    expect(result.data[1].label).toBe("12pm");
    expect(result.data[1].value).toBe(1100); // 600 + 500
    expect(result.data[2].label).toBe("7pm");
    expect(result.data[2].value).toBe(800);
  });

  it("groups by hourOfDay with average aggregation", () => {
    const totals: DailyTotals = {
      food: {},
      exercise: {},
      foodByHour: {
        12: [
          { calories: 600, protein: 30, carbs: 70, fat: 20, fiber: 8, sugar: 15, saturated_fat: 7, sodium: 500, cholesterol: 80, entries: 1 },
          { calories: 400, protein: 20, carbs: 50, fat: 15, fiber: 5, sugar: 10, saturated_fat: 5, sodium: 300, cholesterol: 50, entries: 1 },
        ],
      },
    };

    const dsl: ChartDSL = {
      chartType: "bar",
      title: "Avg Calories by Hour",
      source: "food",
      metric: "calories",
      groupBy: "hourOfDay",
      aggregation: "average",
    };

    const result = executeDSL(dsl, totals);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].label).toBe("12pm");
    expect(result.data[0].value).toBe(500); // (600+400)/2
  });

  it("handles old metric keys via backward compat map", () => {
    const dsl: ChartDSL = {
      chartType: "bar",
      title: "Daily Calories (old key)",
      source: "food",
      metric: "cal", // old key
      groupBy: "date",
      aggregation: "sum",
    };
    const result = executeDSL(dsl, makeTotals());
    expect(result.data).toHaveLength(3);
    expect(result.data[0].value).toBe(2000);
  });
});
