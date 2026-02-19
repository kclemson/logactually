

## Add per-exercise-key verification for categorical exercise charts

### What this does
Enables deterministic verification for charts that group data by exercise (e.g., "Average Heart Rate by Exercise", "Total Duration by Exercise"). Currently these fall through to "can't be verified" because we only have daily totals, not per-exercise totals.

### How it works

**Backend** (`supabase/functions/generate-chart/index.ts`): After the existing daily exercise totals loop, add a second pass over `exerciseSets` that groups by `exercise_key`, accumulating count, total sets, total reps, total duration, total distance, total calories burned, and collecting heart rate + effort values for averaging. Serialize this as `exerciseByKey` alongside the existing `dailyTotals` in the response.

**Client type** (`src/hooks/useGenerateChart.ts`): Add optional `exerciseByKey` to the `DailyTotals` interface:

```text
exerciseByKey?: Record<string, {
  description: string;
  count: number;
  total_sets: number;
  total_duration: number;
  avg_duration: number;
  total_distance: number;
  avg_heart_rate: number | null;
  avg_effort: number | null;
  total_cal_burned: number;
}>
```

**Client verification** (`src/lib/chart-verification.ts`): Add `verifyCategoricalExercise` function inserted into the chain after weekday verification (step 3, before AI-declared fallback).

Detection: if `dataSource === "exercise"` and x-axis labels are NOT dates or weekdays, treat as exercise-categorical.

Label matching: normalize both the chart label and exercise key (lowercase, replace underscores/hyphens with spaces) and compare. Also check against the stored `description`.

Field mapping from chart `dataKey` to `exerciseByKey` fields:
- `heart_rate` / `avg_heart_rate` -> `avg_heart_rate`
- `duration` / `avg_duration` -> `avg_duration`
- `effort` / `avg_effort` -> `avg_effort`
- `count` / `frequency` / `entries` -> `count`
- `cal_burned` / `calories_burned` / `total_cal_burned` -> `total_cal_burned`
- `distance` / `total_distance` -> `total_distance`
- `sets` / `total_sets` -> `total_sets`

Standard `isClose` tolerance comparison, same as existing paths.

### Verification chain after this change

```text
1. verifyDeterministic           -- date-indexed, known metric
2. verifyCategoricalWeekday      -- weekday-bucketed, known metric
3. verifyCategoricalExercise     -- exercise-keyed, known metric  [NEW]
4. AI-declared daily/aggregate   -- fallback
5. unavailable
```

### Files changed

| File | Change |
|------|--------|
| `supabase/functions/generate-chart/index.ts` | Add per-exercise-key aggregation loop + serialize to response |
| `src/hooks/useGenerateChart.ts` | Add `exerciseByKey` to `DailyTotals` type |
| `src/lib/chart-verification.ts` | Add `verifyCategoricalExercise` + insert into `verifyChartData` chain |

