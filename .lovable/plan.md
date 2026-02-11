

## Fix: Height (and Age) Should Impact Previews Independently

### Root cause

In `getBmrScalingFactor`, there's an early return:

```typescript
if (settings.heightInches == null || settings.age == null || settings.bodyWeightLbs == null) {
  return 1.0;
}
```

This means height changes do **nothing** unless the user has also filled in both weight and age. Since height and age are optional "narrows the range" fields, requiring all three defeats the purpose.

### Fix

Change `getBmrScalingFactor` to use **reference values** for any missing fields, so each field independently contributes:

- Missing weight: use midpoint of the default population range (160 lbs)
- Missing height: use reference height (170 cm / ~67 inches)
- Missing age: use reference age (30)

The function should only return 1.0 when **both** height and age are missing (since those are the only two fields that differ between user and reference -- weight cancels out in the ratio when both use the same value).

### Technical details

**`src/lib/calorie-burn.ts`** -- update `getBmrScalingFactor`:

Replace the all-or-nothing null check with individual fallbacks:

```typescript
export function getBmrScalingFactor(settings: CalorieBurnSettings): number {
  const heightInches = settings.heightInches;
  const age = settings.age;

  // If neither height nor age is provided, no adjustment is possible
  // (weight cancels out in the ratio)
  if (heightInches == null && age == null) {
    return 1.0;
  }

  // Use actual weight or population midpoint (weight mostly cancels
  // in the ratio, but is needed for the equation)
  const weightKg = (settings.bodyWeightLbs ?? 160) * 0.453592;
  const heightCm = heightInches != null ? heightInches * 2.54 : REFERENCE_HEIGHT_CM;
  const userAge = age ?? REFERENCE_AGE;

  // ... rest of Mifflin-St Jeor computation unchanged ...
}
```

This way:
- Changing height alone adjusts the ratio (user height vs reference 170cm)
- Changing age alone adjusts the ratio (user age vs reference 30)
- Weight, when provided, makes the ratio slightly more accurate but doesn't gate the feature

**`src/lib/calorie-burn.test.ts`** -- update test expectations:

Update existing tests that may assume 1.0 is returned when only one field is set, and add a test that verifies height-only changes produce different scaling factors.

### Files changed
- `src/lib/calorie-burn.ts` -- relax null guard in `getBmrScalingFactor`
- `src/lib/calorie-burn.test.ts` -- update/add test cases
