
## Polish Custom Log Entry Inline Editing

### Changes (all in two files)

**File: `src/components/CustomLogEntryRow.tsx`**

1. **Text field width**: Add `min-w-[120px]` to the contentEditable span's wrapper so the focus ring has breathing room instead of cramping around short text.

2. **Numeric input -- centered text and narrower width**: Change the Input className from `w-20 text-right` to `w-[60px] text-center` to match the exercise page's lbs column (60px, centered). Keep the same focus-ring styling.

3. **No other visual changes** -- the row layout, unit label, delete button all stay as-is.

**File: `src/hooks/useCustomLogEntries.ts`**

4. **Optimistic updates for `updateEntry`**: Add an `onMutate` callback that:
   - Snapshots the current query data
   - Immediately patches the matching entry in the cache with the new `numeric_value` or `text_value`
   - Returns the snapshot for rollback
   - Add `onError` to roll back to the snapshot if the server call fails
   - Keep `onSuccess` invalidation so the cache re-syncs after the server confirms

This eliminates the visible lag between pressing Enter and seeing the updated value.

### Technical detail

**Numeric input class change** (CustomLogEntryRow.tsx):
```
Before: "h-7 w-20 text-sm text-right px-1 border-0 bg-transparent"
After:  "h-7 w-[60px] text-sm text-center px-1 border-0 bg-transparent"
```

**Text field min-width** (CustomLogEntryRow.tsx):
Add `min-w-[120px]` to the wrapping div around the contentEditable span.

**Optimistic update pattern** (useCustomLogEntries.ts):
```ts
updateEntry = useMutation({
  mutationFn: async (params) => { /* existing */ },
  onMutate: async (params) => {
    await queryClient.cancelQueries({ queryKey: ['custom-log-entries', dateStr] });
    const previous = queryClient.getQueryData(['custom-log-entries', dateStr]);
    queryClient.setQueryData(['custom-log-entries', dateStr], (old) =>
      old?.map(e => e.id === params.id ? { ...e, ...params } : e)
    );
    return { previous };
  },
  onError: (_err, _params, context) => {
    if (context?.previous) {
      queryClient.setQueryData(['custom-log-entries', dateStr], context.previous);
    }
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['custom-log-entries', dateStr] });
  },
});
```
