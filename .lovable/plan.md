

## Two Changes

### 1. Tooltip shows "value: 106" instead of the metric name

Recharts auto-generates tooltip payload using the `dataKey` as the display name. Since `dataKey` is always `"value"`, the tooltip says "value: 106" on desktop hover. The touch path already overrides this correctly (line 158 sets `name: spec.yAxis.label`), but desktop relies on Recharts defaults.

**Fix**: Add `name={spec.yAxis.label}` to both `<Line>` and `<Bar>` in `DynamicChart.tsx`. This makes Recharts use the metric name (e.g., "heart_rate") as the tooltip label for both touch and desktop.

Additionally, the raw field names like `heart_rate` and `duration_minutes` should be humanized in the display. I'll add a small label map to format these (e.g., "heart rate", "duration (min)").

### 2. Remove generic `_details` for date-grouped charts

The current tooltip shows a dump of all daily metrics (sets, duration_minutes, distance_miles, calories_burned, entries) regardless of relevance. The user wants to remove this generic fallback entirely for date-grouped charts — the tooltip should just show the date, the primary metric value, and the "Go to day" link on mobile.

**Fix**: In `chart-dsl.ts`, set `_details: []` for the `"date"` groupBy case (lines 186–202) instead of building details from all daily metrics. Other groupBy modes (dayOfWeek, item, category, etc.) keep their details since those are curated and contextually relevant.

### Files changed

| File | Change |
|------|--------|
| `src/components/trends/DynamicChart.tsx` | Add `name={spec.yAxis.label}` to `<Line>` and `<Bar>`; add a label humanizer for the formatter |
| `src/lib/chart-dsl.ts` | Set `_details: []` for `groupBy: "date"` case (both food and exercise) |

