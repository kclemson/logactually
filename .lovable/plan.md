

# DetailDialog: 4 fixes + 1 bug investigation

## Changes

### 1. Rename "Cal Burned" to "Burned" (`src/lib/exercise-metadata.ts`, line 294)
Change the label in `KNOWN_METADATA_KEYS` from `'Cal Burned'` to `'Burned'`. The unit `cal` already provides context.

### 2. Add vertical spacing between Cancel/Save buttons on mobile (`src/components/DetailDialog.tsx`, line 611)
The `DialogFooter` uses `flex-col-reverse` on mobile (from the shadcn component). The buttons have no gap. Add `gap-2` to the footer:
```
<DialogFooter className="px-4 py-3 flex-shrink-0 gap-2">
```

### 3. Fix validation message alignment on desktop (`src/components/DetailDialog.tsx`, line 614)
Currently the validation `<p>` has `w-full` which forces it onto its own row in `flex-col-reverse`, but on desktop (`sm:flex-row`) it sits alongside buttons with top-alignment. Change to `self-end` so it aligns with button baselines on desktop:
```
<p className="text-[10px] italic text-muted-foreground/70 sm:self-end sm:mb-0.5 w-full sm:w-auto sm:mr-auto">
```
This left-aligns the text on desktop while pushing buttons to the right, and `self-end` + `mb-0.5` aligns it near the button baseline.

### 4. Category save bug (`src/components/DetailDialog.tsx`, `processExerciseSaveUpdates`)
**Root cause**: When the user changes `_exercise_category` (e.g., from "other" to "strength"), the `processExerciseSaveUpdates` function silently drops it because all keys starting with `_` that aren't `_meta_*` are discarded (line 796-802). The category never reaches the database.

Additionally, the field layout is computed once from the initial `fields` prop and doesn't re-render when the draft category changes, so the user never sees the Type/Subtype dropdowns for the new category.

**Fix**: In `processExerciseSaveUpdates`, when `_exercise_category` is present in the updates, map it to an actual `exercise_key` change. Specifically:
- If the new category is `'other'`, set `exercise_key` to `'other'` (or clear it) so `flattenExerciseValues` will derive `'other'` on next load.
- If switching to `'strength'` or `'cardio'` without a new `exercise_key`, keep the existing `exercise_key` if it matches the new category, otherwise clear it. Since the user can't currently pick a new exercise type (the layout doesn't re-render), we should at minimum persist the category intent by setting `exercise_key` to a sensible default or clearing it.

The minimal viable fix: in `processExerciseSaveUpdates`, detect `_exercise_category` and translate it to an `exercise_key` update:
```typescript
// Handle _exercise_category -> exercise_key mapping
if ('_exercise_category' in updates) {
  const newCat = updates._exercise_category;
  if (newCat === 'other') {
    regularUpdates.exercise_key = 'other';
  }
  // If switching to strength/cardio but no exercise_key was selected,
  // clear the key so the user can pick one next time
  if (!regularUpdates.exercise_key && newCat !== 'other') {
    regularUpdates.exercise_key = '';
  }
}
```

**Note**: The full fix (dynamically re-rendering field layout when draft category changes) is a larger refactor. This minimal fix ensures the category change persists.

## Files changed

| File | What |
|------|------|
| `src/lib/exercise-metadata.ts` | "Cal Burned" to "Burned" |
| `src/components/DetailDialog.tsx` | Footer gap, validation text alignment, category save fix in `processExerciseSaveUpdates` |
