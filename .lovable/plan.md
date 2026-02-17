
# Change calorie burn preview to 3 cardio + 1 strength

## Overview
Update the preview in the "Show estimated calorie burn" dialog to display 3 cardio exercises and 1 strength exercise instead of the current 2+2 split, both for user data and sample fallbacks.

## Changes (single file: `src/components/CalorieBurnDialog.tsx`)

### 1. Add a 3rd sample cardio fallback
Add a swimming entry to `SAMPLE_CARDIO`:
```ts
{ exercise_key: 'swimming', sets: 0, reps: 0, weight_lbs: 0, duration_minutes: 20 }
```

### 2. Trim `SAMPLE_STRENGTH` to 1 entry
Keep only bench press, remove squat (we only need one fallback now).

### 3. Pass `p_limit_per_group: 3` to the RPC
This fetches up to 3 cardio from the user's history. The extra strength rows returned (up to 3) are harmless -- the client slices to 1.

### 4. Update the assembly logic
Change the fill-loop caps:
- Cardio: fill to 3 (was 2)
- Strength: fill to 1 (was 2)

Also slice user arrays so we never exceed the target count:
```ts
const userCardio = (userExercises || []).filter(e => e.is_cardio).slice(0, 3);
const userStrength = (userExercises || []).filter(e => !e.is_cardio).slice(0, 1);
```

No database migration needed -- the RPC already accepts `p_limit_per_group`.
