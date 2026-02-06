

## Plan: Fix Cardio Label Display in Save Routine Dialog

### Problem
In the "Save as Routine" dialog, cardio exercises like "Treadmill" display incorrectly:
- **Sets column**: "—"
- **Reps column**: "—"  
- **Weight column**: "11.1 min" (the duration is jammed into the wrong column)

This happens because `WeightItemsTable` has logic to show a single "cardio" label spanning all 3 columns, but this only activates when `editable={true}` OR `showCardioLabel={true}`. The dialog passes `editable={false}` and doesn't set `showCardioLabel`.

### Solution
Add `showCardioLabel={true}` to the `WeightItemsTable` in `SaveRoutineDialog`. This makes cardio items display correctly with a single centered "cardio" label spanning all three data columns.

### Technical Details

**File**: `src/components/SaveRoutineDialog.tsx`

**Line 186-197 (current)**:
```tsx
<WeightItemsTable
  items={visibleItems}
  editable={false}
  selectable={hasMultipleItems}
  selectedIndices={visibleSelectedIndices}
  onSelectionChange={handleSelectionChange}
  showHeader={true}
  showTotals={false}
  compact={true}
  showInlineLabels={true}
  weightUnit={weightUnit}
/>
```

**After fix**:
```tsx
<WeightItemsTable
  items={visibleItems}
  editable={false}
  selectable={hasMultipleItems}
  selectedIndices={visibleSelectedIndices}
  onSelectionChange={handleSelectionChange}
  showHeader={true}
  showTotals={false}
  compact={true}
  showInlineLabels={true}
  weightUnit={weightUnit}
  showCardioLabel={true}
/>
```

### Result
Cardio exercises in the Save Routine dialog will display with a centered italic "cardio" label spanning the Sets, Reps, and Weight columns instead of the incorrect "— / — / 11.1 min" mapping.

