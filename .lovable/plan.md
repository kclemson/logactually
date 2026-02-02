

## Surgical Fix: Include Micros in Placeholder Filter

### Problem
The current filter discards items where all macros are zero, which incorrectly removes zero-calorie items like Diet Coke that have micronutrients.

### Solution
Extend the existing OR chain to include micronutrients. An item is valid if ANY nutritional value is non-zero.

---

### File Changed

| File | Change |
|------|--------|
| `supabase/functions/analyze-food/index.ts` | Extend filter to include micros |

---

### Code Change

**Line ~183, current:**
```typescript
const validItems = mergedItems.filter(item => 
  item.calories > 0 || item.protein > 0 || item.carbs > 0 || item.fat > 0
);
```

**Updated:**
```typescript
const validItems = mergedItems.filter(item => 
  item.calories > 0 || 
  item.protein > 0 || 
  item.carbs > 0 || 
  item.fat > 0 ||
  (item.fiber || 0) > 0 ||
  (item.sugar || 0) > 0 ||
  (item.saturated_fat || 0) > 0 ||
  (item.sodium || 0) > 0 ||
  (item.cholesterol || 0) > 0
);
```

---

### Why This Works

| Item | Passes? | Why |
|------|---------|-----|
| Diet Coke (0 cal, 30mg sodium) | ✓ | sodium > 0 |
| Big Mac (563 cal) | ✓ | calories > 0 |
| Medium Fries (320 cal) | ✓ | calories > 0 |
| True placeholder (all zeros) | ✗ | Correctly filtered |

