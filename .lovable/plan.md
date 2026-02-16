

# Body Stats Equation Display: Two-Line Educational Breakdown

## Goal

Replace the single-line equation with a two-line stacked format that teaches users what BMR and TDEE mean, shows how each input feeds into the math, and uses italic placeholders for values not yet entered.

## Design

The equations will always render when in `body_stats` mode, regardless of whether all fields are filled in. Missing values appear as italic placeholder names so users can see what's needed.

### Example outputs

**Nothing filled in:**
```
BMR = 10 x weight + 6.25 x height - 5 x age +/- profile
TDEE = BMR x activity level - deficit = ...
```

**Weight + height filled, age + profile + activity missing:**
```
BMR = 10 x 68kg + 6.25 x 173cm - 5 x age +/- profile
TDEE = BMR x activity level - 0 deficit = ...
```

**Everything filled:**
```
BMR = 10 x 68 + 6.25 x 173 - 5 x 48 - 161 = ~1,248
TDEE = 1,248 x 1.375 - 0 deficit = 1,716 cal/day
```

The `+/- profile` placeholder represents the Mifflin-St Jeor sex constant (+5 for male, -161 for female, average when unset). When a profile is selected, it shows the actual constant (e.g., `- 161`).

## Changes

### `src/components/CalorieTargetDialog.tsx`

1. **Refactor `tdeeSummary` memo** to return partial data instead of null when values are missing. It will compute whatever intermediate values are available (weight in kg, height in cm, BMR if computable, TDEE if activity level is set) and return them along with flags for what's missing.

2. **Replace the equation rendering block** (lines 229-234). Remove the `{tdeeSummary && ...}` guard. Instead, always render the equation block when in `body_stats` mode. The block contains two lines:

   - **Line 1 (BMR):** Shows the Mifflin-St Jeor formula with actual numbers where available, italic placeholders where not. If BMR is computable, shows `= ~{bmr}` at the end.
   - **Line 2 (TDEE):** Shows `BMR x activity_multiplier - deficit = target cal/day`, using the computed BMR value or italic "BMR" placeholder, and italic placeholders for missing activity level.

3. **Fix focus ring clipping**: Change `pt-1` to `p-1` on line 136 so the mode dropdown's focus ring isn't clipped by the parent's `overflow-hidden`.

4. **Rename deficit label**: Change "Daily deficit (cal)" to "Target deficit (cal/day)" on line 214.

### Equation rendering logic (pseudocode)

```tsx
// Always render in body_stats mode
const weightKg = settings.bodyWeightLbs ? (settings.bodyWeightLbs * 0.453592).toFixed(0) : null;
const heightCm = settings.heightInches ? (settings.heightInches * 2.54).toFixed(0) : null;
const age = settings.age;
const profile = settings.bodyComposition;
const bmr = computeAbsoluteBMR(settings); // null if no weight
const multiplier = settings.activityLevel ? ACTIVITY_MULTIPLIERS[settings.activityLevel] : null;
const deficit = settings.dailyDeficit ?? 0;

// Line 1: BMR = 10 x {wt} + 6.25 x {ht} - 5 x {age} {profile_constant} [= ~bmr]
// Line 2: TDEE = {bmr} x {multiplier} - {deficit} deficit = {target} cal/day

// Italic placeholder component for missing values:
// <em className="not-italic text-muted-foreground/50">placeholder</em>
```

---

## File Summary

| File | Changes |
|---|---|
| `src/components/CalorieTargetDialog.tsx` | Refactor tdeeSummary memo to partial; two-line equation with placeholders; fix focus ring padding; rename deficit label |

