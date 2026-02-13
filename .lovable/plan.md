

## Don't auto-show input after creating a new log type

### Problem
After creating a new custom log type, the input fields immediately appear. The user wants the input to only show when they explicitly select a type from the dropdown.

### Fix

**File: `src/pages/OtherLog.tsx`**

Remove `setShowInput(true)` from the `handleCreateType` `onSuccess` callback (around line 96). The callback should only close the dialog and set the selected type ID (so the dropdown label updates), but not reveal the input form.

