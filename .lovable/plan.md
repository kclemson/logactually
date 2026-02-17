

# Fix SavedItemRow Width and Demo Mode Editing Behavior

## Issue #1: Narrow Edit Box in Settings

**Root cause:** In `SavedItemRow.tsx` line 63-64, the wrapper div has the `truncate` class, which sets `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` -- this constrains the editable area to only the width of the current text.

In contrast, on the food/exercise pages, the wrapper div uses `flex-1 min-w-0` which lets the editable area fill all available horizontal space.

**Fix:** In `SavedItemRow.tsx`, change the wrapper div from:
```
'text-sm truncate cursor-text hover:bg-muted/50 focus-within:...'
```
to use `flex-1 min-w-0` like the food/exercise tables, so the ring expands to fill available width. The `truncate` stays on the DescriptionCell span itself (not the wrapper) so long names still ellipsis when not focused.

## Issue #2: Demo Mode -- Food Page Shows Edits Temporarily, Settings Does Not

**Root cause:** Two completely different data flow architectures:

- **Food/Exercise pages** use `useEditableItems`, which maintains a local `pendingEdits` Map in React state. When you edit a cell, `updateItem()` writes to this local Map immediately, and `displayItems` merges those edits over the query data. The DB write fails silently (RLS blocks it), but the local pending state persists until you navigate away (which unmounts the component and clears the state). That's why edits "stick" within a session.

- **Settings saved meals/routines** do NOT use `useEditableItems`. The `onUpdateName` callback goes directly to `useUpdateSavedMeal().mutate()`, which calls the DB. The DB write fails (RLS), `onSuccess` never fires, so the React Query cache never updates. Meanwhile, `DescriptionCell`'s ref callback sees `value` (the prop) hasn't changed and resets `textContent` back to the original on the next render.

**This is actually the correct behavior for Settings** -- saved meal/routine names should not appear edited when they weren't actually saved. The food page behavior is a side effect of the optimistic local editing layer, which is designed for a different purpose (batching edits before auto-save).

**No code change needed for issue #2.** The difference is architectural and each behavior is appropriate for its context.

## Technical Changes

### File: `src/components/SavedItemRow.tsx`

Change the wrapper div (lines 61-66) from:
```
<div className="flex items-center gap-1 flex-1 min-w-0">
  <div className={cn(
    'text-sm truncate cursor-text hover:bg-muted/50 focus-within:bg-focus-bg focus-within:ring-2 focus-within:ring-focus-ring rounded px-1 py-0.5 transition-colors',
    flashError && 'ring-2 ring-destructive bg-destructive/10'
  )}>
```

to:
```
<div className="flex items-center gap-1 flex-1 min-w-0">
  <div className={cn(
    'flex-1 min-w-0 text-sm cursor-text hover:bg-muted/50 focus-within:bg-focus-bg focus-within:ring-2 focus-within:ring-focus-ring rounded px-1 py-0.5 transition-colors',
    flashError && 'ring-2 ring-destructive bg-destructive/10'
  )}>
```

The key change: replace `truncate` with `flex-1 min-w-0`. This makes the edit box fill the available width (matching food/exercise pages) while `min-w-0` still allows text to be clipped properly within flex layout.

The DescriptionCell span already has `truncate`-like behavior via its own class, so long names will still display correctly when not focused.

