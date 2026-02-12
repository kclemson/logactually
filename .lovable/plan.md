

## Fix: Number inputs auto-filling "0" when cleared on mobile

**Problem**: When editing Sets, Reps, or Weight fields on mobile, backspacing to clear the field immediately inserts a `0`. This forces the user to type their new number (getting e.g. "08"), then delete the leading zero -- a frustrating two-step process.

**Root cause**: In `WeightItemsTable.tsx`, the `onChange` handlers use `parseInt(e.target.value, 10) || 0` (and `parseFloat(...) || 0`). When the user clears the field, `parseInt("")` returns `NaN`, and `|| 0` coerces it to `0`, which immediately appears in the input.

**Fix**: Allow empty string as a valid intermediate editing state. Only coerce to a number on blur/Enter (when the edit is committed).

### Changes

**File: `src/components/WeightItemsTable.tsx`**

1. **Sets onChange (line 569)**: Change `parseInt(e.target.value, 10) || 0` to store the raw string value when empty:
   ```ts
   value: e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0
   ```

2. **Reps onChange (line 607)**: Same fix:
   ```ts
   value: e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0
   ```

3. **Weight onChange (line 651)**: Same fix for `parseFloat`:
   ```ts
   value: e.target.value === '' ? '' : parseFloat(e.target.value) || 0
   ```

4. **Sets/Reps/Weight onBlur handlers**: Already guard with `numValue > 0` before saving, so an empty/zero value just gets discarded (field reverts to original). No change needed.

5. **Value display**: The `String(editingCell.value)` already handles empty string correctly -- it will show an empty input.

This is a 3-line change in one file. The behavior becomes: user taps field, backspaces to clear it, sees an empty field (not "0"), types new number, and it saves on blur/Enter.

