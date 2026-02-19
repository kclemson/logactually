
## Fix: Two root causes for the "calorie count as item count" bug

### What actually happened

The query returned counts (39, 18, 17) instead of calorie sums. Two things combined to cause this:

**Root cause 1 — schema description uses column names, not metric keys**

The system prompt's DATABASE SCHEMA section describes the food table columns as `total_calories, total_protein, total_carbs, total_fat`. This is correct for the raw database columns, but the DSL `metric` field is supposed to use the short form: `calories`, `protein`, etc. The model saw `total_calories` in the schema and used it as the metric key. Since `total_calories` doesn't match any known metric, the `item` groupBy fallback in `chart-dsl.ts` silently returned `item.count`.

**Root cause 2 — the item groupBy in `chart-dsl.ts` has an incomplete mapping with a silent count fallback**

The food `item` branch (lines 264–279 of `chart-dsl.ts`) only explicitly handles `calories` and `protein`. For every other metric — `fat`, `carbs`, `fiber`, `sugar`, etc. — it falls through to `item.count`. This is a silent data corruption: the chart renders with plausible-looking values that are actually frequencies, not the requested metric.

---

### The fixes

**Fix 1 — `supabase/functions/generate-chart-dsl/index.ts` (system prompt, ~1 line)**

Change the schema description from raw column names to metric key names, matching exactly what the AVAILABLE METRICS section already says. Replace:

```
total_calories, total_protein, total_carbs, total_fat (numeric): pre-aggregated entry totals
```

with:

```
calories, protein, carbs, fat (numeric): pre-aggregated entry totals
```

This eliminates the `total_calories` confusion at the source. The model will now use `calories` as the metric key, which correctly maps through the DSL engine.

**Fix 2 — `src/lib/chart-dsl.ts` (item groupBy food branch)**

Expand `foodByItem` to store all the metrics that could be queried per item, and fix the metric selection switch to cover all of them. Currently `foodByItem` only stores `count`, `totalCalories`, and `totalProtein`. It needs to also store `totalCarbs`, `totalFat`, `totalFiber`, `totalSugar`, `totalSaturatedFat`, `totalSodium`, `totalCholesterol`.

Changes needed in two places:

1. **`chart-types.ts`** — extend the `foodByItem` type:
```typescript
foodByItem?: Record<string, {
  count: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalSugar: number;
  totalSaturatedFat: number;
  totalSodium: number;
  totalCholesterol: number;
}>;
```

2. **`chart-data.ts`** — accumulate those fields in the `foodByItem` loop (already iterating `item.carbs`, `item.fat`, etc. for the daily totals — just also add them to `foodByItem[key]`)

3. **`chart-dsl.ts`** — expand the metric switch to cover all metrics instead of falling back to count:
```typescript
const metricValue =
  dsl.metric === "entries"   ? item.count :
  dsl.metric === "calories"  ? item.totalCalories :
  dsl.metric === "protein"   ? item.totalProtein :
  dsl.metric === "carbs"     ? item.totalCarbs :
  dsl.metric === "fat"       ? item.totalFat :
  dsl.metric === "fiber"     ? item.totalFiber :
  dsl.metric === "sugar"     ? item.totalSugar :
  dsl.metric === "saturated_fat" ? item.totalSaturatedFat :
  dsl.metric === "sodium"    ? item.totalSodium :
  dsl.metric === "cholesterol" ? item.totalCholesterol :
  item.count; // genuine fallback for unknown metrics
```

The fallback to `item.count` stays as a last resort, but it will no longer silently trigger for any legitimate food metric.

---

### Files changed

| File | Change |
|---|---|
| `supabase/functions/generate-chart-dsl/index.ts` | Fix schema description: `total_calories/protein/carbs/fat` → `calories/protein/carbs/fat` |
| `src/lib/chart-types.ts` | Extend `foodByItem` type with all macro fields |
| `src/lib/chart-data.ts` | Accumulate `totalCarbs`, `totalFat`, `totalFiber`, etc. in the `foodByItem` aggregation loop |
| `src/lib/chart-dsl.ts` | Expand food `item` metric switch to cover all macros; remove silent count fallback for known metrics |

### What stays the same

- No changes to the disambiguation flow
- Exercise `item` path is unaffected (already has a fuller mapping)
- All other groupBy paths (`date`, `week`, `dayOfWeek`, etc.) are unaffected
- The `total_calories` schema column names stay in the edge function where they describe actual DB columns — only the metric key names are corrected
