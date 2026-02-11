

## Remove Tooltip from Expanded Detail Row

### What changes

The "Estimated calories burned: ..." line in the expanded entry detail will become plain text instead of a tooltip trigger. The tooltip will remain only on the Total row's calorie estimate.

### Technical details

**File: `src/components/WeightItemsTable.tsx`**

Replace lines 793-809 (the `<Tooltip>` wrapper around the detail paragraph) with just the plain `<p>` element:

```tsx
// Before (wrapped in Tooltip)
<Tooltip open={...} onOpenChange={...}>
  <TooltipTrigger asChild>
    <p className="text-xs text-muted-foreground italic cursor-help" onClick={...} tabIndex={0} role="button">
      Estimated calories burned: {detail}
    </p>
  </TooltipTrigger>
  <TooltipContent ...>Refine this estimate...</TooltipContent>
</Tooltip>

// After (plain text)
<p className="text-xs text-muted-foreground italic">
  Estimated calories burned: {detail}
</p>
```

This removes `cursor-help`, `onClick`, `tabIndex`, and `role="button"` since they're no longer needed. No other files change.
