

# Upsert-based Apple Health import with date range and existing data summary

## Summary

Three enhancements to the Apple Health import dialog:

1. **Upsert instead of skip** — matched existing entries get their `heart_rate`, `speed_mph`, `distance_miles`, and `calories_burned_override` updated rather than being silently skipped.
2. **"Through" date picker** — add an upper-bound date so you can exclude recent dates where you've been logging manually.
3. **Existing import summary** — on dialog open, query the user's existing Apple Health imports and display the date range and count (e.g. "You have 142 imported workouts from Nov 28, 2024 – Feb 8, 2025").

## Changes

| File | Change |
|---|---|
| `src/components/AppleHealthImport.tsx` | All three features below |

### 1. Show existing Apple Health import summary

On dialog mount (alongside the existing last-import-date query), fetch a summary of existing Apple Health imports:

```sql
SELECT MIN(logged_date), MAX(logged_date), COUNT(*)
FROM weight_sets
WHERE user_id = ? AND raw_input = 'apple-health-import'
```

Display this in the config phase as a small info line: "You have 142 imported workouts from Nov 28 – Feb 8" (or "No Apple Health imports yet"). This gives you confidence about what's already in the database before deciding on dates.

### 2. Add "through" date picker

- Add `toDate` state, defaulting to today.
- Render a second date picker row labeled "through" below the existing "since" row.
- Pass `toDate` to the `scan()` function. In the scan loop, skip any workout where `parsed.startDate > toDateCutoff`.
- Also filter in the `selectedWorkouts` memo as a safety net.

The two pickers read naturally: "Import workouts **since** Nov 28 **through** Feb 8".

### 3. Upsert: update existing entries instead of skipping

Rework the import phase (lines 239-262):

**Current flow**: Fetch existing Apple Health entries by dedup key → filter out matches → insert only new ones.

**New flow**:
1. Fetch existing entries but also select `id` (the row UUID).
2. Build a `Map<dedupKey, existingRowId>` instead of a `Set`.
3. Split parsed workouts into two arrays:
   - `toInsert` — no matching key (new workouts, insert as before)
   - `toUpdate` — matching key exists, pair with the existing row `id`
4. Batch insert `toInsert` (unchanged).
5. Batch update `toUpdate` — for each matched row, update `heart_rate`, `speed_mph`, `distance_miles`, `calories_burned_override`.
6. Done phase shows: "Imported 12 new, updated 84 existing" instead of just a single count.

**Update approach**: Use `Promise.all` within each batch for the individual update calls (since each row has different values, they must be separate queries). Batch size of 50 keeps this manageable.

```typescript
// Per-row update
await supabase
  .from("weight_sets")
  .update({
    heart_rate: w.heartRate,
    speed_mph: w.speedMph,
    distance_miles: w.distanceMiles,
    calories_burned_override: w.caloriesBurned,
  })
  .eq("id", existingId);
```

### UI in done phase

Change from:
> ✓ Imported 12 workouts

To:
> ✓ Imported 12 new, updated 84 existing

(If either count is 0, only show the non-zero one.)

## No database changes needed

All columns (`heart_rate`, `speed_mph`, `distance_miles`, `calories_burned_override`, `id`) already exist on `weight_sets`.

