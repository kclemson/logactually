
## Custom Log Type Dialog and Multi-line Text Support

### 1. Rename "Add Tracking Type" to "Add Custom Log Type" in Settings

**File: `src/pages/Settings.tsx`** (line ~308)
- Change the button text from "Add Tracking Type" to "Add Custom Log Type"

### 2. Add multi-line text support via new `text_multiline` value type

**No database migration needed** -- the `value_type` column is a plain `string` with no check constraint, so storing `'text_multiline'` works immediately.

**File: `src/hooks/useCustomLogTypes.ts`**
- Add `'text_multiline'` to the `ValueType` union type

**File: `src/components/CreateLogTypeDialog.tsx`**
- Add a new state `textMultiline` (boolean, defaults to false)
- Remove the standalone "Unit" row at the bottom
- Restructure the radio button layout:
  - Vertically center radio buttons with their label+description using `items-center` instead of `items-start`
  - Under "Numeric" and "Text + Numeric" radio options (when selected): show an indented "Unit" input inline, left-aligned with the label text
  - Under "Text only" radio option (when selected): show a secondary radio group for "Single line (e.g. mood)" vs "Multi line (e.g. journal notes)", also indented and left-aligned
  - Default to single line when "Text only" is selected
- On submit: if text type and multiline is true, pass `'text_multiline'` as the value type; otherwise pass `'text'`

**File: `src/components/LogEntryInput.tsx`**
- Treat `text_multiline` like `text` but render a `<textarea>` instead of `<Input>` for the text field

**File: `src/components/CustomLogEntryRow.tsx`**
- `hasText` check: add `|| valueType === 'text_multiline'`
- For `text_multiline`, the contentEditable span should allow Enter to create newlines (not save). Use Shift+Enter or blur to save. Or simpler: use a `<textarea>` element instead of contentEditable for multiline entries.

**File: `src/hooks/useCustomLogTrends.ts`**
- Add `text_multiline` to the "skip for charts" check alongside `text`

### 3. Radio button vertical alignment fix

**File: `src/components/CreateLogTypeDialog.tsx`**
- Change radio label container from `items-start` to `items-center`
- Remove `mt-0.5` from the radio input element
- This vertically centers the radio button between the label and description text

### 4. Inline unit input under type options

**File: `src/components/CreateLogTypeDialog.tsx`**
- Remove the separate "Unit" section that appears below the type radio buttons
- Instead, when "Numeric" is selected, show the unit input indented below the "A single number" description, left-aligned with the text
- Same for "Text + Numeric" -- show unit input indented below when selected
- Use the same left-margin as the label text (offset by the radio button gap)

### Visual layout of the dialog after changes

```text
Name  [_______________]

Type
 (o) Numeric
     A single number (e.g. body weight)
     Unit: [_______________]

 ( ) Text + Numeric
     A label and number (e.g. measurements)

 ( ) Text only
     Free-form text
     ( ) Single line (e.g. mood)
     ( ) Multi line (e.g. journal notes)

[          Create          ]
```

When "Text + Numeric" is selected, the unit input moves under that option instead. When "Numeric" is selected (default), the unit input appears under Numeric.
