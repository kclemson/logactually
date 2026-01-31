

## Migrate Old Cardio Keys to Consolidated Keys

### Current State

| Old Key | Count | New Key |
|---------|-------|---------|
| `running` | 33 | `walk_run` |
| `treadmill_walk` | 1 | `walk_run` |

**Total: 34 entries to migrate**

---

### Migration SQL

```sql
-- Consolidate legacy cardio exercise keys to new unified keys
UPDATE weight_sets 
SET exercise_key = 'walk_run', updated_at = now()
WHERE exercise_key IN ('running', 'treadmill_walk', 'treadmill', 'walking');

-- Future-proof: also handle stationary_bike and rowing_machine if they ever appear
UPDATE weight_sets 
SET exercise_key = 'cycling', updated_at = now()
WHERE exercise_key = 'stationary_bike';

UPDATE weight_sets 
SET exercise_key = 'rowing', updated_at = now()
WHERE exercise_key = 'rowing_machine';
```

---

### Verification

After migration, all cardio entries should use these keys only:
- `walk_run` (consolidated from running/walking/treadmill)
- `cycling` (consolidated from stationary_bike)
- `rowing` (consolidated from rowing_machine)
- `elliptical`, `stair_climber`, `swimming`, `jump_rope` (unchanged)

