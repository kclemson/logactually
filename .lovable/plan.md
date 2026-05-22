# Add edit pencil to every custom log row type

Today only medication rows show a pencil-icon "edit in dialog" affordance. Numeric, dual_numeric, text, text_multiline, and text_numeric rows only support inline cell editing and offer a trash icon. This adds the pencil to those rows too, opening the same dialog that creates entries — pre-filled and in edit mode.

## Scope

In scope:
- Pencil icon on hover for every non-medication, non-panel row (in both By Date and By Type views, since they share `CustomLogTypeDayRows`).
- Clicking the pencil opens the existing entry input dialog, pre-filled with the entry's current values, with a "Save" action that updates the entry instead of creating a new one.

Out of scope:
- Panel (bloodwork) rows — they have their own editing flow.
- Adding new editable fields (time, notes) for non-med entries. Today those aren't captured at create time, so the edit dialog will mirror what create offers: just the value field(s).
- Visual redesign of the dialog.

## Changes

### `src/components/LogEntryInput.tsx`
Add optional initial-value props and an edit mode:
- New props: `initialNumericValue?: number | null`, `initialNumericValue2?: number | null`, `initialTextValue?: string | null`, `mode?: 'create' | 'edit'` (default `'create'`).
- Seed `useState` from those props.
- In edit mode: keep the same layout, but label the submit button "Save changes" and do **not** clear the inputs after submit (parent closes the dialog).

### `src/components/CustomLogEntriesView.tsx` (`NonMedEntryRow`)
- Add an `onEdit?: (entry) => void` prop and thread it down from `CustomLogTypeDayRows`.
- When `onEdit` is provided and not read-only, render a Pencil button next to the existing Trash button using the exact same styling as the medication row's pencil (`md:opacity-0 md:group-hover:opacity-100`, `h-6 w-6`, etc.).
- For the `text_multiline` branch, do the same in its 3-column grid.

### `src/pages/OtherLog.tsx`
- The existing `editingEntry` state already exists and is passed via `onEdit` for medications. Reuse it for non-med rows — the row's pencil already calls `onEdit(entry)`.
- In the edit dialog block (`{editingEntry && editingLogType && !isReadOnly && ...}`), branch by `editingLogType.value_type`:
  - `medication` → existing `MedicationEntryInput` (unchanged).
  - `panel` → render nothing (panel rows don't surface a pencil).
  - everything else → render `LogEntryInput` in edit mode, pre-filled with `editingEntry.numeric_value / numeric_value_2 / text_value`, wired to `updateEntry.mutate({ id, ...params })` then `setEditingEntry(null)` on success.
- The dialog wrapper styling (`max-w-sm p-0 ...`) is reused so create and edit look identical.

## Why this design

- Mirrors the medication pattern exactly — same icon, same hover behavior, same dialog shell — so the two row types stop diverging.
- Uses the existing create component (`LogEntryInput`) instead of building a parallel edit form, so any future field added to create is automatically editable.
- Uses the existing `updateEntry` mutation that already powers inline editing, so cache invalidation, read-only enforcement, and validation flow through one path.

## Visible behavior after the change

For Weight, Measurement, Blood Pressure, and every other custom log type, hovering a row shows a pencil + trash. The pencil opens the same compact dialog used to log a new entry, pre-filled with the current values, with a "Save changes" button. This works identically in By Date and By Type views.
