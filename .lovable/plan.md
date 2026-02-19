
# Replace Inline Input with Dialog in "By Date" Mode

## Problem

In "By Date" mode, selecting a log type from the "Add custom log" dropdown triggers an inline expansion (`showInput = true`) that renders a `LogEntryInput` or `MedicationEntryInput` directly in the page, pushing all content below it down. This is disorienting.

"By Type" and "By Meds" modes already use a proper `<Dialog>` via `showInputDialog`. The fix is to route "By Date" mode through the same dialog path.

Similarly, editing entries in "By Date" mode currently only works for medications (via `MedicationEntryInput` in the edit dialog). Non-medication edits in "By Date" mode use inline cell editing — but the user wants consistent dialog-based creation at minimum, and the edit path should also use a dialog for non-medication types.

---

## Changes — all in `src/pages/OtherLog.tsx`

### 1. Change the "Add custom log" dropdown `onOpenChange` handler

**Current behavior**: when the dropdown closes with a valid selection, it sets `showInput = true`.

**New behavior**: set `showInputDialog = true` instead.

```ts
// Before
onOpenChange={(open) => {
  if (!open && effectiveTypeId && !createNewClickedRef.current) {
    setShowInput(true);  // ← inline
  }
  createNewClickedRef.current = false;
}}

// After
onOpenChange={(open) => {
  if (!open && effectiveTypeId && !createNewClickedRef.current) {
    setShowInputDialog(true);  // ← dialog
  }
  createNewClickedRef.current = false;
}}
```

### 2. Remove the entire inline input block

Delete the `{showInput && effectiveViewMode === 'date' && ...}` block (lines 327–375) from inside the `<section>`. The `showInput` state variable and all references to it can also be removed since it is no longer needed.

### 3. Fix `dialogType` resolution to include "By Date" mode

Currently `dialogType` is:
```ts
const dialogType =
  effectiveViewMode === 'medication'
    ? logTypes.find((t) => t.id === selectedMedTypeId)
    : selectedType;  // resolves for 'type' AND 'date', so this already works!
```

The `selectedType` already points to the right log type in Date mode (it's derived from `effectiveTypeId`). So the dialog will already render correctly for Date mode — no change needed here.

### 4. Ensure the dialog `onSuccess` also handles Date mode

The existing dialog submit handler for non-medication types (lines 536–544) calls `createTypeEntry` (from `useCustomLogEntriesForType`). This hook is keyed to `activeTypeId`, which is `null` in Date mode. The created entry wouldn't appear in the date view because the mutation invalidates the wrong query key.

The fix: in Date mode, use `createEntry` (from `useCustomLogEntries`, already used for inline) instead of `createTypeEntry`. The dialog submit handler needs to branch on `effectiveViewMode`:

- If `effectiveViewMode === 'date'`: call `createEntry.mutate({ log_type_id: dialogType.id, logged_date: dateStr, unit: ..., ...params })`
- Otherwise: call `createTypeEntry.mutate(...)` as today

### 5. Edit dialog — extend to non-medication types in "By Date" mode

Currently the edit dialog (lines 556–579) only renders `MedicationEntryInput`. For non-medication entries edited in Date view, editing is done inline in `CustomLogEntryRow`. The user's request is specifically about **creation** being dialog-based, so inline editing of existing entries via `CustomLogEntryRow` can stay as-is for now. No change needed to the edit path.

---

## Summary of changes

| What | Where | Change |
|---|---|---|
| Remove `showInput` state | `OtherLog.tsx` | Delete state var + all references |
| Dropdown `onOpenChange` | `OtherLog.tsx` line ~297 | `setShowInput(true)` → `setShowInputDialog(true)` |
| Remove inline input block | `OtherLog.tsx` lines 327–375 | Delete entire `{showInput && ...}` render block |
| Dialog submit for Date mode | `OtherLog.tsx` lines 536–544 | Branch: use `createEntry` in Date mode, `createTypeEntry` in Type/Meds mode |

No new components. No new dependencies. One file changed.
