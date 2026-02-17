

# Fix clipped mode label in CalorieTargetDialog dropdown

## Problem
The Radix Select trigger renders the full SelectItem content (label + description) even when closed. The description line inflates the content width, causing the label to clip with an ellipsis even though the description itself is not visible in the collapsed state.

## Solution
Use a custom render function on `SelectValue` so the trigger only displays the short label text, not the two-line layout used inside the dropdown menu.

## Technical Detail

**File: `src/components/CalorieTargetDialog.tsx` (lines 216-218)**

Replace:
```tsx
<SelectTrigger className="w-[280px] h-auto py-1.5 text-xs">
  <SelectValue />
</SelectTrigger>
```

With:
```tsx
<SelectTrigger className="w-[280px] h-8 text-xs">
  <SelectValue>
    {TARGET_MODE_OPTIONS.find(o => o.value === settings.calorieTargetMode)?.label}
  </SelectValue>
</SelectTrigger>
```

This ensures only the short label (e.g. "Estimated burn rate - deficit") appears in the trigger, while the full two-line layout (label + description) remains inside the dropdown items. The trigger width of 280px is more than enough for any of the three labels.

Single-file, three-line change.
