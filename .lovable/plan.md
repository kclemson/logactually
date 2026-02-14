

## Tweak Strings in Custom Log Type Dialog

Three small text changes in `src/components/CreateLogTypeDialog.tsx`:

1. **Dual Numeric description** (line 19): Change from `"Two numbers with / (e.g. blood pressure)"` to `"Two numbers with / between them (e.g. for blood pressure)"`

2. **Dual Numeric unit placeholder** (line 72): Change from `"optional (e.g. lbs, in)"` to `"e.g. mmHg"` -- since blood pressure is the primary use case for dual numeric

3. **All other unit placeholders** (lines for numeric and text_numeric, around line 72): Change from `"optional (e.g. lbs, in)"` to `"e.g. lbs, inches, etc"`

### Technical Details

**File: `src/components/CreateLogTypeDialog.tsx`**

- Line 19: Update the `description` for `dual_numeric` in `VALUE_TYPE_OPTIONS`
- Lines ~68-74: The unit input is rendered inline for whichever numeric type is selected. We need to vary the placeholder based on `valueType`:
  - If `dual_numeric` is selected: placeholder = `"e.g. mmHg"`
  - Otherwise (numeric or text_numeric): placeholder = `"e.g. lbs, inches, etc"`

Single file, three string edits.

