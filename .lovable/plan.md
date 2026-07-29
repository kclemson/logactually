## Problem
You want to log iron infusions as a numeric custom log (date + mg amount), but the current flow forces the entry onto either the selected day in Daily view or today in By-Type/Focused view. That makes backfilling your 2024–2026 infusion history painful or impossible without navigating one day at a time.

## Proposed fix
Add a manual date picker to the custom log entry creation and editing dialogs so you can override the default date before saving. This applies to **all custom log types** (numeric, text, medication, panel, etc.) because all of them can have backdated entries.

## What we'll build
1. **Date override in the create/edit dialog**
   - In the existing `LogEntryInput`/dialog flow, add a `DatePicker` that defaults to the current context date (selected day or today) but lets you pick any date.
   - Pass the chosen date through to the `createEntry`/`updateEntry` mutation instead of always using the context date.

2. **Support editing the date on existing entries**
   - Allow the date to be changed when editing an entry, so mistakes or backfilled entries can be corrected.

3. **No new log type needed**
   - You'll create a standard numeric custom log type named "Iron Infusion" with unit "mg" through the existing UI. The code change is only about the date picker.

## Out of scope for now
- Charting ferritin alongside infusions (you said you're not sure yet about priority).
- Overlaying infusion events on bloodwork charts.
- New structured fields like brand/location.

## Files likely to change
- `src/components/LogEntryInput.tsx` — add date picker state and pass date override.
- `src/pages/OtherLog.tsx` — wire the date picker into the entry creation dialog.
- `src/hooks/useCustomLogEntries.ts` — support `logged_date` override in `createEntry`/`updateEntry`.
- `src/hooks/useCustomLogEntriesForType.ts` — already accepts `logged_date`, may need minor alignment.

## Risks
- Low. The change is additive and only affects the custom log entry creation/editing flow.
- Need to make sure the date picker works inside the dialog on mobile (use `pointer-events-auto` on the calendar popover).