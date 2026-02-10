

## Backfill exercise_subtype for Existing walk_run Entries

### Problem
Apple Health imports set `exercise_subtype` correctly ('running', 'walking'), but older manually logged entries have `null`. This causes separate charts on the Trends page. New manual entries are now mostly getting the right subtype from the AI, but ~40 older entries need fixing.

### Solution: One-Time Data Migration
Run a SQL migration to backfill `exercise_subtype` based on the `description` field. No code changes needed.

### Technical Details

A single SQL migration with two UPDATE statements:

**Set subtype to 'running'** for entries where description contains "run" or "running":
```sql
UPDATE weight_sets
SET exercise_subtype = 'running'
WHERE exercise_key = 'walk_run'
  AND exercise_subtype IS NULL
  AND LOWER(description) ~ '(run|running)';
```

**Set subtype to 'walking'** for entries where description contains "walk", "treadmill" (without "run"), or "ball court":
```sql
UPDATE weight_sets
SET exercise_subtype = 'walking'
WHERE exercise_key = 'walk_run'
  AND exercise_subtype IS NULL
  AND (LOWER(description) ~ '(walk|treadmill|ball court)');
```

This covers all current null-subtype descriptions:
- "Running", "Run", "run", "1 mile run", "1.18 mile run", "Treadmill Run" -> **running**
- "Treadmill Walk", "Treadmill Incline Walk", "Treadmill", "walk", "Incline Treadmill", "ball court" -> **walking**

After this, all walk_run entries will have a subtype and the Trends charts will merge correctly.
