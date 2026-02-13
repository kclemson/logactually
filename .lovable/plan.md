

## "Other" Custom Logging Feature

A new feature that lets users define and log arbitrary tracking categories (body weight, measurements, mood journal, etc.) with date navigation, list view, and trend charts -- all using the same UX patterns as the existing Food and Exercise pages.

### User Flow

1. User toggles **"Log other things"** in Settings > Preferences
2. An **"Other"** tab appears in the bottom nav (using a teal/cyan theme color)
3. On the Other page, user taps **"+ Add Tracking Type"** to create a category
4. A dialog asks for: **Name** (free text) and **Value type** (Numeric, Text + Numeric, or Text-only)
5. User logs entries against their created types, date by date
6. Trends page shows an **"Other Trends"** collapsible section with line/bar charts for numeric types

### Value Types

| Type | Example | Charts? |
|------|---------|---------|
| **Numeric** | Body weight: `172.5` | Yes -- line chart over time |
| **Text + Numeric** | Measurements: `Waist: 32 in`, `Bicep: 14.5 in` | Yes -- one line per label |
| **Text-only** | Notes: `Feeling great today` | No charts, list view only |

Text-only is useful for daily journal/mood notes, gratitude logs, or symptom tracking where users just want a searchable record tied to a date.

### Theme Color

**Teal** (`hsl(172 66% 50%)` / Tailwind `teal-500`) for the Other category -- used in calendar date highlights, date picker dots on History page, and chart colors on Trends.

### Technical Plan

**Database: 1 migration with 2 new tables**

`custom_log_types` -- stores user-defined tracking categories:
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL)
- `name` (text, NOT NULL) -- e.g. "MyWeight", "Body Measurements"
- `value_type` (text, NOT NULL) -- `numeric`, `text_numeric`, `text`
- `sort_order` (integer, default 0) -- for future reordering
- `created_at`, `updated_at` (timestamptz)
- RLS: user can CRUD own rows, read-only users blocked from writes

`custom_log_entries` -- stores individual logged values:
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL)
- `log_type_id` (uuid, FK to custom_log_types)
- `logged_date` (date, NOT NULL, default CURRENT_DATE)
- `numeric_value` (numeric, nullable) -- for numeric and text_numeric types
- `text_value` (text, nullable) -- for text and text_numeric types (label like "Waist")
- `unit` (text, nullable) -- optional unit label like "in", "lbs", "cm"
- `created_at`, `updated_at` (timestamptz)
- RLS: same pattern as food_entries

**Settings**
- Add `showCustomLogs: boolean` to `UserSettings` interface and defaults (default `false`)
- Add toggle in Settings > Preferences: "Log other things"

**Navigation**
- `BottomNav.tsx`: Add "Other" nav item (icon: `ClipboardList` or `LayoutList`) when `settings.showCustomLogs` is true
- Route: `/other`

**New Files**

- `src/pages/OtherLog.tsx` -- Main page with date nav (reusing the same `<` `>` calendar pattern from FoodLog/WeightLog), list of entries grouped by type, and input controls
- `src/hooks/useCustomLogTypes.ts` -- CRUD for custom_log_types (React Query)
- `src/hooks/useCustomLogEntries.ts` -- CRUD for custom_log_entries by date (React Query)
- `src/hooks/useDatesWithData.ts` -- Add `useCustomLogDatesWithData` query (same pattern as food/weight)
- `src/components/CreateLogTypeDialog.tsx` -- Dialog for creating a new tracking type (name + value type picker)
- `src/components/LogEntryInput.tsx` -- Inline input row for adding a new entry (adapts fields based on value_type)
- `src/components/CustomLogEntryRow.tsx` -- Display row for a logged entry (left: type name, right: value)

**Other Log Page Layout**
- Date navigation bar (identical pattern to FoodLog/WeightLog, teal accent)
- Calendar popover highlights dates with custom log data in teal
- "+ Add Tracking Type" button (opens CreateLogTypeDialog)
- For each type the user has created: a section showing entries for that date with inline add
- Entry display: type name on left, formatted value on right
- No totals row

**Trends Integration**
- `src/pages/Trends.tsx`: Add "Other Trends" CollapsibleSection (gated on `showCustomLogs`)
- For each numeric/text_numeric type, render a line or bar chart showing values over the selected period
- Text_numeric types: one chart per type, with separate lines per unique text_value (e.g., "Waist" line, "Bicep" line)
- Text-only types: skip (no chart possible)
- `src/hooks/useCustomLogTrends.ts` -- Fetch aggregated data for charting

**History Page**
- Add teal dot indicator on days that have custom log entries (similar to the exercise icons)

**App.tsx**
- Add route: `<Route path="/other" element={<OtherLog />} />`

### What This Does NOT Include (future iterations)
- Editing/deleting tracking types (can add later)
- Reordering types
- Units configuration per type (hardcoded optional field for now)
- Import/export of custom logs
- Ask AI integration for custom logs

