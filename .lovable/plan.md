

## Backfill Distance Data from Raw Input

### Current State

You have 33+ `walk_run` entries with `distance_miles = NULL` but the distance is present in the `raw_input` text.

**Example patterns found:**
| raw_input | Should extract |
|-----------|----------------|
| `1.01mi run in 11:34` | 1.01 |
| `1.00 mi run in 12:25` | 1.00 |
| `.88mi run in 10:49` | 0.88 |
| `1 mile run in 11:33 minutes` | 1.0 |

---

### Migration SQL

```sql
-- Backfill distance_miles from raw_input for walk_run entries
-- Handles patterns: "1.01mi", "1.00 mi", "1 mile", ".88mi"
UPDATE weight_sets
SET 
  distance_miles = (
    -- Extract the numeric value before 'mi' or 'mile'
    CASE 
      WHEN raw_input ~* '^[\d.]+\s*mi' THEN
        (regexp_match(raw_input, '^([\d.]+)\s*mi', 'i'))[1]::numeric
      WHEN raw_input ~* '([\d.]+)\s*mile' THEN
        (regexp_match(raw_input, '([\d.]+)\s*mile', 'i'))[1]::numeric
      ELSE NULL
    END
  ),
  updated_at = now()
WHERE exercise_key = 'walk_run'
  AND distance_miles IS NULL
  AND raw_input IS NOT NULL
  AND raw_input ~* '[\d.]+\s*mi';
```

---

### What This Does

1. Finds all `walk_run` entries where `distance_miles` is NULL
2. Extracts the number before "mi" or "mile" in the raw input
3. Sets that as the `distance_miles` value
4. Skips the treadmill walk entry (no distance pattern)

---

### Expected Results

| Entry | Before | After |
|-------|--------|-------|
| `1.01mi run in 11:34` | NULL | 1.01 |
| `1.00 mi run in 12:25` | NULL | 1.00 |
| `.88mi run in 10:49` | NULL | 0.88 |
| `30 minute walk on the treadmill...` | NULL | NULL (no change) |

---

### After Migration

Once the distance data is backfilled, we can proceed with the pace/speed display feature you asked about earlier.

