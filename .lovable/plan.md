
## Column Headers for Expanded Saved Items

Since saved meal/routine items in Settings have `showHeader={false}` but are editable, there's currently no context for the numeric columns. Your new approach is better: add a small header row above the first item only.

---

### Why the Current Implementation Didn't Work

The `showInlineLabels` logic was only added to the non-editable render path:
```tsx
// Line 478-487 - non-editable branch
) : (
  <>
    <span className="...">
      {item.calories}
      {showInlineLabels && <span className="text-[10px] ml-0.5">cal</span>}
    </span>
  </>
)
```

But `SavedMealRow` passes `editable={true}`, so the editable branch (lines 443-477) is used instead, which has no inline label logic.

---

### New Approach: Mini Header Row

Instead of inline labels on every row, add a compact header row above the first item only when:
- `showHeader={false}` (main header is hidden)
- `showInlineLabels={true}` (we want context labels)

This gives context without cluttering every row, and avoids the 16px mobile font issue since headers aren't editable inputs.

---

### Design

**Food Items:**
```
                        Cal       P/C/F
French bread five...    380      14/42/18    [trash]
```

**Weight Items:**
```
                       Sets    Reps    Lbs
Seated Leg Press        3       10     160    [trash]
```

Headers will use:
- `text-[10px]` size (very small)
- `text-muted-foreground` color  
- Center-aligned to match data columns
- Same grid layout as data rows

---

### Implementation

**Step 1: FoodItemsTable.tsx**

Add a mini header that renders when `showInlineLabels && !showHeader`:

```tsx
{/* Mini header when main header is hidden but labels requested */}
{!showHeader && showInlineLabels && items.length > 0 && (
  <div className={cn('grid gap-0.5 items-center text-[10px] text-muted-foreground', gridCols)}>
    <span></span>
    <span className="px-1 text-center">Cal</span>
    <span className="px-1 text-center">P/C/F</span>
    {hasDeleteColumn && <span></span>}
  </div>
)}
```

**Step 2: WeightItemsTable.tsx**

Same pattern:

```tsx
{/* Mini header when main header is hidden but labels requested */}
{!showHeader && showInlineLabels && items.length > 0 && (
  <div className={cn('grid gap-0.5 items-center text-[10px] text-muted-foreground', gridCols)}>
    <span></span>
    <span className="px-1 text-center">Sets</span>
    <span className="px-1 text-center">Reps</span>
    <span className="px-1 text-center">Lbs</span>
    {hasDeleteColumn && <span></span>}
  </div>
)}
```

**Step 3: Remove existing inline label code**

Remove the inline label spans from:
- `FoodItemsTable.tsx` lines 481-482
- `WeightItemsTable.tsx` lines 299-301, 312-314, 325-327

And remove the column width adjustments that were added for inline labels.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/FoodItemsTable.tsx` | Add mini header row; remove inline label spans; revert grid column widths |
| `src/components/WeightItemsTable.tsx` | Add mini header row; remove inline label spans; revert grid column widths |

---

### Visual Result

```
> Red Baron french bread pizza          1 item    [trash]
                             Cal     P/C/F
  French bread five...       380    14/42/18     [trash]

v Seated Leg Press (3×10 @ 160 lbs)   1 exercise  [trash]
                            Sets    Reps     Lbs
  Seated Leg Press            3       10     160   [trash]
```

The compact header provides context without the font-size issues from editable inline labels.
