

## Simplify Import and Export Section

### Changes

**`src/pages/Settings.tsx`** -- Remove the "Import" and "Export" sub-headers. Update the row labels to be self-describing:

Layout becomes:

```text
Import and Export
  Import from Apple Health  (see how)       [gated: showWeights + !isReadOnly]
  Export food to CSV         [Daily Totals] [Detailed Log]
  Export exercise to CSV     [Detailed Log]  [gated: showWeights]
  (read-only message if applicable)
```

No "Import" or "Export" headings -- the row labels themselves indicate direction.

**`src/components/AppleHealthImport.tsx`** -- Restructure the component:

- Remove the block of instructions text that's always visible at the top
- The top-level row shows: left side "Import from Apple Health", right side a "(see how)" link
- Clicking "(see how)" toggles a small inline panel below the row with the export instructions text (the "To export from your iPhone..." paragraph)
- The rest of the import UI (date picker, duplicate toggle, file picker, scanning, preview, etc.) stays below, unchanged
- The instructions panel is a simple `useState<boolean>` toggle -- no separate component needed

### Technical Details

In `Settings.tsx`:
- Remove `<p className="text-xs font-medium text-muted-foreground">Import</p>` and the Export equivalent
- Change "Food" label to "Export food to CSV"
- Change "Exercise" label to "Export exercise to CSV"

In `AppleHealthImport.tsx`:
- Add a `showInstructions` state (default false)
- Replace the always-visible instructions paragraph with a row: label on left, "(see how)" clickable text on right
- Below that row, conditionally render the instructions paragraph when `showInstructions` is true

