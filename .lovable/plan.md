

# Fix: Portion text should not be clickable when table is non-editable

## The bug

The portion button (e.g., "(1 medium banana)") opens the portion scaling stepper even in read-only table contexts like SaveMealDialog, SimilarEntryPrompt, and FoodEntryCard.

## Approach: Render as span when not editable

In the non-editable description cell (line ~464-473 of `FoodItemsTable.tsx`), conditionally render the portion as a plain `<span>` instead of a `<button>` when `editable` is false. This removes the click handler and pointer cursor entirely.

The editable branch (main Food Log) is unchanged.

```
// Current (always a button):
<button onClick={...} className="... cursor-pointer hover:text-foreground ...">
  ({item.portion})
</button>

// After (span when not editable, button when editable):
{editable ? (
  <button onClick={...} className="... cursor-pointer hover:text-foreground ...">
    ({item.portion})
  </button>
) : (
  <span className="ml-1 text-xs text-muted-foreground whitespace-nowrap">
    ({item.portion})
  </span>
)}
```

## File changed

| File | Change |
|---|---|
| `src/components/FoodItemsTable.tsx` | Line ~464-473: wrap portion rendering in an `editable` ternary -- button when editable, span when not |

## Verification

1. Food Log: tap a portion -- stepper should still open and work normally
2. "Save as meal" dialog: portion text should display but not be clickable
3. Settings saved meals: same, plain text
4. History page (FoodEntryCard): same, plain text
5. SimilarEntryPrompt: same, plain text

