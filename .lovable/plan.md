
## Add Escape Key Support to Portion Scaling

The portion scaling stepper container (line 688) handles blur to close but has no `onKeyDown` listener, so pressing Escape does nothing.

### Change

**File: `src/components/FoodItemsTable.tsx`**, line ~691 (the container div):

Add an `onKeyDown` handler that closes portion scaling on Escape, discarding any unsaved multiplier change:

```tsx
onKeyDown={(e) => {
  if (e.key === 'Escape') {
    e.stopPropagation();
    setPortionScalingIndex(null);
    setPortionMultiplier(1.0);
  }
}}
```

This goes on the same `<div>` that already has `tabIndex={-1}`, `ref` for auto-focus, and `onBlur`. The Escape behavior matches other inline edits: revert and close without applying changes.
