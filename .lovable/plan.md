
## Two concrete improvements: fix heart_rate in v2 + expand DSL coverage

### Clarification: v1 and v2 data layers are completely separate

v1 calls `generate-chart` edge function → gets back `chartSpec` + `dailyTotals` as one server-side response. v2 calls `generate-chart-dsl` → gets a schema → runs `fetchChartData` client-side → runs `executeDSL`. These are entirely different code paths with no overlap.

The "Average heart rate by exercise" chip was tagged `mode: "v1"` intentionally, but it went to v1 because *we told it to* — not because v2 tried and failed. The question is whether it belongs there or can be promoted to v2.

---

### Part 1 — Add heart_rate to the v2 data pipeline

Heart rate lives in `exercise_metadata` JSONB (e.g. `{ heart_rate: 142, effort: 7, ... }`). It's already fetched in `chart-data.ts` (line 151 selects `exercise_metadata`) but only `calories_burned` is extracted from it (line 189). The v2 engine can fully support heart rate with three small additions:

**`src/lib/chart-types.ts`**
- Add `heart_rate: number` to `ExerciseDayTotals`
- Add `heart_rate: number | null` to `exerciseByItem` shape

**`src/lib/chart-data.ts`**
- In `EMPTY_EXERCISE`, add `heart_rate: 0`
- In the row loop, extract `meta?.heart_rate ?? 0` and accumulate it into the daily total alongside `calories_burned`
- In `exerciseByItem`, add `totalHeartRate` accumulation
- Track `heartRateCount` (number of rows that had a non-null heart rate) per exercise, so we can compute a true average in the DSL engine rather than a naive average-of-sums

**`src/lib/chart-dsl.ts`**
- Add `"heart_rate"` to `EXERCISE_METRICS`
- In the `"item"` case for exercise, add `heart_rate` to the `metricValue` branches
- In `buildDetails` for the `"date"` groupBy, include heart_rate when non-zero

**`supabase/functions/generate-chart-dsl/index.ts`** (system prompt)
- Add `heart_rate` to the AVAILABLE METRICS list for exercise source
- Note that it comes from `exercise_metadata.heart_rate` and should use `aggregation: "average"` since a single day's value is meaningless; the interesting view is average HR by exercise or by day

**`src/components/CustomChartDialog.tsx`**
- Change the "Average heart rate by exercise" chip from `mode: "v1"` to `mode: "v2"`

---

### Part 2 — Review which v1 chips can be promoted to v2

Going through each v1-tagged chip against what the DSL actually supports:

**"Which meals have the most calories?"**
Status: Still v1-only. The DB has no "meal" concept — a `food_entries` row is the closest thing, and grouping by entry rather than by a semantic "meal name" requires natural language interpretation. Cannot be expressed in DSL without a schema change.

**"My most common foods"**
Status: Can be v2 now. `groupBy: "item"`, `metric: "entries"`, `aggregation: "count"`, `sort: "value_desc"`, `limit: 10` — the DSL already supports this fully. The only reason it was v1 was uncertainty. Re-tag to `mode: "v2"`.

**"Average calories on workout days vs rest days"**
Status: Buildable in v2 but requires a new DSL filter. We need a `hasExercise: boolean` filter in `fetchChartData` that intersects food entry dates with exercise dates, then `groupBy: "weekdayVsWeekend"` becomes `groupBy: "workoutVsRest"`. This is a meaningful addition but requires:
- A new `groupBy` value: `"workoutVsRest"`
- `fetchChartData` to always fetch both food and exercise date sets when this groupBy is active
- The DSL engine to bucket by whether that date appears in exercise data

This is worth building — defer to a follow-up, keep v1 for now.

**"Average heart rate by exercise"**
Status: Promotable to v2 after Part 1 above. `groupBy: "item"`, `source: "exercise"`, `metric: "heart_rate"`, `aggregation: "average"`.

**"Rest days between workouts"**
Status: Still v1-only. This requires computing gaps between exercise dates — a windowing/lag operation. The declarative DSL has no way to express "difference between consecutive dates in a sorted list." Keep v1.

---

### Part 3 — Refine the "unsupported" signal scope in the system prompt

Now that we have a clearer picture, the `unsupported` signal (from the previous plan) should be narrowly scoped to things that are *genuinely* out of scope for the DSL:

- Semantic food description filtering (e.g. "candy", "fried foods") — no tag column exists
- Gap/streak analysis (rest days between workouts, streaks) — requires windowing
- Meal-level grouping — no meal schema

Things previously listed as unsupported that are actually fine in v2:
- Heart rate — now supported after Part 1
- "Common foods" — already supported
- Cross-domain join (workout vs rest days) — buildable but deferred

The system prompt should say:

```
UNSUPPORTED REQUEST:

If the user's request CANNOT be expressed using the available schema — specifically:
- Filtering food by description content (e.g. "candy", "chocolate", "fried") since
  there is no category or tag column on food items, only free-text descriptions
- Gap or streak analysis (e.g. "rest days between workouts", "longest streak")
  since this requires lag/window operations not expressible in the DSL
- Meal-level grouping (e.g. "which meals have most calories") since there is no
  meal entity in the schema

...then respond with { "unsupported": true, "reason": "..." }

Do NOT use this for heart rate, common foods, exercise frequency, or any query
that maps cleanly to the available metrics, groupBy options, and filters above.
```

---

### Files changed

| File | Change |
|---|---|
| `src/lib/chart-types.ts` | Add `heart_rate` to `ExerciseDayTotals`; add `totalHeartRate` + `heartRateCount` to `exerciseByItem` |
| `src/lib/chart-data.ts` | Extract `heart_rate` from `exercise_metadata`; accumulate per-day and per-item; add `heartRateCount` tracking |
| `src/lib/chart-dsl.ts` | Add `"heart_rate"` to `EXERCISE_METRICS`; handle it in the `"item"` and `"date"` groupBy cases |
| `supabase/functions/generate-chart-dsl/index.ts` | Add `heart_rate` to AVAILABLE METRICS; add narrow `UNSUPPORTED REQUEST` section to system prompt |
| `src/components/CustomChartDialog.tsx` | Promote "Average heart rate by exercise" and "My most common foods" chips from `mode: "v1"` to `mode: "v2"` |

No database migrations needed — all data already exists in `exercise_metadata` JSONB.
