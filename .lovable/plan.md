

# Shared Biometrics Clearing Logic

## Why a shared codepath makes sense

Right now the two features that consume biometrics (calorie burn and calorie target in body_stats mode) each have their own toggle-off handler that independently decides what to clear. This creates a coordination problem: each handler needs to know about the other feature's state to avoid wiping shared data. A shared utility centralizes that logic in one place, so if a third consumer ever appears (or the conditions change), there's only one spot to update.

## What the shared function does

A single helper function (e.g. `buildBiometricsClearUpdates`) takes the current settings and returns the set of fields to nullify, based on this rule:

- **Biometric fields** (bodyWeightLbs, heightInches, age, bodyComposition) are only cleared if **neither** remaining consumer needs them.
- **Feature-specific fields** (like defaultIntensity for burn, or activityLevel/dailyDeficit for target) are always cleared when their own feature is disabled.

The callers just spread the result into their `updateSettings` call alongside their feature-specific flags.

## Technical details

### New file: `src/lib/biometrics-clear.ts`

```typescript
import type { UserSettings } from '@/hooks/useUserSettings';

// Shared biometric field keys
const BIOMETRIC_KEYS = ['bodyWeightLbs', 'heightInches', 'age', 'bodyComposition'] as const;

/**
 * Returns the biometric fields to nullify when a feature is being disabled.
 * Only clears shared biometrics if no other consumer still needs them.
 *
 * @param settings - current user settings
 * @param disabling - which feature is being turned off: 'burn' or 'target'
 */
export function buildBiometricsClearUpdates(
  settings: UserSettings,
  disabling: 'burn' | 'target',
): Partial<UserSettings> {
  const otherNeedsBiometrics =
    disabling === 'burn'
      ? settings.calorieTargetEnabled && settings.calorieTargetMode === 'body_stats'
      : settings.calorieBurnEnabled;

  if (otherNeedsBiometrics) return {};

  return Object.fromEntries(
    BIOMETRIC_KEYS.map(k => [k, null])
  ) as Partial<UserSettings>;
}
```

### CalorieBurnDialog toggle (lines 138-151)

Replace the inline nullification with:

```typescript
import { buildBiometricsClearUpdates } from '@/lib/biometrics-clear';

const handleToggle = () => {
  if (settings.calorieBurnEnabled) {
    updateSettings({
      calorieBurnEnabled: false,
      defaultIntensity: null,
      ...buildBiometricsClearUpdates(settings, 'burn'),
    });
  } else {
    updateSettings({ calorieBurnEnabled: true });
  }
};
```

### CalorieTargetDialog toggle (lines 89-103)

Add the same shared call so it also clears biometrics when safe:

```typescript
import { buildBiometricsClearUpdates } from '@/lib/biometrics-clear';

const handleToggle = () => {
  if (settings.calorieTargetEnabled) {
    updateSettings({
      calorieTargetEnabled: false,
      dailyCalorieTarget: null,
      calorieTargetMode: 'static',
      activityLevel: null,
      dailyDeficit: null,
      exerciseAdjustedBase: null,
      ...buildBiometricsClearUpdates(settings, 'target'),
    });
    onOpenChange(false);
  } else {
    updateSettings({ calorieTargetEnabled: true });
  }
};
```

### Summary of file changes

| File | Change |
|---|---|
| `src/lib/biometrics-clear.ts` (new) | Shared helper that determines which biometric fields to nullify |
| `src/components/CalorieBurnDialog.tsx` | Import helper, replace inline null assignments in toggle handler |
| `src/components/CalorieTargetDialog.tsx` | Import helper, add biometrics clearing to toggle handler |

