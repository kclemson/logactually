

# Populate `calories_burned_estimate` on Write and Body Stats Change

## Overview

Two changes to ensure `calories_burned_estimate` is always populated going forward:

1. **On insert/update**: Compute the estimate when exercise sets are created or edited
2. **On body stats change**: Recompute all existing rows when the user updates body weight, height, age, composition, or default intensity

## Change 1: Compute estimate on insert

**File: `src/hooks/useWeightEntries.ts`**

The `createEntry` mutation will accept an optional `calorieBurnSettings` parameter (type `CalorieBurnSettings` from `calorie-burn.ts`). When provided, for each set being inserted, call `estimateCalorieBurn()` and store the midpoint as `calories_burned_estimate`.

Midpoint formula:
```text
result.type === 'exact'           -> result.value
result.type === 'range', sum > 0  -> Math.round((low + high) / 2)
otherwise                         -> null
```

**Caller change in `src/pages/WeightLog.tsx`**: The `createEntryFromExercises` function already has access to `settings` via `useUserSettings`. It will extract `CalorieBurnSettings` fields and pass them to `createEntry.mutateAsync()`. Same for `handleCopyEntryToToday`.

**On individual set update** (`updateSet` mutation): When fields that affect the estimate change (sets, reps, weight_lbs, duration_minutes, distance_miles, effort, incline_pct, calories_burned_override), also recompute and persist `calories_burned_estimate`. This requires the caller to pass settings alongside the update, or the hook to accept settings as a parameter.

The cleanest approach: make `useWeightEntries` accept an optional `CalorieBurnSettings` parameter so both `createEntry` and `updateSet` can access it without changing every call site's signature.

## Change 2: Recompute all rows on body stats change

**New file: `src/hooks/useRecomputeEstimates.ts`**

A hook that exposes `recompute(settings: CalorieBurnSettings)`:
1. Fetch all `weight_sets` for the user (id, exercise_key, exercise_subtype, sets, reps, weight_lbs, duration_minutes, distance_miles, calories_burned_override, effort, heart_rate, incline_pct, cadence_rpm, speed_mph, exercise_metadata)
2. Run `estimateCalorieBurn()` for each row
3. Compute the midpoint
4. Batch-update `calories_burned_estimate` in groups of ~100 rows (using individual update calls grouped by value, or sequential batch updates)

**File: `src/hooks/useUserSettings.ts`**

Add an `onSuccess` callback to the `updateSettings` mutation. When the saved updates include any body-stat key (`bodyWeightLbs`, `heightInches`, `age`, `bodyComposition`, `defaultIntensity`), call `recompute()` with the new settings. This runs silently in the background.

Since `useUserSettings` is a hook and `useRecomputeEstimates` is also a hook, the recompute function will be called inside `useUserSettings` via composition -- `useUserSettings` will internally use `useRecomputeEstimates` and wire up the trigger in `onSuccess`.

## Technical details

### Files to create
- `src/hooks/useRecomputeEstimates.ts`

### Files to modify
- `src/hooks/useWeightEntries.ts` -- accept optional `CalorieBurnSettings`, compute estimate in `createEntry` rows
- `src/pages/WeightLog.tsx` -- pass `CalorieBurnSettings` to `createEntry` calls
- `src/hooks/useUserSettings.ts` -- import and trigger recompute on body-stat changes in `onSuccess`

### Body stat keys that trigger recompute
`bodyWeightLbs`, `heightInches`, `age`, `bodyComposition`, `defaultIntensity`

### Supabase query limit consideration
The recompute fetches all `weight_sets` for a user. If a user has >1000 rows, we need to paginate (using `.range()` calls) to avoid hitting the default 1000-row limit.

