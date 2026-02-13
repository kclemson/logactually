
## Switch Custom Trends to Column Charts in 2-Column Grid

### Changes

**File: `src/pages/Trends.tsx`**

#### 1. Replace `CustomLogTrendChart` implementation (lines ~426-492)

Replace the `LineChart`-based component with one that uses the existing `FoodChart` component (for single-series numeric types) or `StackedMacroChart` (for multi-series text_numeric types). This gives click-to-navigate behavior for free.

- Reshape the `chartData` to include `rawDate`, `showLabel`, and `showLabelFullWidth` fields as required by `FoodChart`
- For **numeric** types (single series): render a `FoodChart` with `dataKey` set to the series label, `color` from the teal palette, and `onNavigate` pointing to `/custom?date=${date}`
- For **text_numeric** types (multiple series): render a `StackedMacroChart` with one bar per label, stacked, using the teal palette for colors, and the same navigate behavior
- Remove the `LineChart`, `Line`, `CartesianGrid`, `YAxis` imports (if no longer used elsewhere)

#### 2. Update the section layout (lines ~931)

Change the container from `space-y-3` to `grid grid-cols-2 gap-3` so charts appear two-across, matching the exercise trends layout.

### Technical detail

The reshaped chart data for a numeric type will look like:
```ts
{
  rawDate: "2025-02-10",
  date: "Feb 10",
  showLabel: true,
  showLabelFullWidth: true,
  [seriesLabel]: 185  // e.g. "Weight": 185
}
```

For text_numeric (multiple labels like "Bench Press: 200, Squat: 300"), each label becomes a separate bar dataKey in a stacked chart, with `isTop` on the last bar in the array.

Navigation: `onNavigate={(date) => navigate(`/custom?date=${date}`)}`

No new files or dependencies needed -- this reuses `FoodChart` and `StackedMacroChart` already imported in Trends.tsx.
