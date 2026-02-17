

# Settings Refactor: Unified SavedItemRow for All Three Row Types

## Approach

Create a single `SavedItemRow` component that all three settings row types flow through, with an optional expander flag. This unifies the codepath so that when `DescriptionCell` is introduced later, the name-editing logic only needs to change in one place.

## Layout Model

All three row types share this structure:

```text
[chevron?] [editable name] [meta slot] [delete button]
            optional children when expanded
```

- **Saved Meals**: chevron + name + "3 items" + delete, expands to FoodItemsTable
- **Saved Routines**: chevron + name + "2 exercises" + delete, expands to WeightItemsTable
- **Custom Log Types**: no chevron + name + "numeric (kg)" badge + delete, no expansion

## Files Changed

### 1. New: `src/components/DeleteConfirmPopover.tsx` (~45 lines)

Extracts the identical trash-icon-with-confirmation-popover used in all three rows.

Props:
- `id`, `label`, `description` -- what to show in the confirmation
- `onDelete` -- callback
- `openPopoverId` / `setOpenPopoverId` -- shared open-state pattern

### 2. New: `src/components/SavedItemRow.tsx` (~80 lines)

Shared row shell with optional expansion.

Props:
- `id`, `name` -- item identity
- `onUpdateName(newName)` -- save callback
- `onDelete()` -- delete callback
- `deleteConfirmLabel`, `deleteConfirmDescription` -- confirmation text
- `expandable?: boolean` -- whether chevron shows (default true)
- `isExpanded?`, `onToggleExpand?` -- expansion state (ignored when not expandable)
- `meta?: ReactNode` -- slot for item count or value-type badge
- `openDeletePopoverId` / `setOpenDeletePopoverId` -- popover coordination
- `children?: ReactNode` -- expanded content
- `existingNames?: string[]` -- for duplicate name validation

Internals:
- `useRef` for name rollback (replaces `dataset.original` hack in all three files)
- Uses `DeleteConfirmPopover`
- Conditionally renders chevron based on `expandable`

### 3. Refactor: `SavedMealRow.tsx` (~40 lines, down from ~210)

- Remove `localItems` state and `useMemo` side effect
- Keep `itemsWithUids` memo (still needed for uid generation)
- `handleUpdateItem` / `handleRemoveItem` compute new items array and call `onUpdateMeal` directly
- Render `SavedItemRow` with `expandable` (default true), pass item count as `meta`, `FoodItemsTable` as children

### 4. Refactor: `SavedRoutineRow.tsx` (~45 lines, down from ~200)

Same treatment as SavedMealRow but with `WeightItemsTable` as children.

### 5. Refactor: `CustomLogTypeRow.tsx` (~30 lines, down from ~150)

- Uses `SavedItemRow` with `expandable={false}`
- Passes value-type badge + unit as `meta` slot
- No children (nothing to expand)
- Duplicate name validation via `existingNames` prop (same as current)

## Anti-Patterns Fixed

| Issue | Where | Fix |
|---|---|---|
| `dataset.original` DOM hack | All 3 rows | `useRef` in SavedItemRow |
| `useMemo` as side effect | Meal + Routine | Removed entirely |
| Redundant `localItems` state | Meal + Routine | Data flows from props/cache |
| Duplicated delete popover | All 3 rows | `DeleteConfirmPopover` |
| Duplicated contentEditable logic | All 3 rows | Single implementation in SavedItemRow |

## Why This Sets Up DescriptionCell

When the column model and `DescriptionCell` arrive, the editable name logic inside `SavedItemRow` is the single place to swap. All three row types -- meals, routines, and custom log types -- get the upgrade at once without touching their individual wrapper components.

## Net Impact

- ~560 lines across 3 files reduces to ~240 lines across 5 files (including the 2 new shared components)
- Single codepath for all settings rows
- All identified anti-patterns eliminated

