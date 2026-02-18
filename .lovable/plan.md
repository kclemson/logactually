

## AI-declared verification metadata for chart accuracy checking

### Problem

The client-side verifier currently guesses whether and how to validate a chart using heuristics (duplicate dates, x-axis field names, key mapping tables). This fails for categorical/aggregated charts (~30-40% of prompts), even though the AI knows exactly what data it used and how it computed each value.

### Core idea

Have the AI return a `verification` object in its JSON response that explicitly declares how to check its work. The client uses this declaration to verify against the piggybacked daily totals. No more guessing.

### New schema field: `verification`

Add to the prompt's JSON schema specification:

```json
"verification": {
  "type": "daily" | "aggregate" | "custom" | null,
  "source": "food" | "exercise",
  "field": "cal",
  "method": "sum" | "average" | "count" | "max" | "min",
  "breakdown": [...]
}
```

**Three verification types:**

| Type | When AI uses it | How client verifies |
|---|---|---|
| `daily` | One data point per date, value is a daily total | Look up `dailyTotals[source][rawDate][field]`, compare directly |
| `aggregate` | Categorical buckets that aggregate across multiple dates | AI provides `breakdown` array listing which dates went into each bucket; client sums/averages those dates from daily totals and compares |
| `null` | Derived metrics the AI can't map to a single field (ratios, percentages, counts of items) | Client shows "Verification not available" |

### Type: `daily` (simplest case)

AI returns:
```json
"verification": { "type": "daily", "source": "food", "field": "cal" }
```

Client logic: for each data point, compare `point[dataKey]` against `dailyTotals.food[point.rawDate].cal`. This replaces the current `FOOD_KEY_MAP` / `EXERCISE_KEY_MAP` lookup guessing.

### Type: `aggregate` (the big unlock)

AI returns:
```json
"verification": {
  "type": "aggregate",
  "source": "food",
  "field": "cal",
  "method": "average",
  "breakdown": [
    { "label": "Workout Days", "dates": ["2026-02-01", "2026-02-03"] },
    { "label": "Rest Days", "dates": ["2026-02-02", "2026-02-04"] }
  ]
}
```

Client logic: for each bucket in `breakdown`, look up `dailyTotals.food[date].cal` for each listed date, apply `method` (average/sum), compare against the data point whose label matches `breakdown.label`. This makes "workout vs rest days," "weekdays vs weekends," and "by day of week" charts all verifiable.

### Type: `null` (graceful decline)

For charts the AI knows it can't map cleanly (ratios, percentages, multi-field derived values), it returns `"verification": null`. Client shows "Verification not available for this chart type."

### Changes

**`supabase/functions/generate-chart/index.ts`** (prompt update)

Add to the JSON schema section:

```
"verification": {
  "type": "daily" or "aggregate" or null,
  "source": "food" or "exercise" (which dailyTotals to check against),
  "field": "cal" or "protein" or "sets" etc (the exact key name in the daily totals),
  "method": "sum" or "average" or "count" or "max" or "min" (for aggregate only),
  "breakdown": [
    {"label": "data point label", "dates": ["yyyy-MM-dd", ...]}
  ] (for aggregate only — lists which dates contributed to each bucket)
}

Set verification to null if the chart uses derived metrics (ratios, percentages, counts of distinct items) that cannot be verified against daily totals.
For "daily" type: source and field are required. Each data point's rawDate maps directly to dailyTotals[source][rawDate][field].
For "aggregate" type: source, field, method, and breakdown are all required. Each breakdown entry's label must match a data point's xAxisField value.
Field names must exactly match the daily totals keys: food uses cal, protein, carbs, fat, fiber, sugar, sat_fat, sodium, chol. Exercise uses sets, duration, distance, cal_burned, unique_exercises.
```

**`src/lib/chart-verification.ts`** (verification logic rewrite)

Replace the heuristic-based approach with declaration-driven logic:

1. If `spec.verification` is present and non-null, use it exclusively
2. If `spec.verification` is `null`, return unavailable with a reason
3. If `spec.verification` is missing entirely (backward compatibility with old cached charts), fall back to the existing heuristic-based approach (keep current `FOOD_KEY_MAP` / `EXERCISE_KEY_MAP` logic as a fallback)

New logic for `type: "daily"`:
- Look up `dailyTotals[verification.source][rawDate][verification.field]` for each point
- Compare with same tolerance as today (delta less than 5 or less than 1%)

New logic for `type: "aggregate"`:
- For each entry in `breakdown`, collect `dailyTotals[source][date][field]` for all listed dates
- Apply `method`: sum them, average them, count them, etc.
- Compare the computed value against the matching data point
- If a breakdown label doesn't match any data point, skip it

**`src/components/trends/DynamicChart.tsx`** (type update)

Add `verification` to `ChartSpec` interface:
```typescript
verification?: {
  type: "daily" | "aggregate" | null;
  source?: "food" | "exercise";
  field?: string;
  method?: "sum" | "average" | "count" | "max" | "min";
  breakdown?: Array<{ label: string; dates: string[] }>;
} | null;
```

**`src/components/CustomChartDialog.tsx`**

No changes needed — the existing `verifyChartData(currentSpec, dailyTotals)` call will automatically use the new declaration-driven path when the AI includes `verification` in its response.

### Backward compatibility

Charts saved before this change won't have a `verification` field. The existing heuristic fallback (current `FOOD_KEY_MAP` / `EXERCISE_KEY_MAP` approach) handles these. Over time, as charts are regenerated, more will include the declaration.

### Expected coverage improvement

| Chart type | Before | After |
|---|---|---|
| Daily time-series (calories, protein, etc.) | Verifiable | Verifiable (more reliably via AI declaration) |
| Categorical: workout vs rest, weekday vs weekend | Not verifiable | Verifiable via `aggregate` with `breakdown` |
| By day of week, by hour | Not verifiable | Verifiable via `aggregate` with `breakdown` |
| Derived: ratios, percentages | Not verifiable | Explicitly marked `null` (clear messaging) |
| Custom log charts | Not verifiable | Potentially verifiable if AI maps correctly |

Estimated coverage: 75-85% of common chart prompts become verifiable, up from ~50-60%.

### Files changed

| File | Change |
|---|---|
| `supabase/functions/generate-chart/index.ts` | Add `verification` field to prompt schema with instructions for daily, aggregate, and null types |
| `src/components/trends/DynamicChart.tsx` | Add `verification` to `ChartSpec` interface |
| `src/lib/chart-verification.ts` | Add declaration-driven verification for daily and aggregate types; keep existing heuristics as fallback for old charts |
