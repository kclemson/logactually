

# Update demo account settings

## Changes

A single database migration to update the demo account's profile settings:

1. Set `calorieTargetMode` to `exercise_adjusted` (was `body_stats`)
2. Restore biometric data that was lost:
   - `bodyWeightLbs`: 165
   - `heightInches`: 67 (5'7")
   - `bodyComposition`: "male"
   - `age`: 35
3. Keep existing values: `dailyCalorieTarget` (2000), `calorieBurnEnabled` (true)

## Technical Details

Single SQL migration using `jsonb_set` chained calls (or `||` merge operator) to update the `profiles.settings` column for the demo account (`id = 'f65d7de9-...'`).

```sql
UPDATE profiles
SET settings = settings
  || '{"calorieTargetMode":"exercise_adjusted","bodyWeightLbs":165,"heightInches":67,"bodyComposition":"male","age":35}'::jsonb
WHERE id = 'f65d7de9-91bf-4140-b16e-5e4a951eeca5';
```

No code changes needed -- all settings are already supported by the existing UI and logic.

