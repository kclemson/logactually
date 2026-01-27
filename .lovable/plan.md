

## Fix AlertDialog Not Closing on Button Click

### Problem

The "Meal saved!" AlertDialog doesn't close when clicking either button. The issue is a missing `onOpenChange` handler on the `AlertDialog` root component.

### Root Cause

The Radix UI `AlertDialogCancel` and `AlertDialogAction` components automatically try to close the dialog by calling `onOpenChange(false)` on the parent `AlertDialog`. However, the current implementation only has:

```tsx
<AlertDialog open={state === 'prompting'}>
```

Without an `onOpenChange` handler, the component doesn't know how to respond when the buttons try to close it. The `onClick` handlers do run, but Radix's internal close mechanism fails silently.

### Solution

Add an `onOpenChange` handler to the `AlertDialog` that transitions state away from `'prompting'` when the dialog wants to close:

```tsx
<AlertDialog 
  open={state === 'prompting'} 
  onOpenChange={(open) => {
    if (!open) {
      // Dialog wants to close - treat as "No, just save"
      onOpenChange(false);
    }
  }}
>
```

This ensures that:
1. When user clicks "No, just save" → Radix calls `onOpenChange(false)` → we call `onOpenChange(false)` to close everything
2. When user clicks "Yes, log it too" → The `onClick` runs first (calling `onMealCreated`), then Radix closes → we call `onOpenChange(false)`

### File to Modify

| File | Change |
|------|--------|
| `src/components/CreateMealDialog.tsx` | Add `onOpenChange` handler to AlertDialog (line 290) |

### Implementation

Update line 290 from:
```tsx
<AlertDialog open={state === 'prompting'}>
```

To:
```tsx
<AlertDialog 
  open={state === 'prompting'} 
  onOpenChange={(isOpen) => {
    if (!isOpen) {
      onOpenChange(false);
    }
  }}
>
```

This is a one-line fix that properly wires up the AlertDialog's close mechanism.

