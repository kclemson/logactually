
## Two fixes: show all times, and live-update the edited entry's time

### Fix 1 — Show all doses (including the one being edited) in the count and times list

**Current behavior:** `editingTodayEntries` filters out `e.id !== editingEntry?.id`, so when you have 2 Compazine doses and open either one, the other entries array has length 1 → shows "1 of 2 doses logged today" with only 1 timestamp.

**Fix:** In `src/pages/OtherLog.tsx` lines 109–112, remove the `id` exclusion from `editingTodayEntries` — include all entries for that date:

```ts
const editingTodayEntries = editingTypeEntries.filter(
  (e) => e.logged_date === dateStr
);
```

Then update the props passed to the edit dialog (lines 411–412):

```tsx
todayEntryCount={editingTodayEntries.length}
todayLoggedTimes={editingTodayEntries.map(e => e.dose_time).filter(Boolean) as string[]}
```

This shows the full "2 of 2 doses logged today: 8:00 AM · 1:00 PM" regardless of which dose is being edited.

---

### Fix 2 — Dynamically update the edited entry's time in the status line

**Current behavior:** `todayLoggedTimes` is a static prop array. Changing the time picker updates `timeValue` in local state, but `doseCountLine` is computed from the static prop — so the old time stays in the list until the entry is saved and the query refetches.

**Fix:** In `src/components/MedicationEntryInput.tsx`, the component needs to know which entry in the `todayLoggedTimes` list belongs to the entry being edited, so it can substitute the live `timeValue` for it.

Add one new prop `initialTimeInList?: string | null` — the original `dose_time` value of the entry being edited (i.e., what's currently stored in the DB). When building `doseCountLine`, replace the matching time in `todayLoggedTimes` with the current `timeValue`:

```ts
// Swap the stored time of the entry being edited with the live timeValue
const displayTimes = todayLoggedTimes?.map(t =>
  t === initialTimeInList ? timeValue : t
) ?? [];
```

In `OtherLog.tsx`, pass the extra prop:
```tsx
initialTimeInList={editingEntry.dose_time}
```

**Why `initialTimeInList` and not just `entryId`?** The times list contains raw `HH:mm` strings — there's no ID attached. Using the original stored time as the match key is the natural pivot, and it's already available as `editingEntry.dose_time`. Edge case: if two doses share the exact same `HH:mm`, only the first match will be replaced — this is acceptable, as the user is actively editing one of them.

---

### Files to change

| File | Lines | Change |
|---|---|---|
| `src/pages/OtherLog.tsx` | 109–112, 411–413 | Remove `id` exclusion; pass `initialTimeInList` prop |
| `src/components/MedicationEntryInput.tsx` | prop interface + `doseCountLine` computation | Add `initialTimeInList` prop; swap live time in display list |
