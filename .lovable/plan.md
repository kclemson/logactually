

## The "Intensity Metric Summing" Trap

You're right to ask — heart rate isn't the only metric affected. Here's the full audit:

### Metrics that are currently summed but should be averaged

In `chart-data.ts` daily aggregation (lines 288-305), **every** field on `ExerciseDayTotals` is accumulated via `+=`. For additive/cumulative metrics (sets, reps, weight_lbs, duration_minutes, distance_miles, calories_burned), summing is correct. But for **intensity/rate metrics**, summing produces nonsense values:

| Metric | Current behavior | Correct behavior | Impact |
|--------|-----------------|-------------------|--------|
| `heart_rate` | Summed | **Averaged** (across entries with HR data) | Two walks at 110 bpm → shows 220 |
| `effort` | Not aggregated into daily totals (fetched but unused) | Would need averaging if added | Not currently broken, but a latent trap |
| `incline_pct` | Not aggregated (fetched but unused) | Would need averaging | Same — latent |
| `cadence_rpm` | Not aggregated (fetched but unused) | Would need averaging | Same — latent |
| `speed_mph` | Not aggregated (fetched but unused) | Would need averaging | Same — latent |

So **heart_rate is the only actively broken case today**. The other intensity columns (`effort`, `incline_pct`, `cadence_rpm`, `speed_mph`) are fetched from the database but never accumulated into `ExerciseDayTotals`, so they don't hit this bug yet — but they would the moment someone adds them to the daily aggregation.

### Proposed fix

**File: `src/lib/chart-data.ts`**

1. Track a per-day heart rate count (`heartRateCountByDate`) alongside the sum
2. After the main loop, post-process each day's `heart_rate` to be `sum / count` (a true average)
3. No changes needed to `ExerciseDayTotals` type — the field stays `number`, it just holds an average instead of a sum

This is a ~10-line change confined to `fetchExerciseData`. The DSL engine (`chart-dsl.ts`) and all chart components consume the value as-is, so fixing the data layer fixes everything downstream.

### Not affected

- **Food metrics**: All food metrics (calories, protein, carbs, etc.) are additive per day — summing is correct
- **Exercise item-level aggregation**: Already handles heart rate correctly via `totalHeartRate / heartRateCount`
- **Category aggregation**: Doesn't include heart_rate currently

