

## Consolidate Measurement Templates into "Body Measurement" Group with Checkbox Picker

### What changes for the user

Instead of seeing 6 separate measurement rows (Waist, Hips, Chest, Bicep, Thigh, Neck) in the template picker, users will see a single **"Body Measurement"** row. Clicking it expands an inline checkbox list where they pick which measurements they want, then click "Add selected" to create them all at once. Each created type will include "Measurement" in its name (e.g. "Waist Measurement") so it looks clearer in charts.

### UX Flow

1. User opens "Add a Log Type" picker
2. They see: Body Weight, **Body Measurement**, Body Fat %, Blood Pressure, Sleep, Water Intake, Mood, Journal, Create your own
3. Clicking "Body Measurement" expands a checkbox list: Waist, Hips, Chest, Bicep, Thigh, Neck (with unit shown, e.g. "in" or "cm")
4. Measurements already added are checked and disabled
5. User checks the ones they want, clicks "Add selected"
6. All selected types are created, dialog closes
7. If ALL 6 are already added, the "Body Measurement" row shows "Already added" and is disabled

### Technical Details

#### 1. `src/lib/log-templates.ts`

- Add `group?: string` field to the `LogTemplate` interface
- Add `displayName?: string` field (for showing short name in checkbox, e.g. "Waist", while the created type name is "Waist Measurement")
- Rename the 6 measurement templates to include "Measurement": "Waist Measurement", "Hips Measurement", etc.
- Tag each with `group: 'measurement'` and `displayName` set to the short name (e.g. "Waist")
- Export a helper `MEASUREMENT_TEMPLATES` that filters `LOG_TEMPLATES` by `group === 'measurement'`

#### 2. `src/components/LogTemplatePickerDialog.tsx`

- Add new prop: `onSelectTemplates: (params: { name: string; value_type: string; unit: string | null }[]) => void` for batch creation
- Add local state: `measurementExpanded` (boolean), `selectedMeasurements` (Set of template names)
- Split rendering into two groups:
  - **Non-measurement templates**: rendered as individual clickable rows (same as today)
  - **Body Measurement group row**: single row with Ruler icon; clicking toggles `measurementExpanded`
- When expanded, show checkboxes for each measurement sub-type using `displayName` and unit
- Already-added measurements are pre-checked and disabled
- "Add selected" button at the bottom of the expanded section calls `onSelectTemplates` with all newly-checked items
- If all 6 measurements are already added, the group row is disabled with "Already added" label

#### 3. `src/pages/OtherLog.tsx`

- Pass `onSelectTemplates` to `LogTemplatePickerDialog` that chains `createType.mutate` calls sequentially for each selected measurement, closing the dialog after the last one succeeds
- Update the empty-state grid (shown when no log types exist yet) to also consolidate the 6 measurement buttons into a single "Body Measurement" button that opens the template picker dialog instead of individually creating types

