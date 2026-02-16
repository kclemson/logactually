

# Extract `useInlineEdit` Hook — Step 1 of LogDataTable Refactor

## Goal

Extract the duplicated inline editing state machine from `FoodItemsTable.tsx` (~130 lines) and `WeightItemsTable.tsx` (~83 lines) into a single shared hook, reducing ~210 lines to ~80 (one hook + two thin call sites). This is the highest-leverage first step toward the eventual `LogDataTable` component.

## What the hook owns vs. what it does NOT own

**Hook owns (the "state machine"):**
- `editingCell` state: `{ index, field, value, originalValue }`
- `descriptionOriginalRef` for contentEditable revert
- `startEditing(index, field, displayValue)` — called from onFocus
- `updateEditingValue(rawString)` — called from onChange
- `handleNumericKeyDown` — Enter saves via callback, Escape reverts
- `handleNumericBlur` — saves via callback if changed, then clears state
- `getDescriptionEditProps(index, item)` — returns `{ onFocus, onBlur, onKeyDown }` for contentEditable spans
- Read-only guard: if `isReadOnly`, blocks saves and calls `triggerOverlay()`

**Hook does NOT own (stays in each table):**
- Calorie-to-macro scaling (Food only) — handled in `onSaveNumeric` callback
- Portion clearing on description edit (Food only) — handled in `onSaveDescription` callback
- Unit conversion kg-to-lbs (Weight only) — handled in `onSaveNumeric` callback
- Validation logic (0 is valid for Food calories, invalid for Weight sets/reps/weight) — handled in callbacks
- Portion scaling stepper UI (Food only) — completely independent, stays as-is
- `getPreviewMacros` (Food only) — reads `editingCell` from the hook's return value, no change needed
- All JSX rendering — unchanged
- `weight_lbs` special `onFocus` that converts lbs to display units — caller passes the converted `displayValue` to `startEditing`
- `weight_lbs` custom `onChange` using `parseFloat` vs `parseInt` — caller provides a `parseValue` option or the hook accepts a parser parameter per field

## Hook interface

```typescript
// src/hooks/useInlineEdit.ts

interface EditingCell<TField extends string> {
  index: number;
  field: TField;
  value: string | number;
  originalValue: string | number;
}

interface UseInlineEditOptions<TField extends string> {
  /** Called when a numeric field is committed (Enter or blur). Caller handles validation and domain logic. */
  onSaveNumeric?: (index: number, field: TField, value: number) => void;
  /** Called when description is committed (Enter or blur). Caller handles side effects like clearing portion. */
  onSaveDescription?: (index: number, newDescription: string) => void;
  /** Blocks all saves and shows overlay */
  isReadOnly: boolean;
  triggerOverlay: () => void;
}

interface UseInlineEditReturn<TField extends string> {
  editingCell: EditingCell<TField> | null;
  startEditing: (index: number, field: TField, displayValue: number) => void;
  updateEditingValue: (rawString: string, parser?: (s: string) => number) => void;
  handleNumericKeyDown: (e: React.KeyboardEvent) => void;
  handleNumericBlur: () => void;
  getDescriptionEditProps: (index: number, description: string) => {
    onFocus: (e: React.FocusEvent<HTMLSpanElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLSpanElement>) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLSpanElement>) => void;
  };
}
```

## How each table uses it

### FoodItemsTable

```typescript
const inlineEdit = useInlineEdit<'calories'>({
  onSaveNumeric: (index, field, value) => {
    // Domain logic: scale P/C/F proportionally
    const item = items[index];
    const scaled = scaleMacrosByCalories(
      item.calories, item.protein, item.carbs, item.fat, value
    );
    onUpdateItemBatch?.(index, scaled);
  },
  onSaveDescription: (index, newDescription) => {
    onUpdateItem?.(index, 'description', newDescription);
    // Domain logic: clear stale portion
    if (items[index].portion) {
      onUpdateItem?.(index, 'portion', '');
    }
  },
  isReadOnly,
  triggerOverlay,
});

// getPreviewMacros reads inlineEdit.editingCell — works exactly as before
const getPreviewMacros = (item: FoodItem, index: number): ScaledMacros | null => {
  if (inlineEdit.editingCell?.index === index && inlineEdit.editingCell?.field === 'calories') {
    return scaleMacrosByCalories(item.calories, item.protein, item.carbs, item.fat, Number(inlineEdit.editingCell.value));
  }
  return null;
};
```

**Portion scaling stepper**: Completely untouched. It uses its own `portionScalingIndex` / `portionMultiplier` state and calls `onUpdateItemBatch` directly. The hook has no interaction with it.

### WeightItemsTable

```typescript
const inlineEdit = useInlineEdit<'sets' | 'reps' | 'weight_lbs'>({
  onSaveNumeric: (index, field, value) => {
    if (field === 'weight_lbs') {
      // Domain logic: convert display units back to lbs for storage
      const lbsValue = parseWeightToLbs(value, weightUnit);
      onUpdateItem?.(index, field, lbsValue);
    } else {
      onUpdateItem?.(index, field, value);
    }
  },
  onSaveDescription: (index, newDescription) => {
    onUpdateItem?.(index, 'description', newDescription);
    // No side effects for weight descriptions
  },
  isReadOnly,
  triggerOverlay,
});
```

The `weight_lbs` field's special `onFocus` behavior (converting lbs to kg for display) is handled by the caller passing the pre-converted value:

```typescript
onFocus={() => {
  const displayValue = weightUnit === 'kg'
    ? parseFloat(formatWeight(item.weight_lbs, 'kg', 1))
    : item.weight_lbs;
  inlineEdit.startEditing(index, 'weight_lbs', displayValue);
}}
```

And `onChange` uses `parseFloat` instead of `parseInt`:

```typescript
onChange={(e) => inlineEdit.updateEditingValue(e.target.value, parseFloat)}
```

The default parser in the hook is `parseInt` (used by calories, sets, reps). The optional second argument overrides it.

## Validation differences preserved

The hook itself does NOT validate. It calls `onSaveNumeric(index, field, numericValue)` unconditionally. Each table's callback decides what's valid:

| Field | Valid values | Where enforced |
|---|---|---|
| Food calories | 0 and positive (empty string rejected) | Food's `onSaveNumeric` callback |
| Weight sets | positive only (0 rejected) | Weight's `onSaveNumeric` callback |
| Weight reps | positive only (0 rejected) | Weight's `onSaveNumeric` callback |
| Weight weight_lbs | positive only (0 rejected) | Weight's `onSaveNumeric` callback |

Wait -- looking at the actual code more carefully: Food's `handleKeyDown` checks `editingCell.value !== ''` but does NOT check `> 0`, so `0` is valid. Weight checks `numValue > 0`. The hook will call the callback with the raw numeric value; the callback skips the save if invalid. This means the hook's `handleNumericBlur` and `handleNumericKeyDown` should call the callback for any non-empty value, and let the callback decide.

Actually, to keep this clean: the hook calls `onSaveNumeric` whenever the value changed from the original. The callback is responsible for deciding whether to actually persist. If the callback decides not to save (e.g., value is 0 for weight), nothing happens -- the editing state is cleared and the input reverts to the query-driven value on next render.

## Behavioral normalization

One minor inconsistency: Food's `onBlur` for calories has a slightly different guard (`editingCell.value !== '' && editingCell.value !== undefined`) vs Weight's `onBlur` which checks `numValue > 0`. After the refactor, the hook uses a single blur path that calls `onSaveNumeric` if `value !== originalValue`. The callbacks handle the rest. This is functionally identical -- just cleaner.

## Read-only callers (SaveMealDialog, etc.)

These components pass `editable={false}` to the table. When `editable` is false:
- The editing JSX (Input elements, contentEditable spans) is never rendered
- The hook is still instantiated inside the table component but sits completely dormant -- no focus events ever fire, so no state transitions ever occur
- No prop changes needed on any caller

Callers confirmed unchanged (11 total):
- `FoodLog.tsx` — passes `editable={true}`, no change
- `WeightLog.tsx` — passes `editable={true}`, no change
- `SaveMealDialog.tsx` — `editable={false}`, unchanged
- `SaveRoutineDialog.tsx` — `editable={false}`, unchanged
- `SavedMealRow.tsx` — uses editing via same props, unchanged
- `SavedRoutineRow.tsx` — uses editing via same props, unchanged
- `CreateMealDialog.tsx` — `editable={false}`, unchanged
- `CreateRoutineDialog.tsx` — `editable={false}`, unchanged
- `DemoPreviewDialog.tsx` — `editable={false}`, unchanged
- `SimilarEntryPrompt.tsx` — `editable={false}`, unchanged
- `FoodEntryCard.tsx` — `editable={false}`, unchanged

## Mobile vs. Desktop

No responsive differences exist in the editing state machine. Both platforms use the same:
- Enter/Escape keydown handling
- Focus/blur lifecycle
- `contentEditable` for descriptions

Input attributes like `step` (0.5 for kg, 1 for lbs) remain in the table JSX, not in the hook. Touch vs. mouse makes no difference to the state transitions.

## Files changed

| File | Action | Lines removed | Lines added |
|---|---|---|---|
| `src/hooks/useInlineEdit.ts` | **New** | 0 | ~80 |
| `src/components/FoodItemsTable.tsx` | Refactor | ~130 | ~15 |
| `src/components/WeightItemsTable.tsx` | Refactor | ~83 | ~15 |

Additionally in `FoodItemsTable.tsx`: remove the unused `DeleteGroupDialog` import (line 26).

## Files NOT changed

All 11 callers listed above. The table component interfaces (`FoodItemsTableProps`, `WeightItemsTableProps`) are completely unchanged.

## Test matrix

1. Food: edit calories via Enter -- saves, P/C/F scales proportionally
2. Food: edit calories via blur (tap elsewhere) -- saves with scaling
3. Food: edit calories, press Escape -- reverts to original
4. Food: type 0 in calories, press Enter -- saves (0 is valid for food)
5. Food: edit description via Enter -- saves, clears portion if present
6. Food: edit description via blur -- saves if non-empty, clears portion
7. Food: clear description and blur -- reverts to original (no save)
8. Food: portion scaling stepper -- still works independently (no regression)
9. Weight: edit sets via Enter -- saves if > 0
10. Weight: edit reps via blur -- saves if > 0
11. Weight: edit weight in kg mode -- displays in kg, converts to lbs for storage
12. Weight: edit weight, type 0, Enter -- does not save (0 invalid for weight)
13. Weight: edit description -- saves without side effects
14. Read-only mode: any edit attempt on Food or Weight -- triggers overlay, reverts
15. Non-editable tables (SaveMealDialog, SimilarEntryPrompt, etc.) -- render correctly, no editing UI shown

## What comes next (not in this step)

- **Step 2**: Extract `NumericCell` and `DescriptionCell` components
- **Step 3**: Column definition model and `LogDataTable` wrapper
- **Step 4**: Collapsed group rows using the table primitives

