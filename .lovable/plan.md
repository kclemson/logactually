

## Add "avg" and "today" Stats to PCF Chart Titles

The Protein, Carbs, and Fat charts currently show `Protein (avg: 75)` in the title. This change adds today's value and moves the stats to a subtitle on narrower layouts for readability.

### Approach

Use the same title/subtitle pattern as the exercise charts: the `ChartTitle` shows just the macro name, and a `ChartSubtitle` underneath shows `avg: X · today: Y`.

### Changes

**1. `src/components/trends/FoodChart.tsx` -- Add `subtitle` prop to `FoodChart`**

- Add an optional `subtitle` prop to the `FoodChartProps` interface
- Render it using `ChartSubtitle` below the `ChartTitle`, matching the pattern used by `VolumeChart` and the exercise charts in Trends

**2. `src/pages/Trends.tsx` -- Compute today's values and pass subtitle**

- Add a `todayValues` memo that finds today's date in `chartData` and extracts protein/carbs/fat/calories (defaulting to 0 if no entry for today)
- Change the PCF `FoodChart` calls (the `charts.slice(1).map(...)` block) to:
  - Set `title` to just the label (e.g., `"Protein"`)
  - Set `subtitle` to `avg: 75 · today: 109` using the existing `averages` object and the new `todayValues`
- Also update the Calories chart title similarly: title = `"Calories"`, subtitle = `avg: X · today: Y`

### Result

Each chart will show:
```
Protein
avg: 75 · today: 109
```

This fits within the narrow cols-3 grid on mobile since the subtitle text is 10px and the title is just one word.
