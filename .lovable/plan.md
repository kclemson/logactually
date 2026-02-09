

## Fix Vertical Alignment of Calorie Target Dot in Food Log Totals

### What Changes

The colored dot next to the calorie total in the totals row is bottom-justified instead of vertically centered -- the same issue previously fixed on the History calendar.

### Fix

In `src/components/FoodItemsTable.tsx` (line 328), add `inline-flex items-center` to the calories `<span>` so the dot aligns to the vertical center of the number.

```
// Before
<span className={cn("px-1 text-center", compact ? "text-xs" : "text-heading")}>

// After
<span className={cn("px-1 text-center inline-flex items-center justify-center", compact ? "text-xs" : "text-heading")}>
```

Single line change, no other files affected.

