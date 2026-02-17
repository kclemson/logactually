

# Remove question-mark cursor from Food Log calorie total tooltip

## Problem

The `cursor-help` class on the calorie total in the Food Log's Total row shows a question-mark cursor on hover, which feels inconsistent with other tooltips in the app (e.g., the Calendar page tooltips use default/pointer cursors).

## Change

**File: `src/components/FoodItemsTable.tsx` (line ~199)**

Remove `cursor-help` from the calorie content span. The tooltip will still appear on hover -- only the cursor style changes back to the default.

Before:
```tsx
<span className={cn("px-1 text-center inline-flex items-center justify-center", showDot && "cursor-help", ...)}>
```

After:
```tsx
<span className={cn("px-1 text-center inline-flex items-center justify-center", compact ? "text-xs" : "text-heading")}>
```

No other files affected. The `cursor-help` in `WeightItemsTable.tsx` is on a different element (a small italic helper label) and is unrelated.

