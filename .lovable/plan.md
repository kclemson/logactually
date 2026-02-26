

## Fix: Medication dose count shows 0 in "Show All" view mode

The dose count ("X of Y doses logged today") always shows 0 when opening a medication dialog from "Show All" mode because `todayMedEntries` derives from `useCustomLogEntriesForType(activeTypeId)`, and `activeTypeId` is `null` in date view mode.

The simplest fix: derive `todayMedEntries` from the date-scoped `entries` array (which already contains all entries for the selected date) filtered by `dialogType?.id`, instead of relying on `typeEntries` which requires a separate query.

### Changes

**`src/pages/OtherLog.tsx`** — 1 edit (lines 173-175):

Replace:
```typescript
const todayDateStr = format(new Date(), 'yyyy-MM-dd');
const todayMedEntries = typeEntries.filter((e) => e.logged_date === dateStr);
```

With:
```typescript
const todayMedEntries = dialogType
  ? entries.filter((e) => e.log_type_id === dialogType.id)
  : [];
```

This works because `entries` already contains all entries for `dateStr` (the selected date) across all log types. No new queries needed. The unused `todayDateStr` variable is also removed.

