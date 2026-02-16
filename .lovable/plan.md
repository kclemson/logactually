

# Fix Dialog Jumping: Top-Anchored Positioning

## Problem
The CalorieTargetDialog jumps vertically when switching between modes (static / body stats / exercise adjusted) because it's vertically centered. As the content height changes, the center point shifts, causing the dialog to move up and down. The current `min-h-[200px]` workaround doesn't fully solve this.

## Solution
Use the same top-anchored positioning pattern already used by SaveMealDialog, SaveRoutineDialog, and others. On mobile, the dialog is pinned near the top of the screen and grows downward. On desktop, it reverts to standard centered positioning.

## Technical details

**File: `src/components/CalorieTargetDialog.tsx`**

Update the `DialogContent` className (line ~109):

From:
```
left-2 right-2 translate-x-0 w-auto max-w-[calc(100vw-16px)] max-h-[85vh] overflow-y-auto p-4
sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md
```

To:
```
left-2 right-2 top-12 translate-x-0 translate-y-0 w-auto max-w-[calc(100vw-16px)] max-h-[85vh] overflow-y-auto p-4
sm:left-[50%] sm:right-auto sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:w-full sm:max-w-md
```

Key additions: `top-12 translate-y-0` (mobile) and `sm:top-[50%] sm:translate-y-[-50%]` (desktop).

Also remove `min-h-[200px]` from the inner content container (line ~131) since it's no longer needed -- the top-anchored positioning prevents visual jumping.

