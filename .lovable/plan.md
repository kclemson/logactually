

# Backfill missing heart_rate from raw input

## What happened

The AI model wasn't reliably extracting heart rate when you used "bpm" shorthand (e.g., "101bpm", "107 bpm") in entries before ~Feb 17. It worked when you wrote "heart rate" or "avg hr", but bare "bpm" values were dropped during parsing. The prompt was already correct — this was inconsistent AI model behavior that has since stabilized.

## Affected data

15 entries (Feb 10–17) have heart rate clearly stated in the raw input but not stored. Mix of dog walks, treadmill runs, and one indoor bike entry.

## Fix

**One-time database migration** to backfill `heart_rate` from `raw_input` text using regex extraction:

1. Extract the number before "bpm" (e.g., "101bpm" → 101, "107 bpm" → 107)
2. Extract the number after "heart rate" (e.g., "avg heart rate 105" → 105)  
3. Update the `heart_rate` column for the 15 affected rows
4. Also update `exercise_metadata` to add the `heart_rate` key for backward compatibility

No code changes needed — this is purely a data backfill via SQL.

## Migration SQL (single UPDATE)

```sql
UPDATE weight_sets
SET heart_rate = COALESCE(
  (regexp_matches(raw_input, '(\d{2,3})\s*bpm', 'i'))[1]::int,
  (regexp_matches(raw_input, 'heart rate\s*(\d{2,3})', 'i'))[1]::int
)
WHERE heart_rate IS NULL
  AND (exercise_metadata->>'heart_rate') IS NULL
  AND (
    raw_input ~ '\d{2,3}\s*bpm'
    OR raw_input ~* 'heart rate\s*\d{2,3}'
  );
```

| File | Change |
|---|---|
| DB migration | Backfill `heart_rate` column from `raw_input` regex for 15 rows |

