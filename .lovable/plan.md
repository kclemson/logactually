

# Show delete icon on expanded exercise group headers

## Problem

When an exercise group is expanded, the group header renders an empty `<span></span>` in the delete column (line 442) instead of the delete button with confirmation dialog. The collapsed group header correctly shows the delete icon (lines 371-401). This was already fixed for the food log but the exercise log was missed.

## Fix

**`src/components/WeightItemsTable.tsx`** -- line 442

Replace:
```tsx
{hasDeleteColumn && <span></span>}
```

With the same AlertDialog delete button used by the collapsed group header (lines 372-401), which includes:
- The trash icon button (with `md:opacity-0 md:group-hover:opacity-100` for hover-reveal on desktop)
- The confirmation AlertDialog showing the group name and exercise count
- The `onDeleteEntry` callback on confirm

This is a single-line-to-block replacement in one file.
