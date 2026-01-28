

## Remove Bold Styling from Macro Percentages

### Issue

The macro percentages (16%/59%/25%) inherit `font-semibold` from the parent `text-heading` class, making them appear bolded when they should be regular weight gray text.

### Fix

Add `font-normal` to the percentage div to override the inherited font weight.

### Change

| File | Change |
|------|--------|
| `src/components/FoodItemsTable.tsx` | Add `font-normal` class to the percentage div |

### Implementation

Update line 262 in TotalsRow:

```tsx
// Before
<div className="text-xs text-muted-foreground">
  {proteinPct}%/{carbsPct}%/{fatPct}%
</div>

// After
<div className="text-xs text-muted-foreground font-normal">
  {proteinPct}%/{carbsPct}%/{fatPct}%
</div>
```

### Visual Result

The gram values (50/187/36) will remain bold/semibold, while the percentages below (16%/59%/25%) will display in regular weight gray text, creating clear visual hierarchy.

