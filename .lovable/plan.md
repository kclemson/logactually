
## Fix: Preserve `portion` Field When Fetching Food Entries

### The Problem
The edge function correctly returns `description` and `portion` as separate fields. These are saved to the database. However, when fetching entries back from the database in `useFoodEntries.ts`, the data mapping doesn't include the `portion` field - it gets dropped.

### Root Cause
Lines 30-40 in `src/hooks/useFoodEntries.ts`:
```typescript
const itemsWithIds: FoodItem[] = rawItems.map((item) => ({
  description: item.description || ...,
  calories: item.calories || 0,
  protein: item.protein || 0,
  carbs: item.carbs || 0,
  fat: item.fat || 0,
  uid: item.uid || crypto.randomUUID(),
  entryId: entry.id,
  editedFields: item.editedFields,
  // ❌ portion is NOT included here!
}));
```

### The Fix
Add `portion: item.portion` to the mapping:

```typescript
const itemsWithIds: FoodItem[] = rawItems.map((item) => ({
  description: item.description || (item.portion ? `${item.name} (${item.portion})` : (item.name || '')),
  portion: item.portion,  // ✅ ADD THIS LINE
  calories: item.calories || 0,
  protein: item.protein || 0,
  carbs: item.carbs || 0,
  fat: item.fat || 0,
  uid: item.uid || crypto.randomUUID(),
  entryId: entry.id,
  editedFields: item.editedFields,
}));
```

### Files to Change

| File | Change |
|------|--------|
| `src/hooks/useFoodEntries.ts` | Add `portion: item.portion` to the food item mapping (line ~39) |

### After This Fix
- Newly added items will show the portion in smaller muted text
- The portion will be preserved when fetching from database
- The existing items without a separate `portion` field will continue to work (portion will just be undefined)
