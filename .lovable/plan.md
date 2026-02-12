

## Fix: Enter on empty number field should revert, not save

**Problem**: The `onBlur` handlers correctly guard with `numValue > 0` before saving, but the `handleKeyDown` (Enter) handler at line 177 and the weight-specific Enter handler at line 663 do not. So pressing Enter on an empty/zero field saves the empty value instead of reverting.

**Fix**: Add the same `numValue > 0` guard to the Enter key handlers.

### Changes in `src/components/WeightItemsTable.tsx`

1. **Generic `handleKeyDown` (line 177)** -- used by Sets and Reps Enter:
   ```ts
   // Before
   if (editingCell && editingCell.value !== editingCell.originalValue) {
     onUpdateItem?.(index, field, editingCell.value);
   }

   // After
   if (editingCell && editingCell.value !== editingCell.originalValue) {
     const numValue = Number(editingCell.value);
     if (numValue > 0) {
       onUpdateItem?.(index, field, editingCell.value);
     }
   }
   ```

2. **Weight-specific Enter handler (line 663)**:
   ```ts
   // Before
   if (editingCell && editingCell.value !== editingCell.originalValue) {
     const lbsValue = parseWeightToLbs(editingCell.value as number, weightUnit);
     onUpdateItem?.(index, 'weight_lbs', lbsValue);
   }

   // After
   if (editingCell && editingCell.value !== editingCell.originalValue) {
     const numValue = Number(editingCell.value);
     if (numValue > 0) {
       const lbsValue = parseWeightToLbs(numValue, weightUnit);
       onUpdateItem?.(index, 'weight_lbs', lbsValue);
     }
   }
   ```

Two small additions in one file. Empty or zero values on Enter will now be discarded (field reverts to original), matching the existing onBlur behavior.
