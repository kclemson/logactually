## Goal

By Type expansion = By Date entries for that type, repeated for every date that has entries. No new per-type rendering code; reuse exactly what By Date already renders.

## Architectural insight

`CustomLogEntriesView` already knows how to render rows for any value_type (medication, numeric, dual_numeric, text, text_multiline, panel). The By Type expansion currently has *parallel* renderers (`MedicationSummary`, `TextHistory`, `CustomLogGroupTrend`) that drift from By Date. Replace them with a loop over dates that delegates to the same row code.

## Refactor

**1. Extract the per-(type, day) row block from `CustomLogEntriesView.tsx`**

Pull the JSX inside `visibleGroups.map(...)` — everything inside the `<div key={group.typeId}>` — into a new exported component:

```
<CustomLogTypeDayRows
  logType={CustomLogType}
  entries={CustomLogEntry[]}     // already filtered to this type+day
  dateStr={string}                // for BloodworkPanelGroup
  isReadOnly
  onDelete
  onEdit?
  onUpdate?
  showTypeHeader?: boolean        // default true; By-Type passes false
  showTrend?: boolean             // default true; By-Type passes false (parent card has its own context)
/>
```

`CustomLogEntriesView` then becomes a thin wrapper that groups entries and maps to `<CustomLogTypeDayRows>`. Zero visual change to By Date.

**2. Rewrite `CustomLogByTypeView.tsx` expansion**

Delete `MedicationSummary`, `TextHistory`, and the numeric-only `CustomLogGroupTrend` branch from `TypeBody`. Replace with a single uniform `<TypeBody>`:

- Fetch entries via `useCustomLogEntriesForType(logType.id)` (already sorted desc).
- For `panel`: keep `<PanelHistory>` as-is (panels aren't in `custom_log_entries`).
- For everything else:
  - Group entries by `logged_date` (preserves desc order).
  - Render an all-time trend chart at the top for numeric/dual_numeric (matches current behavior).
  - Then for each date: a small date header (`text-[11px] uppercase tracking-wide text-muted-foreground`, e.g. "May 22, 2026") followed by `<CustomLogTypeDayRows logType={logType} entries={dayEntries} dateStr={date} showTypeHeader={false} showTrend={false} ... />`.
  - Cap at the most recent N dates (e.g. 30) with a `+ M more dates` footer, since the hook already returns up to 500 entries.

**3. Plumb edit/delete callbacks through `CustomLogByTypeView`**

Add `onEditEntry` / `onDeleteEntry` props to `CustomLogByTypeView` (already pass `onLogNew`). In `OtherLog.tsx`, wire:
- `onEditEntry={(e) => setEditingEntry(e)}` (reuses existing dialog + `updateMedEntry`)
- `onDeleteEntry` calls the same mutation By Date uses

Cache invalidation already flows through `invalidateCustomLogCaches`, so both views refresh.

## Why this is better than the previous plan

- One renderer for medication rows, numeric rows, text rows, multiline rows — no parallel code per value_type.
- Adding a new value_type or tweaking a row layout updates both views automatically.
- By Type expansion stops being a special case and becomes a literal "By Date, ×N dates" view.

## Out of scope

- Visual redesign of either view's rows.
- Pagination beyond the date cap.
- Panel rendering changes.

## Verification

- Expand a medication type: see date-headed groups of dose rows identical to By Date.
- Expand a numeric type: trend at top, then date-headed value rows (a new affordance, but consistent with the framing).
- Edit / delete from an expanded row updates both views.
- By Date view itself looks and behaves identically to before.
