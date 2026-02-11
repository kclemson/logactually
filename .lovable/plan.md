

## Add Sub-headers to Volume and Calorie Burn Charts

The exercise charts (Walking, Running, etc.) each have a subtitle line beneath the title (e.g., "Cardio · time"), which makes them taller than the Volume and Calorie Burn charts. Adding a subtitle to both will align their heights.

### Suggested sub-headers

- **Total Volume (lbs)** -- subtitle: "All exercises" (describes what's aggregated)
- **Est. Calorie Burn** -- subtitle: "Daily range" (describes what the band represents)

These are short, descriptive, and match the style of the existing subtitles like "Cardio · time" or "Back · weight".

### Changes

**`src/components/trends/FoodChart.tsx`** (VolumeChart)

- Add a `subtitle` prop (optional string) to `VolumeChartProps`
- Render `<ChartSubtitle>{subtitle}</ChartSubtitle>` below `<ChartTitle>` inside the `CardHeader`, wrapped in a `flex-col gap-0.5` div to match the exercise chart layout

**`src/components/trends/CalorieBurnChart.tsx`**

- Add a `subtitle` prop (optional string) to `CalorieBurnChartProps`
- Render `<ChartSubtitle>{subtitle}</ChartSubtitle>` below `<ChartTitle>` inside the `CardHeader`, same layout

**`src/pages/Trends.tsx`**

- Pass `subtitle="All exercises"` to the `VolumeChart`
- Pass `subtitle="Daily range"` to the `CalorieBurnChart`

### Alternative sub-header ideas (if you prefer different wording)

- Volume: "Strength training" / "Weekly total" / "Excludes cardio"
- Calorie Burn: "Estimated range" / "All activities" / "Low-high estimate"
