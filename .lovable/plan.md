
## Fix: Save Meal Dialog Too Wide on Mobile

### The Problem
The "Save as Meal" dialog extends to the full screen width on mobile, causing content to appear cut off at the edges (as seen in the screenshot).

### Root Cause
The `DialogContent` base component uses `w-full max-w-lg` with centered positioning, but doesn't have mobile inset constraints. The `SaveMealDialog` passes `sm:max-w-md` which only applies at 640px+, leaving mobile with no width constraint.

### The Solution
Apply the same responsive inset-based positioning pattern already used by `BarcodeScanner`:

- On mobile: Use `left-4 right-4` insets with `translate-x-0 w-auto` and `max-w-[calc(100vw-32px)]`
- On desktop: Keep the existing centered `sm:left-[50%] sm:translate-x-[-50%]` behavior

### Code Changes

**File: `src/components/SaveMealDialog.tsx`**

Update the `DialogContent` className (line 94):

```tsx
// FROM:
<DialogContent className="sm:max-w-md">

// TO:
<DialogContent className="left-4 right-4 translate-x-0 w-auto max-w-[calc(100vw-32px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md">
```

This pattern:
- **Mobile** (default): `left-4 right-4` creates 16px margins on both sides, `translate-x-0` removes centering transform, `w-auto` lets it size naturally, `max-w-[calc(100vw-32px)]` ensures it fits
- **Desktop** (sm:): Restores centered positioning with `left-[50%] translate-x-[-50%]` and standard `max-w-md` constraint

### Files to Change

| File | Change |
|------|--------|
| `src/components/SaveMealDialog.tsx` | Add responsive mobile inset styling to DialogContent |

### Result
The dialog will have proper 16px margins on mobile devices, matching the BarcodeScanner behavior and preventing content overflow.
