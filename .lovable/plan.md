

## Fix: Add user_id Filter to All Delete Queries

You're right — even though RLS would protect against this in normal app usage, the admin SQL tool bypasses RLS, so every DELETE must include the user_id filter.

### Part 1: Database cleanup (corrected queries)

**Delete apple-health-import runs on days with manual runs (23 rows):**

```sql
DELETE FROM weight_sets
WHERE user_id = '83a923f5-10ac-4ba1-ae5a-b1f65b302239'
  AND raw_input = 'apple-health-import'
  AND exercise_key = 'walk_run'
  AND LOWER(description) LIKE '%run%'
  AND logged_date IN (
    SELECT logged_date FROM weight_sets
    WHERE user_id = '83a923f5-10ac-4ba1-ae5a-b1f65b302239'
      AND raw_input IS DISTINCT FROM 'apple-health-import'
      AND exercise_key = 'walk_run'
      AND LOWER(description) LIKE '%run%'
  );
```

**Delete exact duplicate apple-health-import rows (keep one copy per group):**

```sql
DELETE FROM weight_sets
WHERE user_id = '83a923f5-10ac-4ba1-ae5a-b1f65b302239'
  AND id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (
        PARTITION BY exercise_key, logged_date, duration_minutes, distance_miles
        ORDER BY created_at
      ) AS rn
      FROM weight_sets
      WHERE user_id = '83a923f5-10ac-4ba1-ae5a-b1f65b302239'
        AND raw_input = 'apple-health-import'
    ) dupes
    WHERE rn > 1
  );
```

### Part 2: Code fix for future imports

**File: `src/components/AppleHealthImport.tsx`**

After the scan loop finishes building the `workouts` array, deduplicate before calling `setAllWorkouts`:

```typescript
const seen = new Set<string>();
const uniqueWorkouts = workouts.filter((w) => {
  const key = `${w.mapping.exercise_key}|${w.loggedDate}|${Math.round(w.durationMinutes || 0)}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
setAllWorkouts(uniqueWorkouts);
```

This prevents the 50KB chunk overlap from producing duplicate entries in future imports.

