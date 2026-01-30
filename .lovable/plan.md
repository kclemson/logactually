

## Update Saved Meal/Routine Link Formatting

Simplify the formatting for saved meal/routine links in both food and weight tables to remove redundancy and improve readability.

### Current State

Both tables currently show:
- Raw input in italics (e.g., "lat pulldown 3x10 65")
- Then below: "Saved routine: Lat Pulldown (3x10x65)" or "Saved meal: Yogurt + strawberries"

This is redundant since the raw input already provides context.

### New Format

Change to a cleaner format with the entire line in italics:
- *From saved meal: [NameLink]*
- *From saved routine: [NameLink]*

Where the name is a clickable link to `/settings`.

---

### Changes

**1. FoodItemsTable.tsx**

Add `Link` import from `react-router-dom` and update the saved meal display:

```tsx
// Add to imports
import { Link } from 'react-router-dom';

// Update lines 626-629
{currentEntryId && entryMealNames?.get(currentEntryId) ? (
  <p className="text-sm text-muted-foreground italic">
    From saved meal:{' '}
    <Link 
      to="/settings" 
      className="text-blue-600 dark:text-blue-400 hover:underline not-italic"
    >
      {entryMealNames.get(currentEntryId)}
    </Link>
  </p>
) : ...
```

**2. WeightItemsTable.tsx**

Update the saved routine display (already has `Link` import):

```tsx
// Update lines 592-601
{currentEntryId && entryRoutineNames?.get(currentEntryId) ? (
  <p className="text-sm text-muted-foreground italic">
    From saved routine:{' '}
    <Link 
      to="/settings" 
      className="text-blue-600 dark:text-blue-400 hover:underline not-italic"
    >
      {entryRoutineNames.get(currentEntryId)}
    </Link>
  </p>
) : ...
```

---

### Technical Details

**Styling breakdown:**
- Entire `<p>` has `italic` class for the prefix text
- Link uses `not-italic` to keep the name in normal weight for emphasis
- Removed `font-medium` since contrast comes from the italic/not-italic distinction
- Link retains blue color and hover underline for clickability

**Files to modify:**
1. `src/components/FoodItemsTable.tsx` - Add Link import + update format
2. `src/components/WeightItemsTable.tsx` - Update format

