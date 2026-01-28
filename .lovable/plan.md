

## Add Macro Calorie Percentage Breakdown to Totals Row

### Goal

Display the percentage of total calories that come from protein, carbs, and fat directly below the P/C/F gram values in the totals row. This provides useful nutritional insight without cluttering the UI.

### Calculation

Standard calorie conversions:
- Protein: 4 cal/g
- Carbs: 4 cal/g
- Fat: 9 cal/g

Formula for each percentage:
```
proteinPct = (protein * 4 / totalMacroCals) * 100
carbsPct = (carbs * 4 / totalMacroCals) * 100
fatPct = (fat * 9 / totalMacroCals) * 100
```

Where `totalMacroCals = (protein * 4) + (carbs * 4) + (fat * 9)`

### Visual Result

```text
P/C/F column in totals row:
  50/187/36      ← existing (grams, bold)
  8%/30%/62%     ← new (percentages, smaller gray text)
```

### Changes

| File | Change |
|------|--------|
| `src/components/FoodItemsTable.tsx` | Add percentage calculation and display below P/C/F in TotalsRow |

### Implementation

Update the TotalsRow component to:

1. Calculate macro calories and percentages
2. Add a second line below the existing P/C/F display with smaller, gray text

```tsx
const TotalsRow = () => {
  // Calculate calorie contribution from each macro
  const proteinCals = totals.protein * 4;
  const carbsCals = totals.carbs * 4;
  const fatCals = totals.fat * 9;
  const totalMacroCals = proteinCals + carbsCals + fatCals;
  
  // Calculate percentages (handle zero case)
  const proteinPct = totalMacroCals > 0 ? Math.round((proteinCals / totalMacroCals) * 100) : 0;
  const carbsPct = totalMacroCals > 0 ? Math.round((carbsCals / totalMacroCals) * 100) : 0;
  const fatPct = totalMacroCals > 0 ? Math.round((fatCals / totalMacroCals) * 100) : 0;

  return (
    <div className={cn(...)}>
      <span>Total</span>
      <span>{Math.round(totals.calories)}</span>
      <span className="px-1 text-heading text-center">
        <div>{Math.round(totals.protein)}/{Math.round(totals.carbs)}/{Math.round(totals.fat)}</div>
        <div className="text-xs text-muted-foreground">
          {proteinPct}%/{carbsPct}%/{fatPct}%
        </div>
      </span>
      {/* delete button... */}
    </div>
  );
};
```

### Edge Cases

- **Zero totals**: If no food is logged, all percentages show as 0%
- **Rounding**: Percentages are rounded to whole numbers for cleaner display (may not sum exactly to 100%)

