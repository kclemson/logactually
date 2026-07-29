## Root cause (confirmed)

All the trends fetchers pass `.limit(10000)` but the backend caps PostgREST responses at 1000 rows. When "All time" is selected, the queries order ascending by date and return only the earliest 1000 rows.

Verified against your data:
- `food_entries` has 4,357 rows spanning 2025-11-03 → 2026-07-31
- The 1,000th row (ordered by `eaten_date ASC`) lands on **2026-02-12**
- That's exactly the "November through February" window you're seeing

The 7/30/90-day views work because those windows fit under 1,000 rows.

The same bug exists in three fetchers:
- `src/lib/chart-data.ts` → `fetchFoodData` and `fetchExerciseData` (both `.limit(10000)`)
- `src/hooks/useWeightTrends.ts` (`.limit(10000)`)
- `src/hooks/useCustomLogTrends.ts` (`.limit(10000)`)

## Fix

Add a small pagination helper that pages through results in 1,000-row chunks using `.range(from, to)` until fewer than a full page comes back, then use it in place of the four `.limit(10000)` calls. Keep an upper cap (e.g. 50k rows) so a runaway query can't hang the client.

```text
fetchAllRows(baseQuery, { pageSize: 1000, maxRows: 50000 })
  → loops .range(offset, offset+pageSize-1)
  → concatenates rows
  → stops when a page returns < pageSize rows or maxRows hit
```

Then:
- `fetchFoodData`: build the base `.select(...).gte(...).order(...)` query and page it
- `fetchExerciseData`: same, preserving the optional `.eq(exercise_key)` / `.eq(exercise_subtype)` filters
- `useWeightTrends`: page the `weight_sets` query
- `useCustomLogTrends`: page the `custom_log_entries` query

No API/schema changes. Same ordering guarantees. 7/30/90-day paths still make a single request (pagination stops after page 1).

## Out of scope

- Server-side pre-aggregation (bigger refactor; not needed to fix the visible bug)
- Changing the `.limit()` semantics on chart types unrelated to all-time
- Any UI changes