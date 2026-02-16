

# Reframe Exercise-Adjusted Mode Labeling

## The core insight

The exercise-adjusted input isn't a "base goal" — it's the same concept as the static target (your daily calorie target). The difference is only in how the comparison works: exercise calories get subtracted from your food intake before checking against the target. Calling it "base goal" makes it sound like a different concept and invites confusing "plus/minus" language.

## Changes

### 1. Dropdown option in `src/lib/calorie-target.ts` (line 44)

**Current:** label "Exercise adjusted", description "Your base goal plus actual calories burned each day"

**New:** label "Exercise adjusted", description "Logged exercise offsets your food intake"

### 2. Exercise-adjusted input label in `CalorieTargetDialog.tsx` (line 289)

**Current:** "Base goal"

**New:** "Target (cal/day)" — identical to the static mode label, because it's the same concept

### 3. Explanatory text in `CalorieTargetDialog.tsx` (line 307-309)

**Current:** "Your target for each day is this base goal plus any calories you burn through logged exercises, so active days give you more room."

**New:** "Calories burned from logged exercises are subtracted from your food intake before comparing to this target — so active days give you more room."

This frames it as: food minus exercise < target, which is exactly how a user would think about it.

## Technical details

| File | Lines | Change |
|---|---|---|
| `src/lib/calorie-target.ts` | 44 | Update description string |
| `src/components/CalorieTargetDialog.tsx` | 289 | Change label from "Base goal" to "Target (cal/day)" |
| `src/components/CalorieTargetDialog.tsx` | 307-309 | Reword explanation |

