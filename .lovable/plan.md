

## Add Pre-built Templates for Custom Log Types

### Problem
New users land on the Custom Logs page and see "Add Custom Log Type" which opens a dialog full of unfamiliar options (value type, unit, text mode). Too much friction for common use cases.

### Solution
Replace the initial empty-state experience with a template picker. Templates are one-tap: selecting one instantly creates the log type with sensible defaults (unit-aware from user settings). The existing "create your own" dialog becomes an escape hatch at the bottom of the template list.

### Templates

| Template Name | Value Type | Unit (imperial) | Unit (metric) |
|---|---|---|---|
| Body Weight | numeric | lbs | kg |
| Body Measurements | text_numeric | in | cm |
| Body Fat % | numeric | % | % |
| Blood Pressure | text | _(none)_ | _(none)_ |
| Sleep | numeric | hrs | hrs |
| Mood | text | _(none)_ | _(none)_ |
| Journal | text_multiline | _(none)_ | _(none)_ |
| Water Intake | numeric | oz | ml |

Unit selection logic: If the user's `weightUnit` setting is `kg`, use the metric column. Otherwise use imperial.

### UI Flow

**When user has zero log types (empty state):**
- Show a grid of template buttons (icon + label) in the top section where "Add Custom Log Type" button currently lives
- Below the grid, a smaller "Create your own" link opens the existing `CreateLogTypeDialog`
- Tapping a template immediately creates the log type and selects it

**When user already has log types:**
- The existing Select dropdown works as-is
- The "Add Custom Log Type" option at the bottom of the dropdown opens a **template picker dialog** (same template grid + "Create your own" link) instead of going straight to the advanced dialog

### Technical Details

**New file: `src/lib/log-templates.ts`**
- Define the `LOG_TEMPLATES` array with name, valueType, unit per system (imperial/metric), and an icon identifier
- Export a helper `getTemplateUnit(template, weightUnit)` that resolves the correct unit

**Modified file: `src/pages/OtherLog.tsx`**
- Empty state: render template grid instead of single button
- Change `__create_new__` handler to open template picker dialog instead of `CreateLogTypeDialog`

**New file: `src/components/LogTemplatePickerDialog.tsx`**
- Dialog with template grid + "Create your own" link at the bottom
- One tap on a template calls `createType.mutate(...)` directly, closes dialog, selects new type
- "Create your own" link closes this dialog and opens `CreateLogTypeDialog`

**Existing file: `src/components/CreateLogTypeDialog.tsx`**
- No changes needed -- it becomes the "advanced" path

**Existing file: `src/hooks/useCustomLogTypes.ts`**
- No changes needed -- `createType` mutation already accepts name, value_type, unit
