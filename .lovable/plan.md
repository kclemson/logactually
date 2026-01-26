
## Simplify Smart Text Wrapping: Write-Time Approach

### Current State (Remove)
The current implementation adds complexity at render-time:
- `addBreakHintToDescription()` function in FoodItemsTable
- `formatDescriptionWithBreakHint()` JSX helper  
- Special ref logic for contentEditable

### New Approach (Simple)
Insert the zero-width space character (`\u200B`) at the **single point where descriptions are created** - in the edge functions that compose them.

---

### Code Changes

**1. Remove runtime complexity from `src/components/FoodItemsTable.tsx`:**
- Delete `addBreakHintToDescription` function (lines 77-84)
- Delete `formatDescriptionWithBreakHint` function (lines 86-95)
- Revert the contentEditable ref to use plain `item.description`
- Revert the non-editable cell to use plain `item.description`

**2. Add break hint in `supabase/functions/analyze-food/index.ts` (line 162):**
```typescript
// Before:
description: item.portion ? `${item.name} (${item.portion})` : item.name,

// After:
description: item.portion ? `${item.name} \u200B(${item.portion})` : item.name,
```

**3. Add break hint in `supabase/functions/lookup-upc/index.ts` (lines 118, 221):**
```typescript
// Line 118 - Before:
description: `${productName} (${servingSize})`,

// Line 118 - After:
description: `${productName} \u200B(${servingSize})`,

// Line 221 - Before:  
description: `${parsed.name} (${parsed.serving || '1 serving'})`,

// Line 221 - After:
description: `${parsed.name} \u200B(${parsed.serving || '1 serving'})`,
```

---

### Why This is Better

| Aspect | Runtime Approach | Write-Time Approach |
|--------|------------------|---------------------|
| Lines of code | ~25 lines in component | 3 one-character additions |
| Fragility | contentEditable complexity | None - data is just data |
| Maintenance | Multiple code paths | Single source of truth |
| Existing data | Works | Won't have break hint |

---

### Trade-off: Existing Data
Food items already in the database won't have the break hint. This is acceptable because:
- New entries will have it going forward
- It's purely cosmetic - no functional impact
- A one-time migration could add it if desired later

---

### Files to Change

| File | Change |
|------|--------|
| `src/components/FoodItemsTable.tsx` | Remove `addBreakHintToDescription`, `formatDescriptionWithBreakHint`, revert ref and cell rendering |
| `supabase/functions/analyze-food/index.ts` | Add `\u200B` before `(` in description template |
| `supabase/functions/lookup-upc/index.ts` | Add `\u200B` before `(` in both description templates |
