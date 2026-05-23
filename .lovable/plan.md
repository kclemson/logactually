# Move failed bloodwork out of the daily log view

## Problem

A failed bloodwork upload currently appears as a row in the custom-log day view for whatever day it was uploaded (because `collected_date` is `null` after a failed parse, and `useBloodworkPanelsForDate` deliberately surfaces null-date failed panels as "in-flight"). That's misleading — a failed parse isn't really an entry on that day, and the retry/delete affordance belongs with the Bloodwork log type itself in Settings.

## Changes

### 1. Stop surfacing failed panels in the daily view
`src/hooks/useBloodworkPanels.ts`, `useBloodworkPanelsForDate`:
- Change the `inFlight` query from `.in('parse_status', ['pending', 'failed'])` to just `.eq('parse_status', 'pending')`.
- Update the comment on the merge block accordingly.
- Result: failed panels with no `collected_date` no longer appear in any day view. Failed panels that DO have a `collected_date` (rare — parse populated date then failed downstream) also drop out, since we'll want a single canonical place to manage failed uploads.

### 2. Surface failed panels under the Bloodwork log type in Settings
- New hook `useFailedBloodworkPanels(logTypeId)` in `src/hooks/useBloodworkPanels.ts`: selects all `bloodwork_panels` for the current user where `log_type_id = logTypeId` and `parse_status = 'failed'`, ordered by `created_at desc`.
- In `src/components/CustomLogTypeRow.tsx`, when `type.value_type === 'panel'`:
  - Call the hook.
  - If there are failed panels, render a small inline list directly beneath the row (indented, muted styling consistent with existing settings rows). Each entry shows: filename (or "Untitled upload"), upload date, the `parse_error` message, plus a retry icon and a delete icon.
  - Retry calls the existing `retryParse` mutation; delete calls the existing `deletePanel` mutation. Both already exist in `useBloodworkPanels.ts`.
  - If there are no failed panels, render nothing extra — no empty state.

### Technical notes
- No DB or RLS changes.
- No edge function changes.
- The optimistic-update behavior added to `retryParse` last turn still works here — clicking retry from Settings will flip the row to "parsing…" immediately, then either disappear (on success, since it's no longer failed) or stay with an updated error message.
- Keep wiring contained to `CustomLogTypeRow` so other log-type rows are unaffected.

## Out of scope
- Why parses are failing in the first place (separate investigation).
- Any change to how successful bloodwork panels render in the day view.
