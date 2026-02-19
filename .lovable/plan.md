

## Expand `verifyCategoricalWeekday` to handle "Weekdays vs Weekends" labels

### What changes
A single function enhancement -- no new functions, no new files.

### Why this fits
The existing `verifyCategoricalWeekday` already groups all dates into 7 day-of-week buckets and aggregates per bucket. "Weekdays" and "Weekends" are simply labels that map to multiple buckets instead of one. The detection, field resolution, aggregation, and comparison logic are all identical.

### Changes -- single file: `src/lib/chart-verification.ts`

**1. Expand the `weekdayIndex` helper (or add a sibling) to recognize group labels**

Add a new helper `weekdayGroupIndices` that maps group labels to arrays of day indices:
- "weekdays" / "weekday" -> [1, 2, 3, 4, 5]
- "weekends" / "weekend" -> [0, 6]

Returns `null` if the label isn't a group label.

**2. Broaden the detection check at the top of `verifyCategoricalWeekday`**

Currently: labels must match individual weekday names via `weekdayIndex()`. 

Change: a label passes detection if it matches `weekdayIndex()` OR `weekdayGroupIndices()`. This way a chart with labels ["Weekdays", "Weekends"] passes the 50% threshold just like ["Mon", "Tue", ...] does.

**3. Adjust the per-data-point loop to handle both cases**

Currently each data point maps to one bucket via `weekdayIndex(label)`. Change the logic to:
- First try `weekdayIndex(label)` -- if non-null, aggregate that single bucket (existing behavior, unchanged)
- Otherwise try `weekdayGroupIndices(label)` -- if non-null, merge all values from those buckets into one flat array, then aggregate

This is roughly 3 lines of extra logic in the loop.

**4. No changes to the verification chain or function name**

The function stays as `verifyCategoricalWeekday` and its position in the chain is unchanged. No new step needed. The function name already makes sense -- it verifies charts whose categories are based on weekdays, whether individual or grouped.

### Technical detail

```text
weekdayGroupIndices("Weekdays")  ->  [1, 2, 3, 4, 5]
weekdayGroupIndices("Weekends")  ->  [0, 6]
weekdayGroupIndices("Monday")    ->  null  (handled by weekdayIndex instead)

For a "Weekdays" data point:
  values = [...buckets[1], ...buckets[2], ...buckets[3], ...buckets[4], ...buckets[5]]
  expected = aggregate(values)  // e.g. average across all weekday dates
```

### Why not a separate function
- Same detection logic (label shape), same field resolution, same bucketing, same aggregation, same comparison. The only difference is "1 bucket vs N buckets merged" -- a 3-line branch, not a 100-line function.
- Keeps the verification chain simpler (no extra step to reason about).
- The concept is the same: "group dates by their day-of-week properties."
