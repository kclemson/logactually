
# Add Name Editing to EditLogTypeDialog

## What the user wants

When a user taps the pencil icon on a custom log type row (especially a medication), they should be able to fix a typo in the name from that dialog — not just edit dose/schedule/notes.

## Good news: entries don't need updating

The concern about "auto-updating existing entries" is already solved by the data model. Entries store a `log_type_id` foreign key — they never store the name string. So when the log type name changes, every query that joins or looks up the log type will automatically see the new name. No migration or entry-level update is needed.

## Current state

`EditLogTypeDialog` renders the name as a read-only `<DialogTitle>` (e.g. "Compazine" in the screenshot). The dialog has no input for the name.

Inline renaming does exist: tapping the name text in the row opens `DescriptionCell` for editing. But that's easy to miss and not available when the pencil dialog is open. It also doesn't work consistently for medication types where the name area is narrow.

## Changes

### 1. `EditLogTypeDialog.tsx`

Add a **Name** field at the top of the dialog, above "Standard dose" (for medications) or above the Notes section (for non-medications):

- Initialized from `logType.name`
- Plain `<Input>` with `autoComplete="off"`
- `DialogTitle` changes to a fixed generic label (e.g. "Edit log type" / "Edit medication") instead of showing the name, since the name is now editable
- On Save, include `name` in the params passed to `onSave`

Update the `onSave` callback type to include `name?: string`:

```tsx
onSave: (id: string, params: {
  name?: string;        // ← new
  description: string | null;
  unit?: string | null;
  default_dose?: number | null;
  doses_per_day?: number;
  dose_times?: string[] | null;
}) => void;
```

### 2. `CustomLogTypeRow.tsx`

Update the `onSave` handler inside `CustomLogTypeRow` to also pass the `name` field through to `onUpdateMedication` / `onRename`. Currently the two paths are:

- Medication → `onUpdateMedication(id, params)` — add `name` to the params it passes
- Non-medication → `onUpdateDescription` + `onUpdateUnit` — add a call to `onRename(id, params.name)` if the name changed

The cleanest approach: pass `name` through to both paths and let the parent (`CustomLogTypesSection`) handle it via `updateType.mutate({ id, name, ...otherParams })`.

### 3. `CustomLogTypesSection.tsx`

The `onUpdateMedication` callback currently calls `updateType.mutate({ id, ...params })`. Since `updateType` already handles `name` as an optional field, no changes needed here — it will naturally pick up `name` from the spread.

For non-medication, `onRename` is a separate call to `updateType.mutate({ id, name })`. The `EditLogTypeDialog`'s `onSave` in `CustomLogTypeRow` should call `onRename` when the name has changed, in addition to `onUpdateDescription`/`onUpdateUnit`.

The simplest and cleanest fix: consolidate the `onSave` wiring in `CustomLogTypeRow` to always call `updateType` once with all changed fields. This avoids firing two separate mutations (one for name, one for description).

### Approach: single mutation call for all log types

Update `CustomLogTypeRow.onSave` to call a single `onUpdate` prop that takes all changed fields together:

```tsx
// In CustomLogTypeRow, onSave handler:
onSave={(id, params) => {
  // params now includes name, description, unit, etc.
  if (type.value_type === 'medication' && onUpdateMedication) {
    onUpdateMedication(id, { name: params.name, ...params });
  } else {
    // call onRename if name changed, and onUpdateDescription always
    if (params.name && params.name !== type.name) onRename(id, params.name);
    onUpdateDescription(id, params.description);
    if (params.unit !== undefined) onUpdateUnit(id, params.unit);
  }
}}
```

This keeps the existing prop interface intact (no changes to `CustomLogTypesSection` needed).

## Duplicate name validation

The dialog should prevent saving a name that's already used by another log type. Pass `existingNames` into `EditLogTypeDialog` and validate on Save — show a brief inline error message below the name field if duplicate.

## Files changed

| File | Change |
|---|---|
| `src/components/EditLogTypeDialog.tsx` | Add `name` state + `<Input>` field at top; change `DialogTitle` to generic "Edit log type"; include `name` in `onSave` params; add duplicate name validation with existingNames prop |
| `src/components/CustomLogTypeRow.tsx` | Pass `existingNames` to `EditLogTypeDialog`; update `onSave` handler to also call `onRename` when name changes |

No DB changes. No hook changes. No migration needed (entries use FK, not name strings).
