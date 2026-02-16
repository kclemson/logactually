

# Fix Label Redundancy and Unit Styling Consistency

## Issue 1: Redundant "cal/day" in exercise-adjusted mode

The label says "Target (cal/day)" and there's also a "cal/day" badge next to the input. Remove "cal/day" from the label so it just says "Target", matching the pattern where the unit is shown beside the input.

**File:** `src/components/CalorieTargetDialog.tsx`, line 289
- Change `Target (cal/day)` to `Target`

## Issue 2: Non-interactive units styled like interactive ones

Currently, "years" (age), "cal/day" (target deficit and exercise-adjusted), and the interactive unit toggles (lbs/kg, ft/cm) all share the same styling: `bg-primary/10 text-foreground font-medium`. But only lbs/kg and ft/cm are clickable toggles -- the rest are static labels.

**Rule:** Interactive units get `font-medium` (bold). Non-interactive units do not.

### Changes in `src/components/BiometricsInputs.tsx`

- **Line 234** (Age "years" span): Remove `font-medium` from the class
  - From: `"text-xs px-1.5 py-0.5 rounded bg-primary/10 text-foreground font-medium"`
  - To: `"text-xs px-1.5 py-0.5 rounded bg-primary/10 text-foreground"`

### Changes in `src/components/CalorieTargetDialog.tsx`

- **Line 247** (Target deficit "cal/day" span): Remove `font-medium`
  - From: `"text-xs px-1.5 py-0.5 rounded bg-primary/10 text-foreground font-medium whitespace-nowrap"`
  - To: `"text-xs px-1.5 py-0.5 rounded bg-primary/10 text-foreground whitespace-nowrap"`

- **Line 303** (Exercise-adjusted "cal/day" span): Remove `font-medium`
  - From: `"text-xs px-1.5 py-0.5 rounded bg-primary/10 text-foreground font-medium whitespace-nowrap"`
  - To: `"text-xs px-1.5 py-0.5 rounded bg-primary/10 text-foreground whitespace-nowrap"`

### No changes needed for interactive units

The lbs/kg and ft/cm buttons in `BiometricsInputs.tsx` already correctly use `font-medium` only on the active selection, which is the right pattern for interactive toggles.

## Summary

| File | Line | Change |
|---|---|---|
| `CalorieTargetDialog.tsx` | 289 | Label: "Target (cal/day)" to "Target" |
| `CalorieTargetDialog.tsx` | 247 | Remove `font-medium` from deficit "cal/day" |
| `CalorieTargetDialog.tsx` | 303 | Remove `font-medium` from exercise "cal/day" |
| `BiometricsInputs.tsx` | 234 | Remove `font-medium` from "years" |

