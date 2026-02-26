

## Refined: Add inline trend chart to custom log entry input

### Guard: chartable types

Only `numeric` and `dual_numeric` log types get the inline chart. Medication and text types are excluded — medication has no trend chart support, and text charts aren't useful in this context.

### Changes

**1. New hook: `src/hooks/useCustomLogTrendSingle.ts`**
- Accepts `logTypeId` and `valueType`
- Only enabled when `valueType` is `numeric` or `dual_numeric`
- Queries `custom_log_entries` for that single type (all time, no date filter)
- Returns a single `CustomLogTrendSeries` matching the existing format from `useCustomLogTrends`

**2. Edit: `src/pages/OtherLog.tsx`**
- Import the new hook and `CustomLogTrendChart`
- Below `<LogEntryInput>` / `<MedicationEntryInput>`, render `<CustomLogTrendChart>` if:
  - `dialogType.value_type` is `numeric` or `dual_numeric`
  - The hook returned at least one data point
- Pass `onNavigate` as no-op (chart is view-only in this context)
- Small `mt-3 border-t pt-3` container

No changes to existing components. Additive only.

