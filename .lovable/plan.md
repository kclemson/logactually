

## Remove Preview Phase from Apple Health Import

The preview step is now redundant since duplicates are always silently skipped. The flow should go directly from type selection to importing.

### Changes

**File: `src/components/AppleHealthImport.tsx`**

1. **Remove the `preview` phase entirely** from the Phase type and all related state/UI:
   - Remove `"preview"` from the `Phase` type
   - Remove `previewNew` and `previewSkip` state variables
   - Remove the `handlePreview` function
   - Remove the preview UI block (`phase === "preview"`)

2. **Rename "Preview Import" button to "Import"** in the select phase, and wire it directly to `handleImport`

3. **Simplify `handleImport`**: It already does its own duplicate check before inserting -- no changes needed to the import logic itself

4. **Clean up select phase condition**: Change `(phase === "select" || phase === "preview")` to just `phase === "select"` since preview no longer exists

