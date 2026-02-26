

## Disable browser autosuggest on custom log entry inputs

The screenshot shows the browser's autofill/autosuggest interfering with the numeric input field. Per the project's form input standards, forms should use `autoComplete="off"`.

### Changes

**`src/components/LogEntryInput.tsx`**
- Add `autoComplete="off"` to all `<Input>` elements (text input, numeric inputs) and the `<textarea>` element

**`src/components/MedicationEntryInput.tsx`**
- Add `autoComplete="off"` to the dose `<Input>`, the time `<input>`, and the `<Textarea>`

Both files have 2-4 input elements each. One prop addition per element.

