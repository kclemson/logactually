

## Move Unit from Per-Entry to Per-Type

The unit field belongs on the tracking type definition, not on every individual entry. When a user creates "Body Weight", they set "lbs" once, and it applies everywhere.

### 1. Database migration

Add an optional `unit` column to `custom_log_types`:

```sql
ALTER TABLE custom_log_types ADD COLUMN unit text;
```

No changes to `custom_log_entries` -- existing `unit` column stays for backward compatibility but will no longer be written to from the UI.

### 2. CreateLogTypeDialog -- add optional Unit input

When the user selects "Numeric" or "Text + Numeric", show an optional "Unit" text input (e.g. "lbs", "in", "mmHg"). Hidden for "Text only" types.

Update the `onSubmit` callback signature to include `unit`:
`onSubmit(name, valueType, unit?)`

### 3. LogEntryInput -- remove the per-entry unit field

- Remove the `unit` state variable and the unit `<Input>` field entirely.
- Add a new `unit` prop (read-only display) so entries show the unit label next to the value input as a static suffix (e.g. the input reads `[___] lbs`).
- Stop passing `unit` in the `onSubmit` params -- the unit is now stored at the type level.

### 4. OtherLog.tsx -- pass the type's unit to LogEntryInput

When rendering `LogEntryInput`, pass `unit={selectedType.unit}` so the suffix displays.

When calling `createEntry.mutate`, pass `unit: selectedType.unit || null` so existing entries still store their unit for display.

### 5. CustomLogEntryRow -- fall back to type unit

Update `formatValue` to accept the type-level unit as a fallback: show `entry.unit` if present (backward compat), otherwise use the type's unit.

### 6. Hook + type updates

- Update `CustomLogType` interface to include `unit?: string | null`.
- Update `createType` mutation to accept and pass `unit`.
- Update Settings `CustomLogTypeRow` to show the unit badge if set.

---

### Technical details

| File | Change |
|------|--------|
| **Database migration** | `ALTER TABLE custom_log_types ADD COLUMN unit text;` |
| `src/hooks/useCustomLogTypes.ts` | Add `unit` to `CustomLogType` interface; include `unit` in `createType` mutation params |
| `src/components/CreateLogTypeDialog.tsx` | Add optional Unit input (visible for numeric/text_numeric); update `onSubmit` signature to `(name, valueType, unit?)` |
| `src/components/LogEntryInput.tsx` | Remove unit state + unit input field; add `unit?: string` prop; show unit as static text suffix next to numeric input |
| `src/pages/OtherLog.tsx` | Pass `unit={selectedType.unit}` to `LogEntryInput`; pass `unit: selectedType.unit` in `createEntry.mutate` |
| `src/components/CustomLogEntryRow.tsx` | Accept `typeUnit` prop; fall back to it when `entry.unit` is empty |
| `src/components/CustomLogTypeRow.tsx` | Show unit in the row if defined (e.g. "numeric -- lbs") |

