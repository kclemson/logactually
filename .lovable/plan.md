

## Add `groupBy: "category"` to the chart DSL

### Problem

When a user asks "cardio vs strength training split", the AI has no way to express this. The closest option is `groupBy: "item"` which lists every individual exercise separately. The user wants just two buckets (Cardio / Strength), which requires knowing the exercise category -- information that exists in the exercise metadata (`isCardio` flag) but isn't accessible to the chart engine.

### Solution

Add a new `groupBy: "category"` option that groups exercise data into Cardio vs Strength (non-cardio) buckets. This uses the existing `isCardio` flag from `EXERCISE_MUSCLE_GROUPS` in `exercise-metadata.ts`.

### Changes

| File | Change |
|---|---|
| `src/lib/chart-types.ts` | Add `"category"` to the `groupBy` union. Add `exerciseByCategory` to `DailyTotals`. |
| `src/lib/chart-data.ts` | When `groupBy === "category"`, compute `exerciseByCategory` record with two keys: `"Cardio"` and `"Strength"`, each accumulating totals using `isCardioExercise()` from exercise-metadata. |
| `src/lib/chart-dsl.ts` | Add a `case "category"` block in `executeDSL` that reads `exerciseByCategory` and produces data points for each category bucket. |
| `supabase/functions/generate-chart-dsl/index.ts` | Add `"category"` to the GROUP BY OPTIONS docs in the system prompt, explaining it groups exercises into Cardio vs Strength buckets. Mark it as categorical in the aggregation semantics section. |

### How it works

```text
User: "Cardio vs strength training split"

AI returns:
  groupBy: "category"
  source: "exercise"
  metric: "cal_burned" (or "sets", "duration", etc.)
  aggregation: "sum"

Client-side:
  1. fetchChartData detects groupBy=category, queries weight_sets
  2. For each row, checks isCardioExercise(exercise_key)
  3. Buckets into { Cardio: {...totals}, Strength: {...totals} }
  4. executeDSL reads these two buckets, produces two bar data points
```

### Technical detail

The category grouping is exercise-only. If the AI mistakenly pairs it with `source: "food"`, the chart will simply render empty (same graceful behavior as other mismatches). The prompt will instruct the AI that `category` only applies to exercise data.

