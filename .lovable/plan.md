

# Collapsed Group Rows for Exercise Log

## Summary

Add collapsed group headers for multi-exercise entries in the Weight Log, following the same shared architecture and editable group names already used by the Food Log. New groups auto-expand so the user sees their exercises immediately after logging.

## What the user sees

- **Single-exercise entries**: No change, render flat as today
- **Multi-exercise entries** (2+ exercises sharing an entry_id): Show a collapsed header row with chevron, editable group name, and "N exercises" label spanning the numeric columns
- **Newly logged groups**: Auto-expand to show all exercises (unlike Food Log which collapses by default)
- **Expanding a group**: Shows individual exercise rows normally, plus the existing expanded panel (Logged as, Save as routine, Delete group)
- **Editing group names**: Tap the group name to rename it inline, same as the food log -- uses the shared `DescriptionCell` component

## Group name (priority order for initial value)

1. Saved routine name (from existing `entryRoutineNames` map)
2. Raw input text (from existing `entryRawInputs` map)
3. First exercise description as fallback

## Technical changes

### 1. Database: Add `group_name` column to `weight_sets`

Add a nullable `group_name` text column to `weight_sets`. This follows the same pattern as `raw_input` -- stored on the first row of each entry group, null on subsequent rows. No RLS changes needed (existing policies cover all columns).

```sql
ALTER TABLE weight_sets ADD COLUMN group_name text;
```

### 2. WeightLog.tsx -- Build `entryGroupNames`, wire up name editing, auto-expand

- Build `entryGroupNames` as a `Map<string, string>` from multi-item boundaries, checking: saved routine name, then `group_name` from DB (new column), then raw input, then first exercise description
- Add `updateGroupName` callback that updates the `group_name` column on the first `weight_set` row for that `entry_id` (with optimistic state, same pattern as `useGroupPortionScale`)
- On entry creation (`createEntryFromExercises`): if 2+ exercises, set `group_name` on the first row (routine name or raw input) and add entry to `expandedEntryIds`
- Pass `entryGroupNames` and `onUpdateGroupName` props to `WeightItemsTable`

### 3. WeightItemsTable.tsx -- Add collapsed/expanded group rendering with editable names

Add new props: `entryGroupNames?: Map<string, string>` and `onUpdateGroupName?: (entryId: string, newName: string) => void`.

Adopt the same IIFE rendering pattern from `FoodItemsTable`:

- Build `collapsedGroupIndices` set and `groupHeaders` array from boundaries + group names (reusing shared `isMultiItemEntry` from `entry-boundaries.ts`)
- **Collapsed group row**: 
  - Chevron (collapsed) via shared `EntryChevron`
  - Editable group name via shared `DescriptionCell` (calls `onUpdateGroupName`)
  - "N exercises" as `col-span-3` italic muted text spanning Sets/Reps/Weight columns
  - Delete button with AlertDialog confirmation
- **Expanded group header**: Same layout but chevron rotated; individual items render below normally via existing code
- Skip rendering individual items whose indices are in `collapsedGroupIndices`
- When a group has a header, suppress the per-item chevron on the last row

Uses shared components already imported: `EntryChevron`, `EntryExpandedPanel`, `DescriptionCell`, `isMultiItemEntry`, `isEntryNew`, `getEntryHighlightClasses`.

### 4. useWeightEntries.ts -- Add `updateGroupName` mutation

Add a function that updates `group_name` on the first `weight_set` row matching the given `entry_id` (ordered by `created_at`). This mirrors the food log's `updateEntry` pattern but scoped to a single column on the first row.

### 5. Types update

Add `group_name?: string | null` to the `WeightSet` and `WeightSetRow` interfaces in `src/types/weight.ts`.

## Risk assessment

Low risk -- all grouping/boundary logic reuses `entry-boundaries.ts`, all UI components are shared (`EntryChevron`, `DescriptionCell`, `EntryExpandedPanel`), and the IIFE rendering pattern is proven in `FoodItemsTable`. The only new element is the `group_name` column and its persistence, which follows the exact same pattern as `raw_input`.

