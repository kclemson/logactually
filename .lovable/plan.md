
## Reduce Expanded Section Font Size in FoodItemsTable

Same change as WeightItemsTable: switch `text-sm` to `text-xs` in the expanded detail section so it matches the secondary-detail styling.

### Technical Details

**`src/components/FoodItemsTable.tsx`** -- 3 class changes:

1. **"Logged as" raw input** (line 674): `text-sm` to `text-xs`
2. **"From saved meal" text** (line 680): `text-sm` to `text-xs`
3. **"Save as meal" button** (line 699): `text-sm` to `text-xs`

### Files Changed
- `src/components/FoodItemsTable.tsx` -- change 3 instances of `text-sm` to `text-xs` in the expanded content section
