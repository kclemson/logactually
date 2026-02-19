

## Add exercise `entries` metric (count of logged sessions, not unique exercises)

### Problem

When asking "# of exercises by day of week," the AI returns `metric: "unique_exercises"` with `aggregation: "count"`. This is wrong in two ways:

1. **`unique_exercises` deduplicates** -- two separate dog walking sessions count as 1 because they share the same `exercise_key`
2. **`count` aggregation counts the number of days** that had data, not the metric value itself

The user wants: "how many active things did I log" -- where each expandable group in the weight log (each distinct `entry_id`) counts as one.

### Solution

Add an `entries` metric to the exercise source that counts distinct `entry_id` values per day. This mirrors the existing `entries` metric on the food side.

### Technical details

| File | Change |
|---|---|
| `src/lib/chart-data.ts` | Add `entry_id` to the exercise query select. Track distinct `entry_id` values per day (similar to how `unique_exercises` tracks distinct `exercise_key`). Store the count in a new `entries` field on `ExerciseDayTotals`. |
| `src/lib/chart-types.ts` | Add `entries: number` to `ExerciseDayTotals` interface. Update `EMPTY_EXERCISE` constant in `chart-data.ts` to include `entries: 0`. |
| `src/lib/chart-dsl.ts` | Add `"entries"` to the `EXERCISE_METRICS` array. |
| `supabase/functions/generate-chart-dsl/index.ts` | Update the exercise metrics list to include `entries` described as "number of exercise sessions logged (each logged group counts as one, even if the same exercise appears twice)". Strengthen `count` aggregation guidance to clarify it counts days, not the metric value. Add disambiguation for "how many exercises" vs "how often do I exercise". |

### How it works

In `fetchExerciseData`, alongside the existing `seenKeys` tracker:

```text
seenEntries[date] = Set of entry_id values seen for that date
existing.entries = seenEntries[date].size
```

Two dog walks on Monday with different `entry_id` values = `entries: 2`.
Two dog walks grouped under the same `entry_id` = `entries: 1`.

### Expected AI output after fix

User: "# of exercises by day of week"

```json
{
  "source": "exercise",
  "metric": "entries",
  "aggregation": "average",
  "groupBy": "dayOfWeek",
  "chartType": "bar"
}
```

This would show something like 8-11 per day (matching reality) instead of 3-5.

### Prompt changes summary

- Add `entries` to exercise metrics: "number of exercise sessions logged (each logged group counts separately, not deduplicated by exercise type)"
- Clarify `count` aggregation: "counts how many days/periods had data -- IGNORES the metric value. Do NOT use when the user wants the value of a metric."
- Add disambiguation: "how many exercises did I do" = `average` of `entries`, not `count` of `unique_exercises`
