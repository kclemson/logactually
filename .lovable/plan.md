

## Enforce Unique Log Type Names with Friendly Error Messages

### 1. Database: unique constraint

Add a case-insensitive unique index so duplicates are blocked at the database level:

```sql
CREATE UNIQUE INDEX custom_log_types_user_name_unique
  ON custom_log_types (user_id, lower(name));
```

### 2. Template picker: gray out already-used templates

**`src/components/LogTemplatePickerDialog.tsx`**
- Add `existingNames: string[]` prop
- For each template, check if `existingNames` includes the template name (case-insensitive)
- If matched: disable button, lower opacity, show a small "Already added" label below the name

**`src/pages/OtherLog.tsx` and `src/pages/Settings.tsx`**
- Pass `existingNames={logTypes.map(t => t.name)}` to `LogTemplatePickerDialog`

### 3. Create dialog: inline duplicate error

**`src/components/CreateLogTypeDialog.tsx`**
- Add `existingNames: string[]` prop
- Compute a `isDuplicate` flag from the current name input (case-insensitive match)
- Show a small red error message below the name input: "You already have a log type with this name"
- Disable the Create button when `isDuplicate` is true

**`src/pages/OtherLog.tsx` and `src/pages/Settings.tsx`**
- Pass `existingNames={logTypes.map(t => t.name)}` to `CreateLogTypeDialog`

### 4. Rename: revert with brief visual feedback

**`src/components/CustomLogTypeRow.tsx`**
- Add `existingNames: string[]` prop
- On blur/Enter rename, if the new name matches another existing name (case-insensitive, excluding the current type's own name), revert to original and briefly flash the field red or show a temporary tooltip/message

**`src/pages/Settings.tsx`**
- Pass `existingNames={logTypes.map(t => t.name)}` to each `CustomLogTypeRow`

### Summary of error messages

| Scenario | Message |
|---|---|
| Create dialog duplicate name | "You already have a log type with this name" (inline red text, submit disabled) |
| Template already used | Button grayed out with "Already added" label |
| Rename to duplicate | Field reverts, no silent failure -- brief visual indicator |

