

## Show Scaled Preview Next to + Button

### Change

Move the preview from right-aligned to immediately after the `+` button, in parentheses with both portion and calories. Remove the `flex-1` spacer that was pushing the preview to the right.

### What the user sees

Before: `[-] 1.25x [+] .................. 3 cal  Done`

After: `[-] 1.25x [+] (10 oz, 3 cal) ............ Done`

### Technical Details

**File: `src/components/FoodItemsTable.tsx`**

1. **Add `scalePortion` to imports** (line 4): add it alongside `stepMultiplier` and `scaleItemByMultiplier`

2. **Replace preview + spacer** (lines 722-727): Remove the `<div className="flex-1" />` spacer, and replace the preview span with a parenthesized format showing scaled portion + calories right after the `+` button:

```tsx
{portionMultiplier !== 1.0 && (
  <span className="text-xs text-muted-foreground tabular-nums">
    ({item.portion ? scalePortion(item.portion, portionMultiplier) + ', ' : ''}
    {Math.round(item.calories * portionMultiplier)} cal)
  </span>
)}
<div className="flex-1" />
```

The `flex-1` spacer moves after the preview so "Done" stays right-aligned while the preview sits next to the `+` icon.

Single file, 3 lines changed.
