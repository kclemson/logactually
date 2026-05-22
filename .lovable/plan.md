
## Goal

Turn the existing "Show All / Medication Only" dropdown on `/custom` into a true view selector with two modes: **By Date** (today's behavior) and **By Type**. This kills the medication-threshold bug entirely, gives sparse data (bloodwork, lab results, occasional measurements) a natural home, and re-uses the inline trend chart we just added.

## Behavior

### By Date (default — unchanged)
- Renders the `DateNavigation` header.
- Shows entries logged on the selected date, swipe to next/prev day, same as Food/Exercise.
- "Log New" dropdown opens the input dialog for the chosen type on the selected date.

### By Type (new)
- Hides `DateNavigation` entirely — by-type browsing is date-agnostic.
- Renders a list of the user's custom log types (using the existing `sortedLogTypes` order: most-recently-used first).
- For each type, render a card with:
  - Type name + unit, a small "Log new" button on the right that opens the input dialog (defaulting to today's date for new entries).
  - The existing inline trend chart (`useCustomLogTrendSingle` + `CustomLogTrendChart`) for numeric / dual-numeric / medication types, all-time view.
  - For `value_type === 'panel'` (bloodwork): list all panels for that type chronologically, newest first, using the existing `BloodworkPanelRow` UI. No chart — the panel rows are the "history".
  - For text types: most recent N entries with date stamps, no chart.
- Clicking a chart navigates to that chart in Trends (the existing `onNavigate` plumbing on `CustomLogTrendChart`).
- "Log New" button at the top of the page still works in By Type mode — opens the input dialog as today; if the dialog needs a target date it uses today.

## Why this lands the bloodwork problem too

- Bloodwork data is sparse and date-disconnected. By Type gives the user a "go look at all my labs" surface without forcing them to remember when they were collected.
- Panels from 10 months ago show up in the list naturally; no calendar hunting.
- The earlier idea of a separate "By Type" mode now collapses into the main view selector — one concept, not three.

## Implementation

Files touched:

- `src/pages/OtherLog.tsx`
  - Replace `ViewMode = 'date' | 'medication'` with `ViewMode = 'date' | 'by_type'`.
  - Replace the `showMedView` gating block with: the `Select` always shows both options. Migrate any persisted `'medication'` value in localStorage to `'by_type'`.
  - When `viewMode === 'by_type'`: hide `DateNavigation`, render the new `CustomLogByTypeView` component instead of `CustomLogEntriesView`.
  - "Log New" dropdown behavior is unchanged in both modes (it always opens the input dialog for the chosen type — in by-type mode the entry just lands on today's date).
  - Delete dead state: `selectedMedTypeId`, `activeTypeId`, the medication-specific branches of the Log New select. The input dialog's date-vs-type entry path can be simplified to always use `createEntry` against the current date.

- New `src/components/CustomLogByTypeView.tsx`
  - Maps over `sortedLogTypes` and renders one card per type.
  - For numeric/dual/medication: uses a small wrapper that calls `useCustomLogTrendSingle(typeId, name, value_type)` and renders `CustomLogTrendChart`.
  - For panel: uses `useBloodworkPanelsForType(logTypeId)` (new hook) and renders `BloodworkPanelRow` for each.
  - For text: shows last 5 entries with date + value.
  - Each card has a "+ Log" button that calls back into `OtherLog` to open the existing input dialog.

- New `src/hooks/useBloodworkPanelsForType.ts`
  - Mirrors `useBloodworkPanelsForDate` but filters by `log_type_id` across all dates, ordered by `collected_date desc nulls last, created_at desc`.

- `src/components/LogTemplatePickerDialog.tsx` — unrelated but bundled per earlier discussion: add `Bloodwork` to `PRIMARY_NAMES`. (Holding off the deeper tracked-analytes work; that comes after this view-selector change ships.)

- `src/lib/log-templates.ts` — add the `Bloodwork` template (`valueType: 'panel'`, icon `Droplet`).

## Migration / persistence

- On mount, read `localStorage['custom-log-view-mode']`; if it's `'medication'`, treat as `'by_type'` and rewrite the key. No DB migration needed — view mode is purely client state.

## Out of scope (still)

- Tracked-analytes table + pinning analytes to surface as custom charts in Trends. Re-visit once this view-selector lands and we see how the by-type panel browsing feels.
- Removing the `Document upload` option from `CreateLogTypeDialog` (Bloodwork as a template makes it redundant). Easy follow-up.

## Notes

- Per project memory: Custom = teal, compact list density, mobile-first dialogs. No new toasts.
- The `effectiveViewMode` fallback logic can be deleted — both modes are always available.
