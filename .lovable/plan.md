
# Fix tooltip width to fit content

## Problem

Chart tooltips (e.g., Protein, Carbs, Estimated Exercise Calorie Burn) are too narrow on mobile, causing text like "protein: 80g (320 cal)" to wrap mid-line. The tooltip container has no intrinsic sizing instruction, so Recharts constrains it to whatever width it calculates.

## Fix

Add `w-max` to the tooltip's root `<div>` in `CompactChartTooltip.tsx`. This is a single CSS class that tells the container to size itself to fit its content, preventing unwanted line wraps across all charts that use this tooltip.

## Technical details

**`src/components/trends/CompactChartTooltip.tsx`** (line 33)

Change:
```tsx
<div className="rounded-md border border-border bg-popover text-popover-foreground px-2 py-1 shadow-md">
```
To:
```tsx
<div className="rounded-md border border-border bg-popover text-popover-foreground px-2 py-1 shadow-md w-max">
```

One class addition, one file, fixes all tooltips at once since every chart uses this shared component.
