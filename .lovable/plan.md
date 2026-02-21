
# Subtype-Aware Item Grouping for Unfiltered Exercise Charts

## Problem
When charting exercises grouped by item without an exercise filter (e.g., "average heart rate by exercise"), all subtypes of a parent key collapse into a single bar. Walking and running both become one "walk_run" bar, labeled by whichever description was processed first. This makes it look like walking data is missing when it's actually merged.

## Solution
Change the item-level grouping key in `chart-data.ts` to always use the most specific identifier available -- the subtype when present, the exercise key otherwise. This gives walking and running separate bars regardless of whether an exercise filter is active.

## Changes

### `src/lib/chart-data.ts` -- Item-level aggregation key and label (lines 206-212)

Current logic:
```
const key = exerciseKeyFilter ? (row.exercise_subtype ?? row.exercise_key) : row.exercise_key;
const label = exerciseKeyFilter
  ? (row.exercise_subtype
      ? row.exercise_subtype.charAt(0).toUpperCase() + row.exercise_subtype.slice(1)
      : row.description)
  : row.description;
```

Updated logic -- always prefer subtype when available:
```
const key = row.exercise_subtype
  ? `${row.exercise_key}:${row.exercise_subtype}`
  : row.exercise_key;
const label = row.exercise_subtype
  ? row.exercise_subtype.charAt(0).toUpperCase() + row.exercise_subtype.slice(1)
  : row.description;
```

This uses compound keys (`walk_run:walking`, `walk_run:running`) so subtypes never collapse, while exercises without subtypes (e.g., `bench_press`) keep using their description as the label.

### What does NOT change
- No DSL schema changes
- No edge function changes
- No database changes
- The `exerciseKeyFilter` branch for filtered charts still works because subtype-level grouping was already the intent there
- The `uniqueDays` averaging logic is unaffected
