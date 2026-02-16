

# Phase 2: Migrate FoodItemsTable to EntryExpandedPanel

## What changes

Replace lines 677-734 of `FoodItemsTable.tsx` (~57 lines of inline expanded panel JSX) with a call to the shared `EntryExpandedPanel` component (~12 lines).

## Current Food panel code (lines 677-734)

The inline code does:
1. Looks up `isFromSavedMeal` via `entrySourceMealIds?.has(currentEntryId)`
2. Looks up `mealName` via `entryMealNames?.get(currentEntryId)`
3. Renders "Logged as: {rawInput}" (hidden when from saved meal)
4. Renders "From saved meal: {Name}" link or "Save as meal" button
5. Renders `DeleteGroupDialog`

This is structurally identical to what `EntryExpandedPanel` already handles (validated in Phase 1 with Weight).

## The migration

Replace the inline IIFE block (lines 677-734) with:

```tsx
{showEntryDividers && isLastInEntry && isCurrentExpanded && (() => {
  const isFromSavedMeal = currentEntryId && entrySourceMealIds?.has(currentEntryId);
  const mealName = currentEntryId && entryMealNames?.get(currentEntryId);
  const entryItems = items.filter(i => i.entryId === currentEntryId);

  return (
    <EntryExpandedPanel
      items={entryItems}
      rawInput={currentRawInput ?? null}
      savedItemInfo={{
        type: 'meal',
        name: mealName ?? null,
        isFromSaved: !!isFromSavedMeal,
      }}
      onSaveAs={onSaveAsMeal && currentEntryId
        ? () => onSaveAsMeal(currentEntryId!, currentRawInput ?? null, entryItems)
        : undefined}
      onDeleteEntry={onDeleteEntry && currentEntryId
        ? () => onDeleteEntry(currentEntryId!)
        : undefined}
      gridCols={gridCols}
    />
  );
})()}
```

No `extraContent` needed (Food has no calorie burn estimates).

## One normalization

The Food "Save as meal" button currently uses `underline` instead of `hover:underline`. After migration it will use `hover:underline` (matching the shared component). This is the only visual change -- the underline appears on hover instead of always being visible.

## Files changed

| File | Change |
|---|---|
| `src/components/FoodItemsTable.tsx` | Add import for `EntryExpandedPanel`, replace lines 677-734 with the component call above |

## What does NOT change

- Everything else in FoodItemsTable (item rows, editing, portion scaling, totals)
- EntryExpandedPanel.tsx itself (no modifications needed)
- WeightItemsTable.tsx (already migrated in Phase 1)

## Test cases

1. Multi-item food entry: click chevron, verify "Logged as", "Save as meal", and "Delete this group" all appear
2. Single-item food entry: click chevron, verify "Logged as" appears, "Delete this group" is hidden
3. Entry from saved meal: verify "From saved meal: {Name}" link appears, "Logged as" is hidden
4. Entry from deleted saved meal: verify "(deleted)" text appears
5. Click "Save as meal": verify dialog opens with correct items
6. Click saved meal name link: verify navigation to /settings

