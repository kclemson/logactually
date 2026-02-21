

# Drag-and-Drop Reordering for My Charts

## Overview
Enable users to reorder their saved charts by dragging them when edit mode is active. The database already has a `sort_order` column on `saved_charts`, so this is purely a frontend change plus a small mutation.

## Approach
Use native HTML5 drag-and-drop (no new dependencies). When in edit mode, each chart card gets a drag handle and becomes draggable. Dropping a chart in a new position updates the local order optimistically and persists the new `sort_order` values to the database.

## Changes

### 1. `src/hooks/useSavedCharts.ts` -- Add reorder mutation
Add a `reorderMutation` that accepts an array of `{ id, sort_order }` pairs and batch-updates them via multiple `.update()` calls (or a single RPC if preferred). Use optimistic updates on the `["saved-charts"]` query cache for instant feedback.

### 2. `src/pages/Trends.tsx` -- Wire up drag-and-drop in the My Charts grid
- Add local state to track `dragIndex` and `dragOverIndex`
- When `isEditMode` is true, render each chart wrapper as `draggable` with a visible drag handle (grip icon)
- On `dragEnd`, compute the new order, update local state, and call `reorderMutation`
- Show a visual insertion indicator (border highlight) on the drop target

### 3. Visual treatment
- In edit mode, add a small grip/drag-handle icon (using Lucide `GripVertical`) to each chart card's header alongside the existing edit/delete buttons
- Apply a subtle opacity or scale transform to the card being dragged
- On touch devices, the grip handle initiates the drag (prevents conflict with chart interactions)

## Technical Details

Reorder mutation (in `useSavedCharts.ts`):
```typescript
const reorderMutation = useMutation({
  mutationFn: async (items: { id: string; sort_order: number }[]) => {
    const updates = items.map(({ id, sort_order }) =>
      supabase.from("saved_charts").update({ sort_order }).eq("id", id)
    );
    const results = await Promise.all(updates);
    const err = results.find(r => r.error);
    if (err?.error) throw err.error;
  },
  onMutate: async (items) => {
    await queryClient.cancelQueries({ queryKey: ["saved-charts"] });
    // optimistic reorder in cache
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ["saved-charts"] }),
});
```

Drag logic (in `Trends.tsx`):
- Wrap each chart in a `div` with `draggable={isEditMode}`, `onDragStart`, `onDragOver`, `onDrop`
- On drop, splice the dragged chart into its new position and assign sequential `sort_order` values (0, 1, 2, ...)
- Call `reorderMutation.mutate(newOrder)`

## Files Modified
- `src/hooks/useSavedCharts.ts` -- add `reorderMutation`
- `src/pages/Trends.tsx` -- add drag state, handlers, drag handle UI in edit mode

No database changes needed (sort_order column already exists).

