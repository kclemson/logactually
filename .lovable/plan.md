

## Fix: Food calorie field -- allow 0, revert on empty, fix mobile clearing

**Current behavior** (confirmed by you):
- Typing "0" and pressing Enter saves correctly
- Backspacing to empty and pressing Enter saves an empty/invalid value (bug)
- The onChange coerces empty to 0 immediately, making it hard to clear on mobile (same bug as weight fields)

**Note**: The onBlur handler currently has `numValue > 0` which silently discards 0 on blur -- this is actually a bug since 0-calorie foods are valid. The Enter handler has no guard, which is why 0 works today (via Enter only).

### Changes in `src/components/FoodItemsTable.tsx`

**1. onChange (line 562)** -- Allow empty string while typing:
```ts
// Before
value: parseInt(e.target.value, 10) || 0

// After
value: e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0
```

**2. Enter handler (lines 145-164)** -- Skip save if empty, allow 0:
```ts
// Before
if (editingCell && editingCell.value !== editingCell.originalValue) {
  if (field === 'calories') { ... }
  else { onUpdateItem?.(index, field, editingCell.value); }
}

// After
if (editingCell && editingCell.value !== editingCell.originalValue && editingCell.value !== '') {
  if (field === 'calories') { ... }
  else { onUpdateItem?.(index, field, editingCell.value); }
}
```
Adding `&& editingCell.value !== ''` means empty reverts, but 0 passes through.

**3. onBlur (line 569)** -- Change guard from `numValue > 0` to `editingCell.value !== ''`:
```ts
// Before
if (numValue > 0) {

// After
if (editingCell.value !== '' && editingCell.value !== undefined) {
```
This fixes the inconsistency where 0 could be saved via Enter but not via blur.

### Result

| Action | Result |
|---|---|
| Clear field, press Enter | Reverts to original |
| Clear field, tap away (blur) | Reverts to original |
| Clear field, type "0", Enter/blur | Saves 0 |
| Clear field, type "150", Enter/blur | Saves 150 |
| Backspace on mobile | Field stays empty (no auto-"0") |

Three small changes in one file.
