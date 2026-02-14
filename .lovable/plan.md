

## Fix: Dismiss Portion Stepper Consistently with Other Fields

### How Other Fields Work

The existing editable fields (description, calories) use the browser's native **`onBlur`** event. When you tap outside a focused element, the browser fires `onBlur`, and the handler cleans up the editing state. No backdrop, no document listeners -- just standard focus/blur behavior.

### Apply the Same Pattern to the Portion Stepper

The stepper container (with its `-`, `+`, multiplier display, and "Done" button) will use `onBlur` on a wrapper `div` with `tabIndex={-1}` (making it focusable). The wrapper auto-focuses when the stepper opens. When focus leaves the wrapper (clicking anywhere else), `onBlur` fires and dismisses the stepper, discarding unapplied changes.

One subtlety: clicking child buttons inside the wrapper would normally trigger `onBlur` briefly. The fix is to check `relatedTarget` -- if focus is moving to another element inside the same wrapper, don't dismiss. This is done via `e.currentTarget.contains(e.relatedTarget as Node)`.

### Technical Details

**File:** `src/components/FoodItemsTable.tsx`

1. Add `tabIndex={-1}` and `ref` to the stepper wrapper div so it can receive focus
2. Auto-focus the wrapper when the stepper opens (via a callback ref or `autoFocus`)
3. Add `onBlur` handler:
   ```tsx
   onBlur={(e) => {
     // If focus moved to a child element, don't dismiss
     if (e.currentTarget.contains(e.relatedTarget as Node)) return;
     setPortionScalingIndex(null);
     setPortionMultiplier(1.0);
   }}
   ```
4. Remove the previously discussed backdrop approach -- not needed

This matches the `onBlur` pattern used by the calorie input and description fields, keeping the codebase consistent.

