

## Move Apple Health Import Below Exports and Update Label

Two changes in `src/pages/Settings.tsx`:

1. **Move `<AppleHealthImport />`** from above the export rows (lines 368-371) to below the exercise export row (after line 396), keeping the same `showWeights && !isReadOnly` guard.

2. **Update label text** in `src/components/AppleHealthImport.tsx` (line 491): Change `"Import from Apple Health"` to `"Import workouts from Apple Health"` -- the "(see how)" link already exists and stays as-is.

### Technical details

**`src/pages/Settings.tsx`** (Import and Export section):
- Remove lines 368-371 (the Apple Health import block above exports)
- Insert `{showWeights && !isReadOnly && <AppleHealthImport />}` after the exercise export block (after line 396, before the `isReadOnly` message)

**`src/components/AppleHealthImport.tsx`** (line 491):
- Change `Import from Apple Health` to `Import workouts from Apple Health`

