

## Plan: Fix Mobile Dialog Positioning for Save Meal/Routine Dialogs

### Problem
On mobile (especially when self-hosting on a phone), the Save Meal/Routine dialogs appear halfway off the top of the screen. This is because:

1. The base Dialog styles use `top-[50%] translate-y-[-50%]` for vertical centering
2. The mobile overrides only change horizontal positioning (`left-2 right-2 translate-x-0`)
3. The vertical positioning remains unchanged, which can push tall dialogs above the viewport

### Solution
Add explicit mobile vertical positioning to keep the dialog in view. Two options:

**Option A (recommended):** Pin to top with padding on mobile
```tsx
// Add to mobile classes:
top-4 translate-y-0 sm:top-[50%] sm:translate-y-[-50%]
```
This positions the dialog 16px from the top on mobile, then reverts to centered on desktop.

**Option B:** Use a smaller top percentage
```tsx
top-[10%] translate-y-0 sm:top-[50%] sm:translate-y-[-50%]
```

### Files to Modify

| File | Change |
|------|--------|
| `src/components/SaveMealDialog.tsx` | Add mobile vertical positioning classes to DialogContent |
| `src/components/SaveRoutineDialog.tsx` | Add mobile vertical positioning classes to DialogContent |
| `src/components/CreateSavedDialog.tsx` | Add mobile vertical positioning classes to DialogContent |

### Implementation Detail

**Before (SaveMealDialog line 135):**
```tsx
<DialogContent className="left-2 right-2 translate-x-0 w-auto max-w-[calc(100vw-16px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-3 sm:p-6">
```

**After:**
```tsx
<DialogContent className="left-2 right-2 top-4 translate-x-0 translate-y-0 w-auto max-w-[calc(100vw-16px)] sm:left-[50%] sm:right-auto sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-3 sm:p-6">
```

Same pattern for SaveRoutineDialog and CreateSavedDialog.

### Why This Works
- `top-4` (16px from top) + `translate-y-0` on mobile → dialog is pinned near top
- `sm:top-[50%] sm:translate-y-[-50%]` on desktop → reverts to centered
- Combined with `max-h-[90vh] overflow-y-auto`, ensures scrollable content stays in view

