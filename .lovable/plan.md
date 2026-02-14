

## Show Template Picker from Settings "Add Custom Log Type"

**Problem**: The Settings page's "Add Custom Log Type" button opens the advanced `CreateLogTypeDialog` directly, bypassing the new template picker.

**Fix**: Replace the direct `CreateLogTypeDialog` open with `LogTemplatePickerDialog`, and chain to `CreateLogTypeDialog` only when the user clicks "Create your own".

### Technical Details

**File: `src/pages/Settings.tsx`**

1. Add a new state `templatePickerOpen` and import `LogTemplatePickerDialog`
2. Change the "Add Custom Log Type" button (line 304) to open `templatePickerOpen` instead of `createLogTypeDialogOpen`
3. Add the `LogTemplatePickerDialog` component at the bottom with:
   - `onSelectTemplate` calls `createType.mutate(...)` then closes
   - `onCreateCustom` closes the picker and opens `createLogTypeDialogOpen`
4. Keep the existing `CreateLogTypeDialog` as-is for the "Create your own" path
