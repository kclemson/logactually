

# Fix: Match Group Header DescriptionCell Pattern to Individual Items

## Root Cause
Individual item descriptions work because overflow control is on a **wrapper div**, not on the `contentEditable` span itself. Group headers broke because `truncate` (and before that `line-clamp-1`) was applied directly to the `DescriptionCell` span via its `className` prop, which conflicts with `contentEditable`.

## How Individual Items Work (the correct pattern)
```
<div class="flex-1 min-w-0 overflow-hidden max-h-[3rem] ...">  <-- overflow on wrapper
  <DescriptionCell value={...} />                               <-- no className, no truncate
</div>
```

The span wraps naturally, the wrapper clips overflow, and `contentEditable` works perfectly.

## Fix
Apply the same pattern to both group header locations: move overflow control to a wrapper div and remove `truncate`/`shrink`/`min-w-0` from the `DescriptionCell` className.

## Technical Details

### `src/components/FoodItemsTable.tsx` -- two locations (collapsed ~line 365, expanded ~line 532)

**Before:**
```
<DescriptionCell
  className="pl-1 pr-0 py-1 truncate shrink min-w-0"
  ...
/>
```

**After:**
```
<div class="flex-1 min-w-0 overflow-hidden max-h-[1.5rem] pl-1 py-1">
  <DescriptionCell
    value={groupName}
    ...
  />
</div>
```

- `max-h-[1.5rem]` keeps it single-line (group headers should stay compact), matching the truncation intent without breaking `contentEditable`
- `flex-1 min-w-0` lets the wrapper shrink in flex layout, keeping the portion button visible
- The `DescriptionCell` itself gets no overflow classes -- just like individual items

### Flicker fix -- `src/pages/FoodLog.tsx`

Change both `onUpdateGroupName` and `onUpdateEntryPortionMultiplier` handlers: replace `onSettled` with `onSuccess` that awaits query invalidation before clearing optimistic state. This prevents the old server value from briefly showing between the optimistic clear and the refetch.

| File | Change |
|------|--------|
| `src/components/FoodItemsTable.tsx` | Wrap group header `DescriptionCell` in overflow div (same pattern as individual items), remove `truncate` from span |
| `src/pages/FoodLog.tsx` | Fix flicker: await invalidation before clearing optimistic state |

