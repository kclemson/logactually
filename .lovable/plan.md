

# Equation Display: User-Friendly Units + Two-Line Layout

## Changes to `src/components/CalorieTargetDialog.tsx`

### 1. Show values in the user's preferred units (not metric)

The equation currently shows `68kg` and `173cm` even when the user has lbs/ft selected. Since the equation is educational (not doing real math), it should display values in the user's chosen units.

Update the `equationData` memo to compute display strings based on `settings.weightUnit` and `settings.heightUnit`:
- Weight: show `150 lbs` or `68 kg` depending on `settings.weightUnit`
- Height: show `5'1"` or `155 cm` depending on `settings.heightUnit` (using `formatInchesAsFeetInches` for ft)
- Drop the metric-specific coefficients (10, 6.25, 5) since they only apply to kg/cm and would confuse users on imperial units

The equation becomes a functional description showing inputs and result:
```
f(150 lbs, 5'1", 48 years, Female) = ~1,248
```

Import `formatInchesAsFeetInches` from `@/lib/calorie-burn` (already imported for `computeAbsoluteBMR`).

### 2. Split into label line + equation line

Restructure each equation from a single wrapped paragraph into two lines:

```
Base metabolic rate (BMR)
= f(150 lbs, 5'1", 48 years, Female) = ~1,248

Total daily energy expenditure (TDEE)
= 1,248 x 1.375 - 0 deficit = 1,716 cal/day
```

When values are missing, use the existing italic placeholder pattern:
```
Base metabolic rate (BMR)
= f(weight, height, age, profile)

Total daily energy expenditure (TDEE)
= BMR x activity level - deficit = ...
```

### 3. Remove foreground color from equation results

Remove all `text-foreground` and `<span className="text-foreground">` from the equation results so they inherit the muted color of the surrounding text. The BMR value (`~1,248`) and TDEE result (`1,716 cal/day`) should blend with the rest of the equation.

## File Summary

| File | Changes |
|---|---|
| `src/components/CalorieTargetDialog.tsx` | Update equationData memo for user units; restructure equation into label+value lines; remove foreground color from results; import `formatInchesAsFeetInches` |

