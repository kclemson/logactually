
# Refactor CustomLogEntryRow to use shared useInlineEdit hook

## What changes
Replace the hand-rolled numeric editing state in `CustomLogEntryRow` (~90 lines of useState/useRef/handlers for both `numeric` and `numeric_2` fields) with the shared `useInlineEdit` hook already used by `FoodItemsTable` and `WeightItemsTable`.

## Why
- Eliminates ~60 lines of duplicated focus/blur/keydown/save logic
- Gains `triggerOverlay` support for demo mode (currently missing -- in read-only mode the numeric fields silently block edits with no feedback overlay)
- Ensures consistent editing behavior (Enter saves, Escape reverts, blur saves) across all three log pages

## Approach

Since `CustomLogEntryRow` is a per-row component (unlike the table-level usage in Food/Weight), `useInlineEdit` will be called inside each row with `index=0` always, and field type `'numeric' | 'numeric_2'` to distinguish the two possible numeric cells.

For dual_numeric entries (e.g., blood pressure with two values), the hook's single-editingCell model still works because you can only focus one input at a time.

## Technical Details

### File: `src/components/CustomLogEntryRow.tsx`

**1. Add `triggerOverlay` prop and import `useInlineEdit`:**
- Import `useInlineEdit` from `@/hooks/useInlineEdit`
- Import `useReadOnlyContext` from `@/contexts/ReadOnlyContext`
- Remove `useState`, `useRef` from the import (keep them only for `MultilineTextArea` which is unchanged)

**2. Replace local numeric state with `useInlineEdit`:**

Remove these ~60 lines of hand-rolled state:
- `editingNumeric`, `numericValue`, `numericOriginalRef` (lines 56-58)
- `editingNumeric2`, `numericValue2`, `numericOriginal2Ref` (lines 67-69)
- `handleNumericFocus`, `saveNumeric`, `handleNumericKeyDown` (lines 94-127)
- `handleNumeric2Focus`, `saveNumeric2`, `handleNumeric2KeyDown` (lines 71-91)

Replace with a single `useInlineEdit` call:
```typescript
type NumericField = 'numeric' | 'numeric_2';

const { triggerOverlay } = useReadOnlyContext();

const inlineEdit = useInlineEdit<NumericField>({
  onSaveNumeric: (_index, field, value) => {
    if (field === 'numeric') {
      onUpdate({ id: entry.id, numeric_value: value });
    } else {
      onUpdate({ id: entry.id, numeric_value_2: value });
    }
  },
  isReadOnly: !!isReadOnly,
  triggerOverlay,
});
```

**3. Update Input elements to use the hook:**

Each numeric `<Input>` changes from the hand-rolled pattern to:
```tsx
// For numeric_value:
<Input
  value={
    inlineEdit.editingCell?.field === 'numeric'
      ? inlineEdit.editingCell.value
      : (entry.numeric_value ?? '')
  }
  onFocus={() => inlineEdit.startEditing(0, 'numeric', entry.numeric_value ?? 0)}
  onChange={(e) => inlineEdit.updateEditingValue(e.target.value, parseFloat)}
  onBlur={inlineEdit.handleNumericBlur}
  onKeyDown={inlineEdit.handleNumericKeyDown}
  ...
/>

// For numeric_value_2 (dual_numeric):
<Input
  value={
    inlineEdit.editingCell?.field === 'numeric_2'
      ? inlineEdit.editingCell.value
      : (entry.numeric_value_2 ?? '')
  }
  onFocus={() => inlineEdit.startEditing(0, 'numeric_2', entry.numeric_value_2 ?? 0)}
  onChange={(e) => inlineEdit.updateEditingValue(e.target.value, parseFloat)}
  onBlur={inlineEdit.handleNumericBlur}
  onKeyDown={inlineEdit.handleNumericKeyDown}
  ...
/>
```

**4. No changes needed to:**
- `MultilineTextArea` (stays as-is, it handles text not numeric)
- `DescriptionCell` usage (already shared)
- Grid layouts and CSS classes
- Delete button logic

### Net effect
- ~60 lines of local state and handlers removed
- ~10 lines added (hook call + field check in onSaveNumeric)
- Demo mode overlay now triggers when editing numeric fields in read-only mode
- Consistent Enter/Escape/blur behavior guaranteed by shared hook
