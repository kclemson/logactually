

## One-Time SQL Update for Demo Account Biometrics

This is a simple data update -- no code changes needed. I'll run a single SQL statement to merge the biometric settings into the demo account's existing profile settings JSON.

### What will be updated

The demo user profile (`f65d7de9-91bf-4140-b16e-5e4a951eeca5`) settings will be patched with:

- `bodyWeightLbs`: 165
- `heightInches`: 67 (5'7")
- `heightUnit`: "ft"
- `bodyComposition`: "male"
- `calorieBurnEnabled`: true (already set, preserved)

All other existing settings (dailyCalorieTarget: 2000, theme, weightUnit, etc.) will be preserved via JSONB merge (`||` operator).

### SQL

```sql
UPDATE profiles
SET settings = settings || '{"bodyWeightLbs": 165, "heightInches": 67, "heightUnit": "ft", "bodyComposition": "male", "calorieBurnEnabled": true}'::jsonb
WHERE id = 'f65d7de9-91bf-4140-b16e-5e4a951eeca5';
```

