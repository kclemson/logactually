

# Fix category change: proper close-on-save with working exercise_key values

## Root Cause (two bugs, one function)

`applyCategoryChange` returns `{ exercise_key: '' }` for both strength and cardio. This causes two failures:

1. **Cardio to Strength**: Save succeeds (`exercise_key: '' != 'walk_run'`), but on refetch `flattenExerciseValues` classifies `''` as "other" since it's not in `EXERCISE_MUSCLE_GROUPS` and not cardio. The item ends up showing as "Other" instead of "Strength".

2. **Other to Strength**: If the item already has `exercise_key: ''`, the sidecar sweep sees no diff (new value `''` === old value `''`), so nothing is saved at all -- a complete no-op.

## Solution

Two changes:

### 1. Replace the broken async approach with simple close-on-save

Remove all async/loading-mask complexity from `DetailDialog` and `WeightLog`. Just save and close the dialog. When the user reopens it, fresh data from the refetched query will drive the correct field layout. One extra tap to reopen, but rock-solid reliable.

### 2. Fix the category-to-exercise_key mapping

The category is derived from `exercise_key` via `flattenExerciseValues`. For category changes to persist correctly, we need `exercise_key` values that survive the round-trip through that derivation:

- **Strength**: use a known strength key. Since `EXERCISE_MUSCLE_GROUPS['functional_strength']` exists and has `primary: 'Full Body'` (not cardio), changing to strength will set `exercise_key: 'functional_strength'` as a sensible default -- the user can then edit the specific exercise type.
- **Cardio**: use `'walk_run'` as the default cardio key (most common).
- **Other**: use `'other'` (already works, not in any registry so classifies as "other").

Update `applyCategoryChange`:

```typescript
export function applyCategoryChange(
  newCategory: 'strength' | 'cardio' | 'other'
): { exercise_key: string } {
  switch (newCategory) {
    case 'strength': return { exercise_key: 'functional_strength' };
    case 'cardio':   return { exercise_key: 'walk_run' };
    case 'other':    return { exercise_key: 'other' };
  }
}
```

This guarantees:
- Strength default: `EXERCISE_MUSCLE_GROUPS['functional_strength']` exists, not cardio, so classified as "strength"
- Cardio default: `isCardioExercise('walk_run')` returns true, so classified as "cardio"
- Other: `'other'` is not in any registry, so classified as "other"

And since these are all different from each other, the sidecar sweep will always detect a diff when switching categories.

## Changes

### `src/lib/exercise-metadata.ts`

Update `applyCategoryChange` to return category-appropriate default exercise keys instead of `''`.

### `src/components/DetailDialog.tsx`

- Remove `saving` state and `Loader2` loading overlay
- Revert `handleSave` to synchronous (call `onSave(updates)`, then close dialog)
- Revert `onSave` prop type back to `(updates) => void`
- Keep the sidecar draft sweep (still needed to capture `exercise_key` when it's not in `fieldsFlat`)

### `src/pages/WeightLog.tsx`

- Revert `handleDetailSave` to synchronous
- Always use `updateSet.mutate(...)` and `setDetailDialogItem(null)` (close dialog)
- Remove `isCategoryChange` branching and `mutateAsync` usage

## UX flow after fix

1. User opens "Other" exercise, taps Edit, changes Category to "Strength"
2. `applyCategoryChange` sets `exercise_key = 'functional_strength'` in draft
3. User taps Save
4. Dialog closes immediately
5. Mutation fires, query refetches in background
6. User taps the exercise again -- dialog opens with Strength layout, Exercise Type defaults to "Functional strength", user can change it

## Files changed

| File | What |
|------|------|
| `src/lib/exercise-metadata.ts` | Fix `applyCategoryChange` to return correct default keys per category |
| `src/components/DetailDialog.tsx` | Remove async/loading state, revert to sync save-and-close |
| `src/pages/WeightLog.tsx` | Revert to sync save, always close dialog |

