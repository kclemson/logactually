

# Fix DetailDialog right-edge clipping on mobile

## Problem

The dialog uses `mx-4` to create horizontal margins, but this doesn't work correctly with the base DialogContent's `fixed left-[50%] w-full translate-x-[-50%]` positioning. The margin shifts the left edge inward, but `w-full` (100vw) still extends to the right edge of the viewport, causing the right side to clip off-screen.

## Fix

Replace the `mx-4` approach with explicit `left` and `right` positioning on mobile, matching the pattern already used by `SaveMealDialog`. This uses `left-2 right-2 translate-x-0 translate-y-0 w-auto` on mobile, then reverts to centered positioning on desktop.

## Technical details

**File: `src/components/DetailDialog.tsx`** -- line 433, the `DialogContent` className

Change:
```
"top-[5%] translate-y-0 max-h-[90dvh] max-h-[90vh] flex flex-col p-0 gap-0 mx-4 rounded-lg sm:max-w-md [&>button:last-child]:hidden"
```
To:
```
"left-2 right-2 top-[5%] translate-x-0 translate-y-0 w-auto max-w-[calc(100vw-16px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md max-h-[90dvh] max-h-[90vh] flex flex-col p-0 gap-0 rounded-lg [&>button:last-child]:hidden"
```

This mirrors the `SaveMealDialog` pattern: on mobile, the dialog is pinned 8px from each edge with `w-auto`; on desktop (`sm:`), it reverts to the standard centered approach.

One line change in one file.
