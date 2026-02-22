

# Fix: Buffer body stat changes behind a Save button

## Problem
Both the Calorie Burn and Calorie Target dialogs call `updateSettings()` on every keystroke through `BiometricsInputs`. Each call triggers a background recompute of ALL `weight_sets` rows. With 1000+ rows, this means hundreds of concurrent HTTP requests firing repeatedly as the user types, causing silent failures and incomplete updates.

## Solution
Add local draft state to both dialogs. Changes are buffered in component state and only flushed to the database with a single `updateSettings()` call when the user clicks "Save". This also means one recompute instead of many.

Additionally, fix the recompute itself: group updates by estimate value and use `.in('id', [...])` instead of individual row updates.

## Changes

### 1. `BiometricsInputs` -- accept draft mode

Currently every input handler calls `updateSettings(...)` directly. Add an optional `onChange` callback prop as an alternative:

- New prop: `onChange?: (updates: Partial<UserSettings>) => void`
- When `onChange` is provided, call it instead of `updateSettings`
- The parent dialog passes a function that merges updates into local draft state
- This keeps BiometricsInputs reusable -- callers that don't pass `onChange` keep the current auto-save behavior

### 2. `CalorieBurnDialog` -- add draft state and Save button

- Add `useState` for a `draft: Partial<UserSettings>` initialized from current settings when dialog opens
- Compute a merged view: `{ ...settings, ...draft }` and pass that as `settings` to BiometricsInputs
- Pass an `onChange` handler that merges into `draft` instead of calling `updateSettings`
- Same for the intensity input and the toggle
- Add a "Save" button in a sticky footer (matching the DetailDialog pattern)
- On Save: call `updateSettings(draft)` once, close the dialog
- On dismiss (backdrop/X): discard draft, close dialog
- The live preview section continues to work because it reads from the merged draft, not from saved settings
- Track dirty state: only show Save button when draft differs from settings

### 3. `CalorieTargetDialog` -- same pattern

- Add local draft state for all fields edited in the dialog (mode, activity level, biometrics, deficit, static target)
- Pass merged `{ ...settings, ...draft }` to BiometricsInputs and use for all computed values
- Add Save button in sticky footer
- On Save: flush `draft` via single `updateSettings()` call

### 4. `useRecomputeEstimates` -- fix batch strategy

Replace the current approach (100 concurrent individual `.update().eq('id', id)` calls) with grouped batch updates:

- Group row IDs by their computed estimate value into a `Map<number | null, string[]>`
- Issue one `.update({ calories_burned_estimate: value }).in('id', ids)` call per group
- This reduces 1000+ HTTP requests to ~50-100 calls (one per distinct calorie value)
- Add explicit error checking on each response
- Add `Number()` conversion on all nullable numeric fields from DB rows (duration_minutes, distance_miles, effort, heart_rate, incline_pct, cadence_rpm, speed_mph, calories_burned_override, sets, reps)

### 5. `useUserSettings` -- remove debounce complexity

Since the dialogs now batch changes into a single `updateSettings()` call, the `onSuccess` recompute trigger no longer needs debouncing. The existing check for body-stat keys in `onSuccess` is sufficient as-is.

## Files to modify
- `src/components/BiometricsInputs.tsx` -- add optional `onChange` prop
- `src/components/CalorieBurnDialog.tsx` -- add draft state, Save button, pass `onChange` to BiometricsInputs
- `src/components/CalorieTargetDialog.tsx` -- add draft state, Save button, pass `onChange` to BiometricsInputs
- `src/hooks/useRecomputeEstimates.ts` -- grouped batch updates, numeric conversion, error checking

## UI notes
- Save button appears at the bottom of each dialog, styled like the DetailDialog's save action
- The button is only enabled when the user has made changes (dirty check)
- The toggle (enable/disable) still saves immediately since it's a deliberate single action, not a "typing" scenario
- Live preview in CalorieBurnDialog continues to update in real-time from draft values

