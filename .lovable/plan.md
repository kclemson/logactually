

## Richer tooltips for dynamic charts

### Approach

Attach a generic `_details` array of `{label, value}` pairs to each data point inside `executeDSL`. The tooltip component renders these automatically -- no chart-specific logic needed.

### What shows up in tooltips

| groupBy | Extra details shown |
|---|---|
| `date` | All non-zero metrics for that day (e.g. cal, protein, sets, duration) |
| `item` (food) | count, totalCal, totalProtein (excluding the primary metric) |
| `item` (exercise) | count, totalSets, totalDuration, totalCalBurned (excluding primary) |
| `category` | sets, duration, distance, cal_burned, entries (excluding primary) |
| `dayOfWeek` / `week` / `weekdayVsWeekend` | number of days in the bucket |
| `hourOfDay` | number of entries in the bucket |

### Changes

| File | Change |
|---|---|
| `src/lib/chart-dsl.ts` | In each `groupBy` branch, attach a `_details` array to each data point with the relevant secondary metrics (skipping the primary metric to avoid duplication). Add a helper function `buildDetails(pairs)` that filters out zero/null values and formats numbers. |
| `src/components/trends/CompactChartTooltip.tsx` | After rendering the main payload rows, check for `payload[0]?.payload?._details` and render each as a small `text-[10px]` line in muted color. |
| `src/components/trends/DynamicChart.tsx` | No changes needed -- `_details` flows through the existing data pipeline automatically. |

### Example tooltip output

For a "top 10 foods by fiber" bar:

```
Oatmeal
Fiber: 8g
---
12 entries, 1440 cal, 48g protein
```

The details line is rendered in muted text below the primary value.

### Technical detail

`_details` structure:
```typescript
_details: Array<{ label: string; value: string }>
// e.g. [{ label: "entries", value: "12" }, { label: "cal", value: "1,440" }]
```

The tooltip renders them as a comma-separated line or as individual rows depending on count, keeping things compact.
