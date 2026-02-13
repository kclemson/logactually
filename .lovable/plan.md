

## Two Small Refinements

### 1. Remove "Name" and "Type" labels from Create dialog

**File: `src/components/CreateLogTypeDialog.tsx`**

- Remove the `<Label>` for "Name" (line 49) and change the layout from `flex items-center gap-3` to just the Input on its own with placeholder text "e.g. Body Weight" (already there) serving as the label
- Remove the `<Label>` for "Type" (line 59)
- Remove the wrapping `div` with `space-y-2` around the Type section so the radio buttons sit directly below the name input, left-aligned with it

### 2. Top-align multiline text entry input

**File: `src/components/LogEntryInput.tsx`**

- Change the form's `items-center` to `items-start` when `valueType === 'text_multiline'` so the label ("Journal"), Save button, and X button align to the top of the textarea rather than being vertically centered against it

### Technical details

**CreateLogTypeDialog.tsx** -- the name row becomes:
```tsx
<Input
  id="log-type-name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  placeholder="e.g. Body Weight"
  autoFocus
/>
```

The type section loses its Label and wrapping div, leaving just the radio button list directly in the form's `space-y-4` flow.

**LogEntryInput.tsx** -- the form tag changes to:
```tsx
<form onSubmit={handleSubmit} className={cn("flex gap-2", valueType === 'text_multiline' ? "items-start" : "items-center")}>
```

This requires importing `cn` from `@/lib/utils`.
