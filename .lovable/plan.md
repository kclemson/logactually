

## Fix: weight_lbs double-counting on multi-entry days

### Root cause

In `chart-data.ts` line 295, the exercise daily aggregation unconditionally **sums** `weight_lbs` across all rows for the day:

```typescript
existing.weight_lbs += setTotals.weight_lbs;  // 170 + 160 = 330
```

So on Jan 31 with two leg press entries (170 lbs and 160 lbs), the daily total becomes 330. Then when the DSL engine applies `aggregation: "max"` on a date-grouped series, there's only one value per day — `max([330]) = 330`. The spike in the chart.

Summed `weight_lbs` is never meaningful as a daily metric. Unlike sets, reps, duration, or distance (which accumulate), "total pounds lifted" is what volume (sets × reps × weight) is for. The raw `weight_lbs` field should represent the **heaviest weight used that day**.

### Fix

**File: `src/lib/chart-data.ts`** — change the daily `weight_lbs` aggregation from sum to max:

```typescript
// Before:
existing.weight_lbs += setTotals.weight_lbs;

// After:
existing.weight_lbs = Math.max(existing.weight_lbs, setTotals.weight_lbs);
```

One line, one file. This makes Jan 31 show `170` (the heavier of the two entries) instead of `330`.

### Why max, not average

The user asked about averaging, but for this metric specifically, max is the standard convention — "what's the heaviest weight I moved today" is the canonical meaning of a weight trend line, and it's what the DSL already requests (`aggregation: "max"`). An average of 170 and 160 = 165 would understate the actual working weight.

### Impact check

- **Volume charts** are unaffected — volume is computed as `sets × reps × weight` per entry, not from the daily `weight_lbs` total
- **Item-level charts** (`groupBy: "item"`) use `exerciseByItem` which has its own separate aggregation — unaffected
- **DSL `sum` aggregation on `weight_lbs`** across multiple days would now sum the daily maxes rather than daily sums — this is actually more meaningful (sum of working weights across sessions)

