

## Height Input: Support `5'1"` Format

### What changes

Replace the numeric height input with a text input that accepts the common `5'1"` format when the unit is set to **ft/in** (renamed from "in"). When the unit is **cm**, it stays as a plain number input.

The user types naturally -- `5'1`, `5'1"`, `5 1`, or even just `61` (total inches) -- and the system parses it into total inches for storage.

### How it works

**Parsing logic** (new helper, e.g. `parseFeetInchesInput`):
- `5'1` or `5'1"` or `5' 1"` -- 5 feet 1 inch = 61 inches
- `5'` or `5'0` -- 5 feet 0 inches = 60 inches
- `5'11` -- 5 feet 11 inches = 71 inches
- Plain number like `61` -- treated as total inches (for users who prefer that)
- Returns `null` if unparseable

**Display logic** (new helper, e.g. `formatInchesAsFeetInches`):
- Converts stored `heightInches` (e.g. 61) back to `5'1"` for display
- `Math.floor(inches / 12)` for feet, `inches % 12` for remaining inches

**Unit toggle behavior:**
- Rename the unit labels from `in` / `cm` to `ft` / `cm` to make the feet+inches format clear
- When switching ft to cm: parse current display, convert total inches to cm
- When switching cm to ft: parse cm value, convert to inches, format as `5'1"`

### Technical Details

**`src/components/CalorieBurnDialog.tsx`**:

1. Change the height input from `type="number"` to `type="text"` when unit is ft (keep number for cm)
2. Update placeholder from `"—"` to `5'7"` when in ft mode, `170` when in cm mode
3. Update `handleHeightChange` to use the parser when unit is ft
4. Update `handleHeightUnitChange` to convert between ft display and cm display
5. Update initial `heightDisplay` state to format as `5'1"` when unit is ft
6. Rename unit button labels from `in`/`cm` to `ft`/`cm`

**`src/hooks/useUserSettings.ts`**:

- Update the `heightUnit` type from `'in' | 'cm'` to `'ft' | 'cm'` (the stored value in inches remains unchanged -- only the display unit label changes)
- Update default from `'in'` to `'ft'`

**`src/lib/calorie-burn.ts`** (if `heightUnit` is referenced there):

- Update any references to `'in'` to `'ft'` for consistency

**Migration for existing users**: If a user already has `heightUnit: 'in'` stored, treat `'in'` as equivalent to `'ft'` in the display logic (backwards compatible).

### Files Changed
- `src/components/CalorieBurnDialog.tsx` -- new parse/format helpers, text input for ft mode, updated unit labels
- `src/hooks/useUserSettings.ts` -- update heightUnit type to `'ft' | 'cm'`
- `src/lib/calorie-burn.ts` -- update heightUnit references if any
