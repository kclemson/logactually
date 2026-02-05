

## Plan: Remove Nested Wrapper in Save Dialogs (Step 1 of 2)

### Goal
Remove the extra border/padding wrapper around each entry table in the Save dialogs. This is a dialog-only change with zero impact on shared components.

### Changes

#### SaveMealDialog.tsx

**Line 151-154** - Remove wrapper styling:
```tsx
// Before
<div 
  key={entry.entryId} 
  className="rounded border border-border/50 p-1.5"
>

// After
<div key={entry.entryId}>
```

#### SaveRoutineDialog.tsx

**Line 177-180** - Same change:
```tsx
// Before
<div 
  key={entry.entryId} 
  className="rounded border border-border/50 p-1.5"
>

// After
<div key={entry.entryId}>
```

### Files Modified

| File | Change |
|------|--------|
| `src/components/SaveMealDialog.tsx` | Remove `rounded border border-border/50 p-1.5` from entry wrapper |
| `src/components/SaveRoutineDialog.tsx` | Remove `rounded border border-border/50 p-1.5` from entry wrapper |

### What to Test

After this change, open both Save dialogs with multiple entries from today and verify:
- Entries are still visually separated (via `space-y-3` gap)
- Less cramped appearance without nested borders
- Checkboxes still align properly with content

### Next Step

Once you've reviewed this baseline, we can evaluate the shared component compact padding changes by looking at all usages:
- SaveMealDialog (compact=true)
- SaveRoutineDialog (compact=true)
- SimilarEntryPrompt (compact=true)

...at various viewport widths including mobile.

