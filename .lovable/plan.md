

## Add "Verify accuracy" to AI charts via piggybacked daily totals

### Approach

Instead of a separate edge function, return the already-computed daily totals alongside the chartSpec from generate-chart. The client performs the comparison locally. This avoids duplicating aggregation logic and eliminates a second API call.

### Scope of validation

Validation works for **daily time-series charts** where the `dataKey` maps to a known food macro or exercise aggregate. For categorical, derived, or unrecognized chart types, the button shows "Validation not available for this chart type." This covers roughly 60-70% of common chart requests.

### Changes

**`supabase/functions/generate-chart/index.ts`**

Include the pre-computed daily totals in the response payload:

```typescript
return new Response(JSON.stringify({
  chartSpec,
  dailyTotals: {
    food: Object.fromEntries(dailyFoodTotals),    // { "2026-01-22": { cal: 3144, protein: 95, ... }, ... }
    exercise: Object.fromEntries(dailyExTotals),   // serialized without Set (convert exercises to count)
  },
}), { ... });
```

Serialize exercise `Set<string>` to `exercises: t.exercises.size` before returning.

**`src/hooks/useGenerateChart.ts`**

Update return type to include `dailyTotals` alongside `chartSpec`. Store both in the mutation result.

**`src/components/CustomChartDialog.tsx`**

- Store `dailyTotals` from the generate-chart response alongside `currentSpec`
- Add a "Verify accuracy" button (next to "Show debug JSON")
- On click, run client-side comparison:
  1. Check if chart has `rawDate` fields in data and a recognized `dataKey`
  2. Map `dataKey` to the corresponding totals field using a lookup table:
     - `calories|cal|total_calories` maps to food `.cal`
     - `protein` maps to food `.protein`
     - `carbs` maps to food `.carbs`
     - `fat` maps to food `.fat`
     - `fiber` maps to food `.fiber`
     - `sugar` maps to food `.sugar`
     - `sodium` maps to food `.sodium`
     - `cholesterol|chol` maps to food `.chol`
     - `sat_fat|saturated_fat` maps to food `.sat_fat`
     - `sets|logged_sets` maps to exercise `.sets`
     - `duration|duration_min` maps to exercise `.duration`
     - `distance` maps to exercise `.distance`
     - `cal_burned` maps to exercise `.cal_burned`
  3. For each data point, compare AI value vs actual value
  4. Display results inline

- If `dataKey` doesn't match any known field, or chart has no `rawDate`, show: "Verification isn't available for this chart type"

**Verification results UI** (below chart, compact):

```
Accuracy: 27/28 match (96%)        [green tint]
Mismatches:
  Feb 14: AI=2188, actual=2244 (delta: -56)
```

Color coding: green (>95%), yellow (>80%), red (below 80%). Threshold for "match": values within 1% or delta less than 5.

### Files changed

| File | Change |
|------|--------|
| `supabase/functions/generate-chart/index.ts` | Include `dailyTotals` (food + exercise) in response JSON; serialize exercise Set to count |
| `src/hooks/useGenerateChart.ts` | Update return type to include dailyTotals; store in mutation result |
| `src/components/CustomChartDialog.tsx` | Store dailyTotals; add "Verify accuracy" button; client-side comparison logic with dataKey mapping table; inline results display |

### What this does NOT validate

- Categorical charts (by hour, by day of week, by group)
- Derived metrics (ratios, percentages, averages of averages)
- Charts mixing food and exercise data
- Custom log charts (could be added later with a type-name lookup)

These cases gracefully degrade to a "not available" message.

### Future extensibility

The dataKey mapping table is a simple object literal. Adding new metrics (e.g., from custom logs) means adding one line to the table. No schema or edge function changes needed.
