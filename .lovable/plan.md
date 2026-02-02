

## Demo Preview Fixes

Three issues to address:

---

### Issue 1: Dead Code Cleanup in LogInput

**Confirmed:** Lines 14 and 146 of `LogInput.tsx` import and destructure `useReadOnlyContext`, but neither `isReadOnly` nor `triggerOverlay` are used anywhere in the component (the comment on lines 220-221 confirms the check moved to parent components).

**Note:** `FoodItemsTable` and `WeightItemsTable` do actively use both values (to block edits and trigger the overlay when read-only users try to edit cells).

**Fix:**
- Remove import of `useReadOnlyContext` from line 14
- Remove the destructuring call on line 146

---

### Issue 2: Macro Percentages Causing Misalignment

In the screenshot, the "13%/46%/40%" text beneath the P/C/F total pushes the cell content down, misaligning it with "Total" and the calorie number.

**Options:**
1. Hide percentages entirely in demo preview
2. Always hide percentages when `totalsPosition="bottom"` (they're less useful in compact contexts)

**Chosen approach:** Add a new prop `showMacroPercentages?: boolean` defaulting to `true`, so the demo preview can pass `showMacroPercentages={false}`.

**Files:**
- `src/components/FoodItemsTable.tsx` - add prop, conditionally render percentages
- `src/components/DemoPreviewDialog.tsx` - pass `showMacroPercentages={false}`

---

### Issue 3: Cardio Display in Demo Preview

**Problem:** The cardio "cardio" spanning label is only shown when `editable={true}`. Demo preview passes `editable={false}`, so cardio items show the awkward "—", "—", "30.0 min" format.

**Simplest architectural fix:** Add a prop `showCardioLabel?: boolean` that, when true, triggers the cardio display even in read-only mode.

**Logic change in WeightItemsTable:**
```tsx
// Before
if (editable && isCardioItem) { ... }

// After  
if (isCardioItem && (editable || showCardioLabel)) { ... }
```

**Files:**
- `src/components/WeightItemsTable.tsx` - add `showCardioLabel?: boolean` prop
- `src/components/DemoPreviewDialog.tsx` - pass `showCardioLabel={true}`

---

### Issue 4: ReadOnlyOverlay Exclamation Point

**File:** `src/components/ReadOnlyOverlay.tsx`

Change line 45 from:
```
Create a free account to track your own data!
```
to:
```
Create a free account to track your own data.
```

---

### Files Changed

| File | Change |
|------|--------|
| `src/components/LogInput.tsx` | Remove unused `useReadOnlyContext` import and call |
| `src/components/FoodItemsTable.tsx` | Add `showMacroPercentages` prop, conditionally render |
| `src/components/WeightItemsTable.tsx` | Add `showCardioLabel` prop, update cardio condition |
| `src/components/DemoPreviewDialog.tsx` | Pass `showMacroPercentages={false}` and `showCardioLabel={true}` |
| `src/components/ReadOnlyOverlay.tsx` | Remove exclamation point from message |

---

### Technical Details

**LogInput.tsx cleanup:**
```tsx
// Remove line 14:
// import { useReadOnlyContext } from '@/contexts/ReadOnlyContext';

// Remove line 146:
// const { isReadOnly, triggerOverlay } = useReadOnlyContext();
```

**FoodItemsTable.tsx - new prop and conditional:**
```tsx
// In props interface
showMacroPercentages?: boolean;

// In component destructuring
showMacroPercentages = true,

// In TotalsRow, wrap the percentage div:
{showMacroPercentages && (
  <div className="text-[9px] text-muted-foreground font-normal">
    {proteinPct}%/{carbsPct}%/{fatPct}%
  </div>
)}
```

**WeightItemsTable.tsx - new prop and conditional:**
```tsx
// In props interface
showCardioLabel?: boolean;

// Update condition (around line 413):
if (isCardioItem && (editable || showCardioLabel)) {
  return (
    <span className="col-span-3 text-center text-muted-foreground italic py-1">
      cardio
    </span>
  );
}
```

**DemoPreviewDialog.tsx - pass new props:**
```tsx
<FoodItemsTable
  items={foodItemsWithEntryId}
  editable={false}
  showMacroPercentages={false}
  // ... other props
/>

<WeightItemsTable
  items={weightSetsWithEntryId}
  editable={false}
  showCardioLabel={true}
  // ... other props
/>
```

