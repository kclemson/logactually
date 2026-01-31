

## Backfill Duration Minutes from Raw Input

### Overview

Parse the `raw_input` field for existing weight_sets entries to extract accurate fractional duration values. Most entries have formats like "11:30" (11 minutes 30 seconds) that were previously rounded to 12.

---

### Data Analysis

Looking at the existing data, entries follow patterns like:
- `.82mi run in 11:30` → should be 11.5 min (currently 11)
- `1.00 mi run in 11:48` → should be 11.8 min (currently 12)
- `1.01mi run in 12:25` → should be 12.42 min (currently 12)
- `1.39mi run in 19m` → stays 19 min (no seconds)

---

### SQL Migration

Run this SQL to update existing records:

```sql
UPDATE weight_sets
SET duration_minutes = 
  CASE 
    -- Pattern: "in MM:SS" (minutes:seconds format)
    WHEN raw_input ~ '\d+:\d{2}' THEN
      (regexp_match(raw_input, '(\d+):(\d{2})'))[1]::numeric + 
      (regexp_match(raw_input, '(\d+):(\d{2})'))[2]::numeric / 60
    -- Keep existing value if no MM:SS pattern found
    ELSE duration_minutes
  END
WHERE duration_minutes IS NOT NULL
  AND raw_input IS NOT NULL
  AND raw_input ~ '\d+:\d{2}';
```

---

### Expected Results

| raw_input | Before | After |
|-----------|--------|-------|
| `.82mi run in 11:30` | 11 | 11.5 |
| `1.00 mi run in 11:48` | 12 | 11.8 |
| `.97mi run in 12:25` | 12 | 12.42 |
| `1.7mi run in 21:34` | 22 | 21.57 |
| `1.39mi run in 19m` | 19 | 19 (unchanged) |

---

### Implementation

I'll run this as a database query using the migration tool to update all affected records in one operation.

