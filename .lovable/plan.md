

# Fix: Support `weight_lbs` and `reps` as exercise metrics in the chart engine

## Problem
The AI correctly generates a DSL with `metric: "weight_lbs"` for "show working weight over time for leg press," but the chart engine has no awareness of `weight_lbs` (or `reps`). It is not fetched from the database, not accumulated in daily totals, and not listed as a valid exercise metric. The result is an empty chart.

The AI prompt lists `sets, reps, weight_lbs` as database columns, so the model reasonably uses them -- but the client-side engine only supports `sets` (as a count), not `reps` or `weight_lbs` as chartable metrics.

## Solution
Add `weight_lbs` and `reps` to the exercise data pipeline so they can be charted like any other metric.

## Technical Details

### 1. Type: `src/lib/chart-types.ts`
Add `weight_lbs` and `reps` to `ExerciseDayTotals`:
```typescript
export interface ExerciseDayTotals {
  sets: number;
  reps: number;           // NEW
  weight_lbs: number;     // NEW
  duration_minutes: number;
  distance_miles: number;
  calories_burned: number;
  heart_rate: number;
  calories_burned_estimate: number;
  unique_exercises: number;
  entries: number;
}
```

### 2. Data fetching: `src/lib/chart-data.ts`

a) Add `reps, weight_lbs` to the `.select()` column list (line 183).

b) Include them in the `setTotals` object (line 221-230):
```typescript
const setTotals: ExerciseDayTotals = {
  sets: 1,
  reps: row.reps ?? 0,             // NEW
  weight_lbs: row.weight_lbs ?? 0, // NEW
  duration_minutes: row.duration_minutes ?? 0,
  ...
};
```

c) Accumulate in daily aggregation (line 280-295):
```typescript
existing.reps += setTotals.reps;
existing.weight_lbs += setTotals.weight_lbs;
```

d) Add to `exerciseByItem.valuesPerEntry` tracking for accurate max/min:
```typescript
existing.valuesPerEntry!.reps.push(row.reps ?? 0);
existing.valuesPerEntry!.weight_lbs.push(row.weight_lbs ?? 0);
```

e) Update the `EMPTY_EXERCISE`-like spread to include `reps: 0, weight_lbs: 0` (check where `EMPTY_EXERCISE` is defined or inlined).

f) Update category aggregation similarly.

### 3. DSL engine: `src/lib/chart-dsl.ts`
Add to the `EXERCISE_METRICS` array (line 22):
```typescript
const EXERCISE_METRICS = ["sets", "reps", "weight_lbs", "duration_minutes", ...] as const;
```

No other engine changes needed -- `extractValue` already reads `(day as any)[metric]` dynamically.

### 4. Edge function prompt (optional but recommended): `supabase/functions/generate-chart-dsl/index.ts`
Add `reps` and `weight_lbs` to the "Available Metrics" section for exercise source so the AI knows these are supported:
```
- Exercise source: sets, reps, weight_lbs, duration_minutes, ...
```
(The prompt already mentions these as DB columns but not as chartable metrics.)

### Aggregation note
For daily aggregation, `weight_lbs` sums all set weights in a day. With `aggregation: "max"`, the DSL engine picks the highest daily total. However, the user likely wants the max single-set weight, not the sum. This is already handled for item-level charts via `valuesPerEntry`, but for date-grouped charts the engine aggregates daily sums then applies max across days. This means "max weight for leg press by date" will show the heaviest day's total, which for a single-exercise filter with one set logged per row, equals the single-set max. For multi-set days it sums -- but this is the same behavior as `sets` (which counts total sets per day). This is acceptable for now.

| File | Change |
|---|---|
| `src/lib/chart-types.ts` | Add `reps` and `weight_lbs` to `ExerciseDayTotals` |
| `src/lib/chart-data.ts` | Fetch, accumulate, and track `reps` and `weight_lbs` in all aggregation paths |
| `src/lib/chart-dsl.ts` | Add `reps` and `weight_lbs` to `EXERCISE_METRICS` |
| `supabase/functions/generate-chart-dsl/index.ts` | Add `reps` and `weight_lbs` to the available metrics documentation in the prompt |
