
## Fix: "groupBy item" for exercises scoped to a single exercise key

### Root cause

When the user asks "# of times I've done walking vs. running workouts", the AI correctly generates:

```json
{ "source": "exercise", "metric": "entries", "groupBy": "item", "filter": { "exerciseKey": "walk_run" } }
```

But in `chart-data.ts` line 195, the `exerciseByItem` aggregator always buckets by `row.exercise_key`:

```ts
const key = row.exercise_key; // always "walk_run" for every row
```

Since every row already has `exercise_key = "walk_run"` (due to the filter applied at line 155), all rows collapse into the same bucket — producing one bar labeled "Running" (the description of the last row processed) with a total of 76 entries instead of two separate bars for walking and running.

The `"Running"` label is also wrong — it comes from `item.description` which is whatever the last row happened to have as its description.

### Fix — two targeted changes

**1. `src/lib/chart-data.ts` — use `exercise_subtype` as the item key when scoped to a single exercise**

When `exerciseKeyFilter` is set and `needsItem` is true, we're already filtered to one exercise key. In that case, the meaningful dimension to split by is `exercise_subtype`. Change the `exerciseByItem` bucket key from `row.exercise_key` to `row.exercise_subtype ?? row.exercise_key`:

```ts
// Before (line 195):
const key = row.exercise_key;

// After:
const key = exerciseKeyFilter ? (row.exercise_subtype ?? row.exercise_key) : row.exercise_key;
```

The `description` stored on each bucket also needs to reflect the subtype — capitalize the subtype key for display (e.g. `"running"` → `"Running"`):

```ts
const label = exerciseKeyFilter
  ? (row.exercise_subtype
      ? row.exercise_subtype.charAt(0).toUpperCase() + row.exercise_subtype.slice(1)
      : row.description)
  : row.description;
const existing = exerciseByItem[key] ?? { description: label, count: 0, ... };
```

This means "Walking" entries bucket under key `"walking"` (description: `"Walking"`) and "Running" entries bucket under `"running"` (description: `"Running"`), while entries with no subtype fall back to their exercise key and description.

**2. `src/lib/chart-dsl.ts` — no change needed**

The DSL engine's `"item"` case for exercises already uses `item.description` as the label (line 298). Since the fix above stores a properly capitalized subtype name as `description`, the labels will now read `"Walking"` and `"Running"` correctly — no DSL engine change needed.

### Entries metric for subtype buckets

The `entries` metric for exercise is tracked via `seenEntries` (unique `entry_id` per day). This is the **daily** count, not the per-subtype count. For `groupBy: "item"`, the `count` field in `exerciseByItem` is what's used (each row increments `count`). This correctly counts total logged sessions per subtype across the period.

### What does NOT change

- No change to the DSL schema or AI prompt
- No change to the filter logic or query
- Food `groupBy: "item"` is untouched
- All other `groupBy` modes are untouched
- Category-filtered exercises (e.g., "cardio by day of week") are untouched

### File changed

Only `src/lib/chart-data.ts` — 3 lines changed inside the `exerciseByItem` block (lines 195–197).
