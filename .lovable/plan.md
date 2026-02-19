
# What needs to happen (nothing was implemented yet)

The plan was approved across multiple messages but no code was ever written. The database column is still `logged_time`, and `csv-export.ts` / `useExportData.ts` are both unchanged from their original state. This is a full implementation from scratch.

---

## Part 1 — Database column rename

Run a migration:

```sql
ALTER TABLE public.custom_log_entries
  RENAME COLUMN logged_time TO dose_time;
```

No data loss. The column type (`time without time zone`, nullable) and all existing data are preserved.

---

## Part 2 — Update all TypeScript files referencing `logged_time`

After the migration, `logged_time` no longer exists on the table, so every reference in code must become `dose_time`.

Files to update:

| File | Change |
|---|---|
| `src/hooks/useCustomLogEntries.ts` | Rename interface field `logged_time` → `dose_time`; rename in insert payload |
| `src/hooks/useCustomLogEntriesForType.ts` | Rename any `logged_time` field reference |
| `src/hooks/useAllMedicationEntries.ts` | `.order('logged_time', ...)` → `.order('dose_time', ...)` |
| `src/components/MedicationEntryInput.tsx` | `onSubmit` params interface field + call site |
| `src/components/CustomLogEntryRow.tsx` | `entry.logged_time` → `entry.dose_time` |
| `src/components/AllMedicationsView.tsx` | `entry.logged_time` → `entry.dose_time` |
| `src/components/CustomLogTypeView.tsx` | `entry.logged_time` → `entry.dose_time` |
| `src/pages/OtherLog.tsx` | All `logged_time` references → `dose_time` |

---

## Part 3 — Fix the CSV export (the three original issues)

### `src/hooks/useExportData.ts`

Update the Supabase `.select()` to also fetch `dose_time` and `entry_notes`:

```
.select('logged_date, created_at, dose_time, entry_notes, numeric_value, numeric_value_2, text_value, unit, custom_log_types(name, value_type)')
```

And include `dose_time` and `entry_notes` in the returned row objects.

### `src/lib/csv-export.ts`

1. Add `dose_time` and `entry_notes` to the `CustomLogExportRow` interface.
2. Update `exportCustomLog` with:
   - Correct column order: **Unit immediately after Value**
   - New **"Dose Time"** column (from `dose_time` — blank if null)
   - New **"Notes"** column at the end (from `entry_notes` — blank if null)

Final column order:

**Without BP data:**
```
Date | Time | Dose Time | Log Type | Value | Unit | Notes
```

**With BP data:**
```
Date | Time | Dose Time | Log Type | Value | Unit | Systolic | Diastolic | Reading | Notes
```

---

## Summary of all files changed

| File | Change type |
|---|---|
| Database migration | Rename column `logged_time` → `dose_time` |
| `src/hooks/useCustomLogEntries.ts` | `logged_time` → `dose_time` |
| `src/hooks/useCustomLogEntriesForType.ts` | `logged_time` → `dose_time` |
| `src/hooks/useAllMedicationEntries.ts` | `.order('logged_time')` → `.order('dose_time')` |
| `src/hooks/useExportData.ts` | Add `dose_time`, `entry_notes` to select + row mapping |
| `src/components/MedicationEntryInput.tsx` | `logged_time` → `dose_time` |
| `src/components/CustomLogEntryRow.tsx` | `entry.logged_time` → `entry.dose_time` |
| `src/components/AllMedicationsView.tsx` | `entry.logged_time` → `entry.dose_time` |
| `src/components/CustomLogTypeView.tsx` | `entry.logged_time` → `entry.dose_time` |
| `src/pages/OtherLog.tsx` | All `logged_time` refs → `dose_time` |
| `src/lib/csv-export.ts` | Add Dose Time + Notes columns, move Unit after Value |

No new dependencies. One database migration required (non-destructive rename).
