
# Debugging: Append v1/v2 to the saved chart subtitle

## What & Why

Each saved chart on the Trends page already has a subtitle like "Last 30 days" rendered via the `timeRange` prop in `ChartCard`. The v1/v2 signal is already available in the data: `chart.chart_dsl` is non-null for v2-generated charts and null for v1. This change threads that signal through to the subtitle.

## Minimal approach (two files, no schema changes)

### 1. `src/components/trends/DynamicChart.tsx`

Add an optional `timeRangeSuffix?: string` prop to `DynamicChartProps`. When present, append it to the `periodLabel()` string passed to `ChartCard`:

```ts
// Before
timeRange={periodLabel(period)}

// After
timeRange={[periodLabel(period), timeRangeSuffix].filter(Boolean).join(" ")}
```

This means the suffix only appears when a period label exists. If `period` is undefined (no label), no suffix either.

### 2. `src/pages/Trends.tsx`

When rendering saved charts, derive the suffix from `chart.chart_dsl`:

```tsx
<DynamicChart
  key={chart.id}
  spec={chart.chart_spec}
  period={selectedPeriod}
  timeRangeSuffix={chart.chart_dsl ? "· v2" : "· v1"}
  ...
/>
```

That's it. Two small targeted edits, no schema changes, no edge function changes, no other components affected.

## Result

Saved charts will show subtitles like:
- `Last 30 days · v2` (generated via DSL)
- `Last 30 days · v1` (generated via legacy AI data engine or before v2 existed)

Easily removable later by deleting the `timeRangeSuffix` prop from the Trends render.
