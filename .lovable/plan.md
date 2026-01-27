
Goal: Fix the “Meal saved! / Also add to today’s log?” prompt that still won’t dismiss when clicking either button.

What’s actually happening (root cause)
- In `src/components/CreateMealDialog.tsx`, the prompt `AlertDialog` is controlled by `open={state === 'prompting'}`.
- Clicking “Yes”/“No” calls `onOpenChange(false)` (parent close), but it does NOT change `state`.
- Because `CreateMealDialog` stays mounted in both `FoodLog.tsx` and `Settings.tsx` (it is always rendered, just with `open={false}`), the `state` remains `"prompting"`, so the `AlertDialog` stays open forever.
- The previous fix (adding `onOpenChange` to `AlertDialog`) closes the parent, but still doesn’t guarantee the prompt unmounts because the prompt’s own `open` condition ignores the parent `open` flag.

Implementation approach (robust, minimal, matches existing modal patterns)
We’ll fix this in two layers:
1) Ensure the prompt cannot remain open when the parent dialog is closed (tie prompt visibility to `open` too).
2) Ensure `CreateMealDialog` unmounts when closed (so internal state can’t “stick”), matching the project’s existing “conditionally render dialogs” pattern and avoiding `useEffect`-based syncing.

Changes to make

1) `src/components/CreateMealDialog.tsx`
A. Make the AlertDialog open depend on BOTH the component `open` prop and internal `state`
- Change:
  - `open={state === 'prompting'}`
- To:
  - `open={open && state === 'prompting'}`

This alone prevents the prompt from being open when the parent is closed.

B. Add a single “close everything” helper that also resets internal state
- Create a `closeAll()` function that:
  - sets `state` back to `'input'`
  - clears `createdMeal`, `rawInput`, `name`, `userHasTyped` (optional but recommended)
  - calls `onOpenChange(false)`

Then update:
- `handleLogYes` → call `closeAll()` after calling `onMealCreated(...)`
- `handleLogNo` → call `closeAll()`
- `AlertDialog`’s `onOpenChange` (when `false`) → call `closeAll()` (treat “dismiss” as “No, just save”)

This ensures *any* dismissal path closes cleanly:
- clicking either button
- clicking outside
- pressing Escape

C. Remove the `useEffect` “reset state when dialog opens”
- Since we’ll unmount `CreateMealDialog` when closed (next steps), the initial `useState(...)` values are the reset.
- This aligns with the project’s event-driven preference (avoid `useEffect` syncing) and removes one more moving part.
- Also remove now-unused imports (`useEffect` on line 1).

2) `src/pages/FoodLog.tsx`
Conditionally render `CreateMealDialog` so it unmounts when closed
- Change from always rendering:
  - `<CreateMealDialog open={createMealDialogOpen} ... />`
- To:
  - `{createMealDialogOpen && ( <CreateMealDialog open={true} onOpenChange={setCreateMealDialogOpen} ... /> )}`
  - or keep `open={createMealDialogOpen}` (either works, but the key is conditional rendering)

This is consistent with how `SaveMealDialog` is already conditionally rendered.

3) `src/pages/Settings.tsx`
Apply the same conditional rendering for `CreateMealDialog`
- Currently it is always rendered with `open={createMealDialogOpen}`.
- Change to only render it when `createMealDialogOpen` is true.

Verification checklist (what I’ll test after implementing)
1) Food Log → Saved → Add New Meal → analyze → Save Meal → prompt appears → click “No, just save”:
   - prompt closes immediately
   - CreateMealDialog closes
   - user returns to Food Log
2) Same flow but click “Yes, log it too”:
   - prompt closes immediately
   - CreateMealDialog closes
   - entry is created in today’s log
3) While prompt is open: press Escape / click outside:
   - prompt closes
   - CreateMealDialog closes (treated like “No”)
4) Settings → Add meal → save (no prompt):
   - dialog closes and reopens cleanly without stale state/items

Why this will fix the “still reproing” issue
- Right now, “close” only updates the parent `open` flag, but the prompt’s own open condition is purely `state === 'prompting'`, and `state` never changes.
- After this change, the prompt can’t stay open when `open` is false, and the component will unmount on close so the internal `state` cannot remain stuck as `"prompting"`.

Scope / files touched
- `src/components/CreateMealDialog.tsx` (fix prompt open condition, central close handler, remove effect reset)
- `src/pages/FoodLog.tsx` (conditionally render CreateMealDialog)
- `src/pages/Settings.tsx` (conditionally render CreateMealDialog)
