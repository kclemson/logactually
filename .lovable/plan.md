

# Fix Activity Level Dropdown Truncation

## Problem
"Moderately active x1.55" is the longest option in the activity level dropdown. The trigger is fixed at `w-[160px]`, which is too narrow, causing the text to truncate to "Moderately..." and hiding the multiplier. The other options (Sedentary, Lightly active, Active) are shorter and fit fine.

## Solution
Widen the `SelectTrigger` from `w-[160px]` to `w-[200px]` so all activity level labels including their multipliers display without truncation.

## Technical details

| File | Change |
|---|---|
| `src/components/CalorieTargetDialog.tsx` line 206 | Change `w-[160px]` to `w-[200px]` on the activity level `SelectTrigger` |

