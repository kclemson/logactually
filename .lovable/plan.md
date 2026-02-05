
## What’s happening (root cause)
Clicking **“Save as routine”** *is* calling the handler, but it throws a runtime error before it can set the dialog state:

- Error in console: **RangeError: Invalid time value**
- Location: `src/pages/WeightLog.tsx` inside `handleSaveAsRoutine`
- Why: the code tries to do `new Date(<uuid>).toISOString()` (it mistakenly feeds a UUID `id` into `Date()`), which produces an invalid date and throws. Because the exception happens inside the click handler, React never reaches `setSaveRoutineDialogData(...)`, so the dialog never opens and it looks like “nothing happens”.

This is why it doesn’t reproduce on the food page: food entries have a real `created_at` at the **entry** level (`entries.find(...).created_at`), but weights are modeled as multiple rows (`weight_sets`) and we currently don’t carry a reliable timestamp for “the entry” in the UI type.

## Implementation plan (safe + aligned with the food pattern)
### 1) Fix the immediate crash (unblock the button)
**File:** `src/pages/WeightLog.tsx`  
- Remove the broken `createdAt` calculation that calls `toISOString()` on an invalid date.
- Set `saveRoutineDialogData` without any risky date logic, so the dialog opens reliably.

This alone will make the “Save as routine” click work again.

### 2) Make weights follow the same “prioritize adjacent earlier entries” sorting as food (proper fix)
To support the “Add more from today” sorting logic safely, we need a real timestamp per set:

**A. Add an optional timestamp to the UI type**
**File:** `src/types/weight.ts`  
- Add `createdAt?: string` (optional) to `WeightSet`.
  - Optional keeps this change non-breaking for objects created from analysis, demo previews, etc.

**B. Populate it when mapping DB rows → UI rows**
**File:** `src/hooks/useWeightEntries.ts`  
- When mapping `WeightSetRow` into `WeightSet`, set `createdAt: row.created_at`.

**C. Compute an entry-level createdAt from its sets**
**File:** `src/pages/WeightLog.tsx`  
- In `handleSaveAsRoutine`, compute `createdAt` as the earliest `createdAt` among the sets in the clicked entry (or just use the first set since the query is ordered by `created_at`).
- Store that in `saveRoutineDialogData.createdAt`.

**D. Sort `otherEntriesForRoutineDialog` like the food page**
**File:** `src/pages/WeightLog.tsx`  
- Build `otherEntriesForRoutineDialog` from grouped entries, but sort them relative to the current entry:
  - entries before current first (newest-first)
  - then entries after current (oldest-first)

### 3) Verify no regressions
- On `/weights`, expand **Treadmill** → click “Save as routine” → dialog opens.
- Expand **Bench Press** → click “Save as routine” → dialog opens.
- Confirm entries that *are* from a saved routine still show “From saved routine …” (and not the save button).
- Confirm the food page behavior is unchanged.
- Confirm no console error appears on click.

## Why this plan is low-risk
- Step (1) removes a clearly incorrect date conversion that is currently crashing.
- Step (2) adds a purely additive, optional field and uses existing DB timestamps already available in the weight_sets rows.
- No backend/database changes.
- No `useEffect`-based state syncing; everything stays in event handlers + derived `useMemo` (consistent with your guidelines).
