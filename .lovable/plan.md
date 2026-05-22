## Bug
On `/custom` → Log New → + New Custom Log Type → Create your own → name it → pick **Document upload** → **Create**: the button greys out, dialog resets to defaults, and nothing is created.

## Root cause
Two compounding issues:

1. **DB rejects `panel` value_type.** The `custom_log_types.value_type` CHECK constraint (migration `20260219194516…`) is:
   ```
   CHECK (value_type IN ('numeric','text_numeric','text','text_multiline','dual_numeric','medication'))
   ```
   It does **not** include `'panel'`, so every Document-upload create fails with a constraint violation. The bloodwork rollout added the `'panel'` value_type to the client/types but never updated this constraint.

2. **`CreateLogTypeDialog` resets local state synchronously inside `handleSubmit`, before the mutation resolves.** So even before the failure surfaces, the form already looks "reset to default" (name cleared, radio back to Numeric, Create disabled because name is empty). The mutation's error then lands silently — no toast, dialog stays open in the empty state, user sees nothing happen.

## Fix

### 1. Migration — allow `panel` in the CHECK constraint
New migration that drops + re-adds the constraint to include `'panel'`:
```sql
ALTER TABLE public.custom_log_types DROP CONSTRAINT IF EXISTS custom_log_types_value_type_check;
ALTER TABLE public.custom_log_types ADD CONSTRAINT custom_log_types_value_type_check
  CHECK (value_type IN ('numeric','text_numeric','text','text_multiline','dual_numeric','medication','panel'));
```

### 2. `src/components/CreateLogTypeDialog.tsx` — don't reset on submit, surface errors
- Remove the synchronous `setName('')` / `setValueType('numeric')` / `setUnit('')` / `setTextMultiline(false)` block from `handleSubmit`. The dialog already unmounts when closed (parent toggles `createTypeOpen`), so internal state resets naturally next time it opens.
- Keep `disabled={isLoading}` on the Create button (button correctly greys while pending).
- Parent's `onSuccess` handler in `OtherLog.tsx` already calls `setCreateTypeOpen(false)` and selects the new type — that closes the dialog on success. On failure, the dialog stays open with the user's typed name + chosen type still intact so they can retry.

### 3. Surface mutation errors
Look at `createType` in `src/hooks/useCustomLogTypes.ts` and ensure errors propagate (e.g. via a `sonner` toast in `onError`, matching the pattern used elsewhere in the app). Add a minimal `toast.error(error.message)` if no error handling exists today.

## Out of scope
- Any change to the bloodwork upload UI itself (`BloodworkUploadInput`) — that path works once a panel-type log type exists.
- The cosmetic "Log New" dropdown reorder discussed in the previous turn.