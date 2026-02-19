
## Show dose count in the edit dialog

### Root cause

The edit dialog already passes `todayEntryCount` and `todayLoggedTimes` to `MedicationEntryInput`, but those values come from `todayMedEntries`, which is derived from:

```ts
const activeTypeId = viewMode === 'medication' ? selectedMedTypeId : null;
const { entries: typeEntries } = useCustomLogEntriesForType(activeTypeId);
const todayMedEntries = typeEntries.filter(e => e.logged_date === dateStr);
```

When the user edits a medication entry from "Show All" view, `viewMode` is `'date'`, so `activeTypeId` is `null`. `useCustomLogEntriesForType(null)` returns an empty array, so `todayMedEntries` is always `[]` — the dose count line never renders.

### Fix

Introduce a second `useCustomLogEntriesForType` call scoped to the entry being edited. This hook is cheap (query is only enabled when `editingEntry` is non-null) and already exists in the codebase.

In `src/pages/OtherLog.tsx`:

1. Add a second hook call for the editing context:
```ts
const { entries: editingTypeEntries } = useCustomLogEntriesForType(
  editingEntry?.log_type_id ?? null
);
```

2. Derive `editingTodayEntries` from that result, excluding the entry currently being edited (so the count reflects the other logged doses, not counting the one being replaced):
```ts
const editingTodayEntries = editingTypeEntries.filter(
  (e) => e.logged_date === dateStr && e.id !== editingEntry?.id
);
```

3. Pass these to the edit dialog instead of the shared `todayMedEntries`:
```tsx
todayEntryCount={editingTodayEntries.length}
todayLoggedTimes={editingTodayEntries.map(e => e.dose_time).filter(Boolean) as string[]}
```

### Why exclude the entry being edited from the count?

When editing a dose (e.g., you logged 3 doses but are editing one), the status line should show "2 of 3 doses logged" (the other doses), not "3 of 3" — which would be misleading because the entry under edit hasn't been re-saved yet with new values. This makes the count read as "how many *other* doses are already on the books."

### One consideration: color threshold

With the editing entry excluded from the count, the maximum `editingTodayEntries.length` can be is `dosesPerDay - 1`, so the "green at complete" threshold (`<= dosesPerDay`) is still correct — it just means the count will show green once *all other* doses are logged.

### Files to change

| File | Change |
|---|---|
| `src/pages/OtherLog.tsx` | Add `useCustomLogEntriesForType` call for `editingEntry?.log_type_id`, derive `editingTodayEntries`, pass to edit dialog |

No changes to `MedicationEntryInput.tsx` — the component already renders the dose count line correctly from its existing props.
