

## Add Inline Labels for Expanded Saved Items

When saved meals or routines are expanded in the Settings page, the numeric columns lack context since headers are hidden. This plan adds small inline labels to clarify each value.

---

### Design

**Food Items (FoodItemsTable):**
```
Banana Bread (no nuts raisins)     250 cal     4P/41C/9F
```
- Add "cal" suffix after calories
- P/C/F already has context from the format

**Weight Items (WeightItemsTable):**
```
Seated Leg Press     3 sets     10 reps     160 lbs
```
- Add "sets" suffix after sets value
- Add "reps" suffix after reps value  
- Add "lbs" suffix after weight value

---

### Implementation Approach

Add a new optional prop `showInlineLabels?: boolean` to both table components:
- When `true`, append small muted labels after each numeric value
- Default to `false` to preserve existing behavior on main log pages
- Pass `showInlineLabels={true}` from SavedMealRow and SavedRoutineRow

---

### Technical Details

**Files to Modify:**

| File | Change |
|------|--------|
| `src/components/FoodItemsTable.tsx` | Add `showInlineLabels` prop; when true, render "cal" after calories value |
| `src/components/WeightItemsTable.tsx` | Add `showInlineLabels` prop; when true, render "sets", "reps", "lbs" suffixes |
| `src/components/SavedMealRow.tsx` | Pass `showInlineLabels={true}` to FoodItemsTable |
| `src/components/SavedRoutineRow.tsx` | Pass `showInlineLabels={true}` to WeightItemsTable |

**Grid Column Width Adjustments:**

When `showInlineLabels` is true, columns need more space:
- FoodItemsTable: `grid-cols-[1fr_65px_90px]` (calories column 50px → 65px for "cal" suffix)
- WeightItemsTable: `grid-cols-[1fr_55px_55px_70px]` (sets 45→55, reps 45→55, weight 60→70)

**Label Styling:**
```tsx
<span className="text-[10px] text-muted-foreground ml-0.5">cal</span>
```
- 10px font size (smaller than main text)
- Muted color to de-emphasize
- Small left margin for spacing

---

### Code Snippets

**FoodItemsTable (calories column):**
```tsx
<span className="px-1 py-1 text-muted-foreground text-center">
  {item.calories}
  {showInlineLabels && <span className="text-[10px] ml-0.5">cal</span>}
</span>
```

**WeightItemsTable (sets/reps/weight columns):**
```tsx
<span className="px-1 py-1 text-center">
  {item.sets}
  {showInlineLabels && <span className="text-[10px] text-muted-foreground ml-0.5">sets</span>}
</span>
```

**SavedMealRow usage:**
```tsx
<FoodItemsTable
  items={localItems}
  editable={true}
  showHeader={false}
  showTotals={false}
  showInlineLabels={true}
  ...
/>
```

