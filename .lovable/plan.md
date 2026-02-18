

# Suppress browser autocomplete popups on detail dialog inputs

The "Saved info / Last used" popup is the browser's built-in autocomplete feature. It appears on text and number inputs that don't explicitly disable it.

## Change

In `src/components/DetailDialog.tsx`, add `autoComplete="off"` to the `<input>` elements rendered in `FieldEditGrid`:

1. The text input for fields like "Name" (around line 250) -- add `autoComplete="off"`
2. The number inputs for numeric fields (around line 289) -- add `autoComplete="off"`

This tells the browser not to offer autocomplete suggestions for these fields.

