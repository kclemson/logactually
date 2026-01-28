

## Adjust Macro Percentage Font Size to 9px

### Goal

Increase the percentage text size from 8px to 9px for better readability while still maintaining the subtle hierarchy.

### Change

| File | Change |
|------|--------|
| `src/components/FoodItemsTable.tsx` | Change `text-[8px]` to `text-[9px]` on the percentage div |

### Implementation

Update line 260 in TotalsRow:

```tsx
// Before
<div className="text-[8px] text-muted-foreground font-normal">
  {proteinPct}%/{carbsPct}%/{fatPct}%
</div>

// After
<div className="text-[9px] text-muted-foreground font-normal">
  {proteinPct}%/{carbsPct}%/{fatPct}%
</div>
```

### Visual Result

The percentages will be slightly more readable at 9px while still appearing smaller than the gram values above, maintaining the visual hierarchy.

