
# Medication Log Type — Revised Implementation Plan

This plan incorporates your four feedback points alongside the original medication design.

---

## Database migrations (2)

### Migration 1: Add columns to existing tables
```sql
-- custom_log_types: description field (for medication instructions / notes)
ALTER TABLE public.custom_log_types ADD COLUMN description text NULL;

-- custom_log_entries: actual time value + per-entry notes
ALTER TABLE public.custom_log_entries
  ADD COLUMN logged_time time NULL,
  ADD COLUMN entry_notes text NULL;
```

`logged_time` uses Postgres `time` type (HH:MM:SS), stored and queried precisely. No scheduling, just "what time was this dose taken." The UI will present a native `<input type="time">` which on mobile opens the OS time picker and on desktop gives a spinner — no custom picker component needed.

### Migration 2: Add `medication` to the value_type check constraint
```sql
ALTER TABLE public.custom_log_types
  DROP CONSTRAINT IF EXISTS custom_log_types_value_type_check;
ALTER TABLE public.custom_log_types
  ADD CONSTRAINT custom_log_types_value_type_check
  CHECK (value_type IN ('numeric','text_numeric','text','text_multiline','dual_numeric','medication'));
```

---

## #1 — Time as a real time value with time picker

`logged_time` is stored as Postgres `time`. The entry input uses `<input type="time">` which:
- On iOS/Android: opens native clock picker
- On desktop: renders a time spinner

Display format: `h:mm a` (e.g., "8:30 AM") using `date-fns format`.

In `CustomLogEntryRow` for medication, the time displays as a muted prefix: `8:30 AM · 500 mg Ibuprofen`.

In `CustomLogTypeView` (by-type history), the date column shows `Mon Jan 6, 8:30 AM` instead of just the date.

---

## #2 — `entry_notes` as a multiline textarea

In `MedicationEntryInput` (new component), the notes field is a `<textarea>` — same styling as the existing `text_multiline` log entries (resizable, `min-h-[60px]`). It is optional and sits below the time + dose row.

Display in `CustomLogEntryRow`: if `entry_notes` is present, it renders on a second muted line below the main `time · dose` line.

---

## #3 — Edit button (pencil icon) in settings + description/detail editing

### Settings row change (`CustomLogTypeRow.tsx` + `SavedItemRow.tsx`)

The existing row layout is:
```
[Name (editable inline)] [unit · type-label] [delete]
```

New layout:
```
[Name (editable inline)] [(unit) in gray if present] [✏ edit] [delete]
```

- Remove the `VALUE_TYPE_LABELS` meta display entirely
- Unit (if set) shows as `(mmHg)` in `text-xs text-muted-foreground` — as you described
- A small pencil icon button (`Pencil`, `h-3.5 w-3.5`) replaces the type-label text, opening the edit detail dialog

`SavedItemRow` gets an optional `onEdit?: () => void` prop. When provided, it renders the pencil button between the name and delete icon.

### New component: `EditLogTypeDialog.tsx`

A dialog that opens when the pencil is clicked. Its content varies by `value_type`:

**For all non-medication types:**
- Description field only: `<textarea>` labeled "Description / notes", currently empty for most types. This is free text for any personal notes about the log type (e.g., "Take morning and evening").

**For `medication` types:**
- Description / instructions field (same textarea)
- (In the future, medication-specific fields could be added here — dose schedule, etc. — but for now it's just description.)

The dialog has a Save button that calls `updateType.mutate({ id, description })`.

### `CustomLogTypesSection.tsx` changes

- Pass `onEdit` callback to each `CustomLogTypeRow`
- Manage `editingTypeId` state to open the right dialog

---

## #4 — Template picker dialog restructuring

### Remove the subheader
`DialogDescription` with "Pick a template to get started quickly." is removed. Title alone is sufficient.

### Collapsible "More options" section

The primary list (always visible):
1. Body Weight
2. Body Measurement (existing expando)
3. Body Fat %
4. Blood Pressure
5. **Medication** ← new

Everything else collapses under a "More options" toggle row (same chevron-expando pattern as Body Measurement):

Hidden under expando (click to expand):
- Sleep
- Water Intake
- Mood
- Journal
- Create your own

The expando row says "More options" with a `ChevronRight`/`ChevronDown` icon, using the same `hover:bg-accent` style as other rows. When expanded, the hidden items appear below it inline — no nesting, just revealed in place.

---

## New component: `MedicationEntryInput.tsx`

Replaces `LogEntryInput` when `selectedType.value_type === 'medication'`.

Layout (stacked, not inline):
```
Row 1: [Time input (type="time")] [Dose amount (number)] [(unit label)] [Save] [×]
Row 2: [Notes textarea — full width, optional]
```

- Time field: `<input type="time">` defaulting to current time
- Dose: number input (same style as other numeric inputs), `w-20`
- Unit: shown as muted suffix label if the log type has a unit set
- Notes: full-width `<textarea>` with `placeholder="Notes (optional)"`, `min-h-[60px]`
- Save is disabled until dose is filled (time defaults to current time so it's always valid)

On submit, calls `createEntry` with:
```ts
{
  log_type_id,
  logged_date: dateStr,
  numeric_value: doseAmount,
  unit: selectedType.unit,
  logged_time: timeValue,   // "HH:MM" string → stored as Postgres time
  entry_notes: notesValue || null,
}
```

---

## Updated entry display for medication

### `CustomLogEntryRow.tsx` — medication branch
```
08:30 AM  ·  500 mg                          [delete]
With food — take on empty stomach if fasting
```

- Main line: `time · dose unit` in normal text, delete icon on right
- Notes line (if present): `text-xs text-muted-foreground` italic, full width below

### `CustomLogTypeView.tsx` — medication in by-type history
```
Mon Jan 6, 8:30 AM    500 mg     [delete]
                      With food
```

- Date column shows date + time together (already supported by the `usesTime` branch, just extend it to `medication`)

---

## New template in `log-templates.ts`

```ts
{ name: 'Medication', valueType: 'medication', unitImperial: null, unitMetric: null, icon: 'Pill' }
```

Icon: `Pill` from lucide-react (already in lucide v0.462, available in this project). Added to `ICON_MAP` in the picker dialog.

---

## Files changed summary

| File | Change |
|---|---|
| DB migration | Add `description`, `logged_time`, `entry_notes` columns; add `medication` to constraint |
| `src/hooks/useCustomLogTypes.ts` | Add `medication` to `ValueType`; add `description` to `CustomLogType` interface and `updateType` params |
| `src/hooks/useCustomLogEntries.ts` | Add `logged_time`, `entry_notes` to `CustomLogEntry` interface; pass through in create/update mutations |
| `src/hooks/useCustomLogEntriesForType.ts` | Pass `logged_time`, `entry_notes` through `createEntry` |
| `src/lib/log-templates.ts` | Add `Medication` template |
| `src/components/LogTemplatePickerDialog.tsx` | Remove subheader; add Medication to primary list; collapse Sleep/Water/Mood/Journal/Create under "More options" expando |
| `src/components/MedicationEntryInput.tsx` | New component — time picker + dose + notes textarea |
| `src/components/EditLogTypeDialog.tsx` | New component — dialog for editing description (all types) |
| `src/pages/OtherLog.tsx` | Render `MedicationEntryInput` for medication types instead of `LogEntryInput` |
| `src/components/CustomLogEntryRow.tsx` | Add medication display branch (time · dose, notes line) |
| `src/components/CustomLogTypeView.tsx` | Add medication to `formatEntryDate` (show time), `formatEntryValue` (dose + notes); show description block at top |
| `src/components/CustomLogTypeRow.tsx` | Replace type-label meta with unit-in-parens + pencil edit icon |
| `src/components/SavedItemRow.tsx` | Add optional `onEdit?: () => void` prop; render pencil button when provided |
| `src/components/settings/CustomLogTypesSection.tsx` | Add `editingTypeId` state; wire pencil → `EditLogTypeDialog`; pass `updateType` for description saves |
