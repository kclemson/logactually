
## Option B: Keep Portion as Separate Field with Smaller Font

### Overview
Instead of merging `name` and `portion` into a single `description` string, we'll keep `portion` as a separate optional field in the data model. At render time, we'll display the portion in smaller, muted text. If the user edits the description, we clear the portion field.

---

### Data Model Changes

**File: `src/types/food.ts`**

Add an optional `portion` field to FoodItem:

```typescript
export interface FoodItem {
  uid: string;
  entryId?: string;
  description: string;  // Just the food name, e.g. "Cheese Pizza"
  portion?: string;     // NEW: Optional portion, e.g. "1 slice"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  editedFields?: EditableField[];
  confidence?: 'high' | 'medium' | 'low';
  source_note?: string;
}
```

---

### Edge Function Changes

**File: `supabase/functions/analyze-food/index.ts`**

1. Remove the `\u200B` zero-width space (line 162)
2. Send `description` (just name) and `portion` as separate fields:

```typescript
// Before (line 161-162):
const mergedItems: FoodItem[] = parsed.food_items.map(item => ({
  description: item.portion ? `${item.name} \u200B(${item.portion})` : item.name,
  ...

// After:
const mergedItems: FoodItem[] = parsed.food_items.map(item => ({
  description: item.name,
  portion: item.portion || undefined,
  ...
```

**File: `supabase/functions/lookup-upc/index.ts`**

Same pattern - send separate fields instead of merging:

```typescript
// Lines 117-118: Remove \u200B, add portion field
return new Response(
  JSON.stringify({
    description: productName,
    portion: servingSize,
    ...

// Lines 220-221: Same for AI fallback
description: parsed.name,
portion: parsed.serving || '1 serving',
```

---

### UI Changes

**File: `src/components/FoodItemsTable.tsx`**

Render the portion in smaller, muted font after the description:

**For editable rows:**
- Show description in contentEditable as before
- Show portion in a non-editable `<span>` with smaller font after
- When user edits description (blur with changes OR Enter with changes), clear `item.portion`

**For non-editable rows:**
- Show description normally
- Show portion in smaller muted text inline

```tsx
// Example rendering (conceptual):
<div className="flex items-baseline flex-wrap min-w-0">
  <span>{item.description}</span>
  {item.portion && (
    <span className="text-xs text-muted-foreground ml-1">({item.portion})</span>
  )}
</div>
```

**Clear portion on edit:**
When description is successfully saved (Enter key), also clear the portion:

```typescript
// In handleDescriptionKeyDown, after saving:
if (item.portion) {
  onUpdateItem?.(index, 'portion', '');  // Clear portion
}
```

---

### Technical Details

**Backward Compatibility:**
- Existing items in the database have combined description (e.g., "Coffee (12oz)")
- These will render fine - just no separate `portion` field, so no small text shown
- New items will have the split format going forward

**Wrapping Behavior:**
- The smaller font naturally makes the portion part shorter
- Combined with flex-wrap, the portion will wrap to the next line when space is tight
- This achieves the visual de-emphasis goal while fixing most wrapping issues

**Edit Behavior:**
- User can only edit the description (name) part
- If they want to change the portion, they can edit the description to include it
- On any edit save, portion is cleared to prevent stale data

---

### Files to Change

| File | Change |
|------|--------|
| `src/types/food.ts` | Add optional `portion?: string` field to FoodItem |
| `supabase/functions/analyze-food/index.ts` | Remove `\u200B`, send `description` and `portion` as separate fields |
| `supabase/functions/lookup-upc/index.ts` | Same - send separate fields (2 locations) |
| `src/components/FoodItemsTable.tsx` | Render portion in smaller muted text; clear portion on description edit |

---

### Summary

This approach:
1. **Removes the failed zero-width space complexity** from edge functions
2. **Visually de-emphasizes the portion** with smaller font, improving readability
3. **Helps with wrapping** since smaller text takes less space
4. **Keeps editing simple** - user edits description only, portion clears if changed
5. **Is backward compatible** - existing data still works, just without the visual split
