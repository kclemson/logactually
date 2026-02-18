

# Fix: capture side-effect draft keys in handleSave

## Problem

`handleSave` only iterates `fieldsFlat` to build the `updates` object. When `applyCategoryChange` injects `exercise_key` into the draft (a real DB column not present in the current field layout), it's never extracted, so an empty update is sent and the async save path never triggers.

## Approach

Add a second pass in `handleSave` after the `fieldsFlat` loop that sweeps the draft for any non-virtual keys (`exercise_key`, etc.) that were injected by side-effect handlers but aren't represented by a field in the layout. This is a DetailDialog-internal concern (it's about how the dialog collects updates from its own draft state), so it belongs in `handleSave` rather than in a shared utility.

## Change

### `src/components/DetailDialog.tsx` — `handleSave` (after the `fieldsFlat` loop, around line 460)

Insert a sweep of the draft for "sidecar" real-column keys:

```typescript
// After the fieldsFlat iteration (line 460):

// Capture real-column keys injected into draft by side-effect handlers
// (e.g. applyCategoryChange sets exercise_key when _exercise_category changes)
for (const [key, val] of Object.entries(draft)) {
  if (key.startsWith('_')) continue;        // skip virtual/internal fields
  if (updates[key] !== undefined) continue;  // already captured from fieldsFlat
  if (val !== values[key]) {
    updates[key] = val;
  }
}
```

No other files need changes. The WeightLog async path and `processExerciseSaveUpdates` are already wired correctly — they just never received the `exercise_key` update because it was dropped here.

## Why not a shared utility

- The draft, values, fieldsFlat, and `_`-prefix convention are all internal to DetailDialog
- `processExerciseSaveUpdates` (the shared function) already handles the output correctly
- Extracting this into a shared function would require passing 4 pieces of DetailDialog-internal state as arguments, adding complexity without reuse benefit

## Files changed

| File | What |
|------|------|
| `src/components/DetailDialog.tsx` | Add draft sidecar sweep in `handleSave` after the `fieldsFlat` loop |

