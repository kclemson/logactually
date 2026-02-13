

## Fix: Clicking the already-selected log type doesn't show input

### Problem
Radix Select does not fire `onValueChange` when the user selects the value that is already active. Since "Log Weight" is the default (`effectiveTypeId` falls back to `sortedLogTypes[0]`), clicking it in the dropdown is a no-op and `showInput` never becomes `true`. Selecting a *different* type first works because the value actually changes.

### Fix
Add `onOpenChange` to the `Select` component. When the dropdown closes (transitions from open to closed), set `showInput = true` -- as long as the effective type is set and the user didn't click "Add Custom Log Type".

This works because:
- If the user picks a different type, `onValueChange` fires first (updating `selectedTypeId`), then `onOpenChange(false)` fires and sets `showInput = true`.
- If the user picks the same type, `onValueChange` doesn't fire, but `onOpenChange(false)` still fires and sets `showInput = true`.
- The existing `onValueChange` handler for `__create_new__` opens the dialog; we just need to avoid also setting `showInput` in that case.

We can use a ref to track whether the "create new" action was triggered, so `onOpenChange` skips showing input in that scenario.

### Technical detail

**File: `src/pages/OtherLog.tsx`**

1. Add a ref: `const createNewClickedRef = useRef(false);`
2. In `onValueChange`, when `val === '__create_new__'`, set `createNewClickedRef.current = true` before opening the dialog.
3. Add `onOpenChange` to the `Select`:
   ```tsx
   onOpenChange={(open) => {
     if (!open && effectiveTypeId && !createNewClickedRef.current) {
       setShowInput(true);
     }
     createNewClickedRef.current = false;
   }}
   ```
4. Remove `setShowInput(true)` from the `onValueChange` handler (the `else` branch) since `onOpenChange` now handles it for all cases.

This is a minimal change -- one ref, one prop added to `Select`, one line removed.
