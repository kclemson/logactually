
## Fix: `groupBy: "item"` ignores `aggregation: "average"` for exercises

### Root cause

In `chart-dsl.ts` lines 292-299, the `"item"` case for exercise uses a raw `metricValue` plucked directly from the pre-aggregated `exerciseByItem` bucket, then checks only `aggregation === "count"`:

```ts
value: Math.round(dsl.aggregation === "count" ? item.count : metricValue),
```

`metricValue` is always the running **total** (`totalDurationMinutes`, `totalCaloriesBurned`, etc.) — never averaged. The `"sum"` vs `"average"` distinction is silently dropped.

To compute a per-day average the engine would need to know how many distinct **days** contributed to each item bucket. That information is not currently stored in `exerciseByItem`.

The food side has the same structural problem — `totalCalories / count` divides by number of *entries*, not days — but the exercise "walking vs running distance" case is the one the user hit today.

---

### Two-part fix

**Part 1 — `src/lib/chart-data.ts`: track `uniqueDays` per item bucket**

Add a `Set<string>` of `logged_date` values to each `exerciseByItem` entry so the DSL engine can divide by distinct days when `aggregation === "average"`:

```ts
const existing = exerciseByItem[key] ?? {
  description: label,
  count: 0,
  totalSets: 0,
  totalDurationMinutes: 0,
  totalCaloriesBurned: 0,
  uniqueDays: new Set<string>(),   // NEW
};
existing.uniqueDays.add(row.logged_date);  // NEW
```

The `exerciseByItem` type in `chart-data.ts` gains the `uniqueDays: Set<string>` field (it is local — not part of the exported `DailyTotals` type in `chart-types.ts`).

Do the same for `foodByItem` so food-source "item" charts get correct averages too — add `uniqueDays: Set<string>` tracking per food item bucket, accumulating `row.eaten_date`.

**Part 2 — `src/lib/chart-dsl.ts`: use `uniqueDays` when aggregation is `"average"`**

In the `"item"` case for exercises, replace the current blind total lookup with:

```ts
const divisor = dsl.aggregation === "average"
  ? (item.uniqueDays?.size || 1)
  : 1;

const metricValue =
  dsl.metric === "distance_miles"   ? item.totalDistanceMiles / divisor :
  dsl.metric === "duration_minutes" ? item.totalDurationMinutes / divisor :
  dsl.metric === "calories_burned"  ? item.totalCaloriesBurned / divisor :
  dsl.metric === "sets"             ? item.totalSets / divisor :
  item.count;

value: Math.round(dsl.aggregation === "count" ? item.count : metricValue),
```

Note `totalDistanceMiles` — `distance_miles` is currently missing from the `exerciseByItem` bucket entirely (the accumulator doesn't track it). This is a secondary bug surfaced by this same query: "miles walked vs run" would always show 0 for `distance_miles` even in the sum case. It needs to be added to both the accumulator in `chart-data.ts` and the lookup in `chart-dsl.ts`.

---

### Summary of all changes

**`src/lib/chart-data.ts`**
- Add `totalDistanceMiles: number` and `uniqueDays: Set<string>` to the `exerciseByItem` bucket initialiser
- Accumulate `existing.totalDistanceMiles += row.distance_miles ?? 0`
- Accumulate `existing.uniqueDays.add(row.logged_date)`
- For `foodByItem`: add `uniqueDays: Set<string>` and accumulate `existing.uniqueDays.add(row.eaten_date)`

**`src/lib/chart-dsl.ts`**
- In the `"item"` / exercise block: compute `divisor` from `item.uniqueDays.size` when `aggregation === "average"`, apply it to all metric values
- Add `distance_miles → item.totalDistanceMiles` to the metric lookup (it's missing today)
- In the `"item"` / food block: apply the same `divisor` pattern using `item.uniqueDays.size`

**`src/lib/chart-types.ts`** — no change needed; `exerciseByItem` type lives only in `chart-data.ts`

---

### Why `uniqueDays` rather than `count`

`count` is the number of individual logged **sets/rows** (a single workout session can have many sets). Dividing total distance by `count` would give average distance per set, not per session day — which is meaningless. Dividing by `uniqueDays.size` gives "average distance per day I did this activity", which is exactly what "average daily miles walked vs. run" means.
