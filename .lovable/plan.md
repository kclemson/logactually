

# Fix: Enable Inline Editing of Group Names

## Problem
The group header name (e.g., "stuffed turkey dinner with sides") is rendered as a plain `<span>`, so tapping/clicking it does nothing. Users expect to be able to edit it inline, consistent with how individual item descriptions work via `DescriptionCell`.

## Solution
Replace the plain `<span>` with the existing `DescriptionCell` component in both locations (collapsed header and expanded header), and wire up an `onUpdateGroupName` callback that persists the change via `updateEntry`.

## Technical Details

### `src/components/FoodItemsTable.tsx`

1. Add a new prop: `onUpdateGroupName?: (entryId: string, newName: string) => void`

2. In both the collapsed group header (around line 362) and the expanded group header (around line 525), replace the plain `<span>` that displays `groupName` with a `DescriptionCell`:
   - `value={groupName}`
   - `onSave={(newName) => onUpdateGroupName?.(boundary.entryId, newName)}`
   - `readOnly={isReadOnly}` / `onReadOnlyAttempt={triggerOverlay}`
   - Keep the portion scaling button as a `children` prop of `DescriptionCell`

3. The existing `DescriptionCell` handles Enter/Escape/blur commit/revert, empty-string rejection, and contentEditable -- no new components needed.

### `src/pages/FoodLog.tsx`

1. Add an `onUpdateGroupName` handler that calls `updateEntry.mutate({ id: entryId, group_name: newName })`.

2. Add optimistic state (same pattern as `optimisticMultipliers`) so the name updates instantly in the UI while the server save happens in the background. Merge optimistic names into the `entryGroupNames` map.

3. Pass `onUpdateGroupName` to `FoodItemsTable`.

| File | Change |
|------|--------|
| `src/components/FoodItemsTable.tsx` | Add `onUpdateGroupName` prop; replace plain `<span>` with `DescriptionCell` in both collapsed and expanded header locations |
| `src/pages/FoodLog.tsx` | Add optimistic state + handler for group name updates; pass callback to table |

