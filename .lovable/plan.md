# Reorganize the "Add Log Type" picker

Turn the template picker into a single grouped checklist where the user ticks which built-in log types to enable, confirms once to create them all, and only takes a separate path for fully custom types. Memories becomes a first-class, always-visible option.

## What changes for the user

- Opening **Add Log Type** shows every built-in type at once, organized under three labeled groups — no more "More options" expander to hunt through.
- Each built-in type is a **checkbox**. Tick any number across groups, then press **Add selected** to create them in one step.
- Types you already have are shown checked and disabled with an "Added" label.
- **Memories** is visible by default in its own group.
- **Mood** and **Journal** are removed (verified unused — no one has them).
- A **Create your own** link at the bottom remains the path for anything not in the list.

## Groups

```text
Body
  ☐ Body Weight            (lbs/kg)
  ☐ Body Fat %             (%)
  ☐ Waist                  (in/cm)
  ☐ Hips                   (in/cm)
  ☐ Chest                  (in/cm)
  ☐ Bicep                  (in/cm)
  ☐ Thigh                  (in/cm)
  ☐ Neck                   (in/cm)

Health
  ☐ Blood Pressure         (mmHg)
  ☐ Sleep                  (hrs)
  ☐ Water Intake           (oz/ml)
  ☐ Bloodwork
  →  Medication            (opens setup — see below)

Memories
  ☐ Memories

[ Add N selected ]
Create your own →
```

The previous nested "Body Measurement" sub-expander goes away; the individual measurements become normal checkboxes in the Body group, which is simpler and consistent with the new model.

## The one special case: Medication

Medication needs its dose/schedule setup (`CreateMedicationDialog`), so it can't be silently batch-created from a checkbox. It stays a distinct **row with a chevron** inside the Health group that closes the picker and opens the medication setup step (existing `onSelectMedication` behavior). Everything else is a plain checkbox handled by the batch create.

## Technical details

**`src/lib/log-templates.ts`**
- Remove the `Mood` and `Journal` entries from `LOG_TEMPLATES`.
- Set a `group` value on every template so the dialog can render sections: `'body'` (Body Weight, Body Fat %, and the six measurements), `'health'` (Blood Pressure, Sleep, Water Intake, Bloodwork, Medication), `'memory'` (Memories). The old `'measurement'` group tag on the six measurement rows is replaced by `'body'`.
- Delete the now-unused `MEASUREMENT_TEMPLATES` export (confirmed: only the picker dialog imports it).

**`src/components/LogTemplatePickerDialog.tsx`** (main rewrite)
- Replace the Body-Weight-row + measurement-expander + primary-rows + "More options" structure with a flat render that maps over the group order (`body`, `health`, `memory`), printing a small section header per group and a checkbox row per template.
- A single `selected: Set<string>` of template names drives the footer **Add N selected** button (disabled when nothing new is selected). Already-added templates render checked + disabled. Per the project's useEffect guidance, this state resets via conditional unmount of the dialog (not effect syncing).
- Medication renders as a chevron row (not a checkbox) that calls `onSelectMedication`.
- Confirm calls `onSelectTemplates` with all ticked items (keeping the existing fallback that loops `onSelectTemplate` when `onSelectTemplates` is absent).
- Keep the **Create your own** button (`onCreateCustom`) at the bottom; reuse each template's existing lucide icon.

**`src/components/settings/CustomLogTypesSection.tsx`**
- Add an `onSelectTemplates` handler (batch create, mirroring the one already in `OtherLog.tsx`) so multi-select works here too.
- Replace the narrow `value_type` cast with `as ValueType` (verified: `ValueType` already covers `numeric | text_numeric | text | text_multiline | dual_numeric | medication | panel | memory`, and `createType` accepts it — no other plumbing needed).

**`src/pages/OtherLog.tsx`**
- Wrap `<LogTemplatePickerDialog />` in `{templatePickerOpen && ( … )}` so it unmounts on close and selection state resets cleanly (matching `CustomLogTypesSection`). Existing `onSelectTemplates`/`onSelectMedication`/`onCreateCustom` wiring is reused as-is.

## Out of scope

- No database/schema changes (Mood/Journal removal is template-list only; they were never created as types).
- No changes to how Memories, Medication, or Bloodwork entries are composed or viewed.
- No new icons or font/design-system changes.
