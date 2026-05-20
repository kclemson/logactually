## Goal

Show the all-time trend chart inline within the day's custom log list, beneath each group whose type is chartable (`numeric` or `dual_numeric`) — the same chart that currently appears under the entry dialog. Medication, text, dual-text, and multiline types stay unchanged (they aren't chartable).

## Where it goes

Inside `CustomLogEntriesView`, immediately under each group's entry rows (above the next group's header). One chart per chartable type group, only when the group has at least one rendered entry. No new headers, no toggles — it just appears, matching the dialog treatment.

```text
Weight                     ← existing group header
 8:14 AM   182 lbs         ← existing entries
 7:02 AM   181 lbs
[ trend chart ]            ← NEW — same component as dialog
─────────────
Blood Pressure
 …
```

## Implementation

1. **New tiny wrapper** `src/components/CustomLogGroupTrend.tsx`
   - Props: `logType: CustomLogType`
   - Calls `useCustomLogTrendSingle(logType.id, logType.name, logType.value_type)` (already gates on chartable types — returns `null`/disabled otherwise)
   - Renders `<CustomLogTrendChart trend={trend} onNavigate={() => {}} />` inside a `mt-2 border-t border-border/50 pt-2` wrapper when `trend` exists, else nothing
   - Hook is keyed per type, so each group gets its own query (cached, cheap)

2. **`CustomLogEntriesView.tsx`** — render `<CustomLogGroupTrend logType={logType} />` after the entry rows in each non-medication group when `logType?.value_type` is `'numeric'` or `'dual_numeric'`. Skip when `medicationsOnly` mode is on (no chartable types pass that filter anyway).

3. No changes to OtherLog, the existing dialog inline trend, hooks, or backend.

## Notes

- Reuses the existing `useCustomLogTrendSingle` hook and `CustomLogTrendChart` component — no new fetching code or chart logic.
- Cache key already includes `logTypeId`, so the dialog's chart and the inline chart share data with zero extra requests when both are visible.
- Read-only / demo users see the chart too (read-only by design — matches dialog behavior).