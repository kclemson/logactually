

# Fix categorical X-axis detection using DSL `groupBy`

## Problem
The current `isCategorical` check (`xAxis.field === "label"`) is always true for DSL-generated charts because `executeDSL` sets `field: "label"` for every `groupBy` type. This means date-based charts get forced `interval: 0` (showing every label) and multi-line ticks, while the actual categorical charts (like "by exercise") still clip.

## Solution
Pass the `groupBy` value from the DSL through to `ChartSpec` so `DynamicChart` can deterministically know whether the X-axis is categorical. Only `"item"` and `"category"` are truly categorical; everything else (`"date"`, `"week"`, `"dayOfWeek"`, `"hourOfDay"`, `"weekdayVsWeekend"`, `"dayClassification"`) uses fixed/ordered labels.

## Technical Details

### 1. `src/components/trends/DynamicChart.tsx` -- Add `groupBy` to `ChartSpec` and use it

Add an optional `groupBy` field to the `ChartSpec` interface:

```typescript
groupBy?: "date" | "dayOfWeek" | "hourOfDay" | "weekdayVsWeekend" | "week" | "item" | "category" | "dayClassification";
```

Replace the broken heuristic:

```typescript
// Before (always true for DSL charts):
const isCategorical = xAxis.field === "label";

// After (deterministic):
const isCategorical = spec.groupBy === "item" || spec.groupBy === "category";
```

Keep the `MultiLineTick` renderer and conditional axis props as-is -- they will now only activate for actual categorical charts.

### 2. `src/lib/chart-dsl.ts` -- Emit `groupBy` in ChartSpec

In the returned `ChartSpec` object (~line 558), add:

```typescript
groupBy: dsl.groupBy,
```

| File | Change |
|---|---|
| `src/components/trends/DynamicChart.tsx` | Add optional `groupBy` to `ChartSpec`; replace `xAxis.field === "label"` with `groupBy === "item" or "category"` |
| `src/lib/chart-dsl.ts` | Pass `dsl.groupBy` through to the returned `ChartSpec` |

