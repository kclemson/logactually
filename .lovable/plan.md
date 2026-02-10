

## Simplify Apple Health Import -- Button + Dialog Approach

### Overview

Replace the inline Apple Health import UI in Settings with a single button row. Clicking the button opens a dialog/overlay containing all the import controls (date picker, duplicate toggle, file picker, scanning progress, type selection, preview, etc.).

### Changes

**`src/pages/Settings.tsx`**

- Remove `<AppleHealthImport />` from the Import and Export section
- Replace with a simple row: left side shows "Import from Apple Health" label with a "(see how)" link, right side has a styled "Import" button
- Clicking "(see how)" shows the instructions inline (same as current behavior)
- Clicking the "Import" button opens an `AlertDialog` or `Dialog` containing the full import workflow
- The row stays gated behind `showWeights && !isReadOnly`

**`src/components/AppleHealthImport.tsx`**

Split into two pieces:

1. **Trigger row** (rendered inline in Settings): A simple row with the label, "(see how)" toggle, and an "Import" button. The instructions panel toggles below when "(see how)" is clicked.

2. **Import dialog content**: All the existing import logic (date picker, duplicate toggle, file picker, scanning, type selection, preview, importing progress, done state) moves into a `Dialog` that opens when the button is clicked. The dialog resets its state each time it opens (by conditionally rendering: `{open && <AppleHealthImportDialog ... />}`).

The file picker's "Choose File" button will be styled to look like a proper button using Tailwind classes on the `file:` pseudo-element: `file:bg-primary file:text-primary-foreground file:font-medium file:rounded-md file:border-0 file:px-3 file:py-1.5 file:cursor-pointer`.

### Layout in Settings

```
Import from Apple Health (see how)     [ Import... ]
  (collapsible instructions below)

Export food to CSV                     [Daily Totals] [Detailed Log]
Export exercise to CSV                 [Detailed Log]
```

### Dialog Content

Simple dialog with title "Import from Apple Health", containing:
- Date picker row ("Import workouts from:")
- Skip duplicates toggle
- Styled file picker (Choose File button looks like a real button)
- Scanning progress bar (when active)
- Type selection checkboxes (after scan)
- Preview summary + confirm (after selection)
- Import progress + done state

### Technical Notes

- Use the existing `Dialog` component from `@/components/ui/dialog`
- Conditionally render dialog content (`{open && <Content />}`) so all state resets on close -- no useEffect needed
- The `AppleHealthImport` component export stays the same; it just renders the row + dialog now
- File input styled with `file:` Tailwind variants to look like a proper button

