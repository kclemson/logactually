

# Fix: Stale Pending Edits Override Group Scaling

## Problem

When the user edits a child item's calories inline (e.g., 200 to 300) and then scales the parent group (e.g., 1.5x), the child item's calories should become 450 but instead stay at 300.

## Root Cause

The `useEditableItems` hook stores inline edits in a `pendingEdits` map (keyed by item UID). These pending edits are never automatically cleared after a successful save. The flow:

1. User edits child calories: `pendingEdits` stores `{calories: 300}` for that item's UID
2. Save fires, DB now has 300, query refetches with 300
3. `displayItems` = query data (300) + pending edit (300) = 300 (looks correct)
4. User scales group by 1.5x: `scaleGroupPortion` reads `displayItems` (300), scales to 450, saves
5. Query refetches with 450
6. `displayItems` = query data (450) + **stale pending edit (300)** = **300** -- bug!

The pending edit from step 1 is never cleared, so it permanently overrides any subsequent changes to that item's calories from other sources (like group scaling).

## Fix

In `useGroupPortionScale.scaleGroupPortion`, after building the scaled items, clear all pending edits for items in that entry. This requires passing a `clearPendingForItem` function from `useEditableItems` into the hook.

### 1. `src/hooks/useGroupPortionScale.ts`

- Add `clearPendingForItems: (uids: string[]) => void` to the options interface
- In `scaleGroupPortion`, call `clearPendingForItems` with all item UIDs before firing the mutation

### 2. `src/pages/FoodLog.tsx`

- Destructure `clearPendingForItem` from `useEditableFoodItems`
- Create a small wrapper `clearPendingForItems` that calls `clearPendingForItem` for each UID
- Pass it to `useGroupPortionScale`

### 3. `src/hooks/useEditableItems.ts`

No changes needed -- `clearPendingForItem` already exists and does exactly what we need.

## Technical Details

```text
useEditableFoodItems (existing)
  --> clearPendingForItem(uid)  // already exists, clears pendingEdits for one item

useGroupPortionScale (updated)
  --> receives clearPendingForItems callback
  --> scaleGroupPortion() calls it before mutating, clearing stale edits
```

| File | Change |
|------|--------|
| `src/hooks/useGroupPortionScale.ts` | Add `clearPendingForItems` to options; call it in `scaleGroupPortion` before the mutation |
| `src/pages/FoodLog.tsx` | Destructure `clearPendingForItem` from `useEditableFoodItems`; create wrapper; pass to hook |

