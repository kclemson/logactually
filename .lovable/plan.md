

## Smarter Exercise Previews + Input Alignment

### Overview
Update the CalorieBurnDialog to show 2 cardio + 2 strength exercise previews ranked by frequency, with a new database RPC for efficient querying, and fix vertical alignment of all input rows.

### 1. Database Migration: `get_top_exercises` RPC

Create a SQL function that accepts a user ID and an array of cardio exercise keys (passed from the client, sourced from the existing `exercise-metadata.ts` classification). It returns the top 2 most frequent cardio and top 2 most frequent strength exercises, with a representative recent row for each.

```sql
CREATE OR REPLACE FUNCTION get_top_exercises(
  p_user_id uuid,
  p_cardio_keys text[],
  p_limit_per_group int DEFAULT 2
)
RETURNS TABLE (
  exercise_key text,
  exercise_subtype text,
  sets int,
  reps int,
  weight_lbs numeric,
  duration_minutes numeric,
  distance_miles numeric,
  exercise_metadata jsonb,
  description text,
  is_cardio boolean,
  frequency bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  (
    SELECT ws.exercise_key, ws.exercise_subtype, ws.sets, ws.reps,
           ws.weight_lbs, ws.duration_minutes, ws.distance_miles,
           ws.exercise_metadata, ws.description,
           true as is_cardio, sub.cnt as frequency
    FROM (
      SELECT exercise_key, COUNT(*) as cnt
      FROM weight_sets WHERE user_id = p_user_id
        AND exercise_key = ANY(p_cardio_keys)
      GROUP BY exercise_key ORDER BY cnt DESC
      LIMIT p_limit_per_group
    ) sub
    JOIN LATERAL (
      SELECT * FROM weight_sets
      WHERE user_id = p_user_id AND exercise_key = sub.exercise_key
      ORDER BY created_at DESC LIMIT 1
    ) ws ON true
  )
  UNION ALL
  (
    SELECT ws.exercise_key, ws.exercise_subtype, ws.sets, ws.reps,
           ws.weight_lbs, ws.duration_minutes, ws.distance_miles,
           ws.exercise_metadata, ws.description,
           false as is_cardio, sub.cnt as frequency
    FROM (
      SELECT exercise_key, COUNT(*) as cnt
      FROM weight_sets WHERE user_id = p_user_id
        AND NOT (exercise_key = ANY(p_cardio_keys))
      GROUP BY exercise_key ORDER BY cnt DESC
      LIMIT p_limit_per_group
    ) sub
    JOIN LATERAL (
      SELECT * FROM weight_sets
      WHERE user_id = p_user_id AND exercise_key = sub.exercise_key
      ORDER BY created_at DESC LIMIT 1
    ) ws ON true
  )
$$;
```

### 2. Frontend Changes (`CalorieBurnDialog.tsx`)

**Sample data split:**
- `SAMPLE_CARDIO`: Walking 25 min, Running 30 min
- `SAMPLE_STRENGTH`: Lat Pulldown 3x10 @ 60, Leg Press 3x10 @ 150

**Query replacement:**
- Import `isCardioExercise` and `EXERCISE_MUSCLE_GROUPS` from `exercise-metadata.ts`
- Build `cardioKeys` array by filtering the metadata map for `isCardio === true`
- Replace the current `supabase.from('weight_sets')` query with `supabase.rpc('get_top_exercises', { p_user_id: user.id, p_cardio_keys: cardioKeys })`

**Preview assembly:**
- Separate RPC results into cardio and strength arrays (using the returned `is_cardio` flag)
- If fewer than 2 cardio results, fill remaining from `SAMPLE_CARDIO`
- If fewer than 2 strength results, fill remaining from `SAMPLE_STRENGTH`
- Final order: cardio first, then strength (always 4 items)
- `isUsingSamples` = true if any fallback was used

### 3. Input Alignment

Add a shared right-column class:
```
const rightColClass = "flex items-center gap-1 justify-end w-[7.5rem]"
```

Applied to all four input rows:
- **Body weight:** input (w-20) + unit label
- **Height:** input (shrunk to w-16) + in/cm toggle buttons
- **Age:** input (w-20), remove the empty w-6 spacer
- **Default intensity:** input + "/10" label

This ensures all right-side controls share the same fixed width and align vertically.

