

## Reverse CSV Export Order (Most Recent First)

### Overview

All three CSV export functions currently sort data in ascending order (oldest first). This change will reverse the sort to descending order so the most recent entries appear at the top of the file.

---

### Changes

#### `src/lib/csv-export.ts`

**1. Daily Totals (line 50)**

Current:
```typescript
.sort(([a], [b]) => a.localeCompare(b))
```

Updated:
```typescript
.sort(([a], [b]) => b.localeCompare(a))
```

**2. Food Log (lines 82-87)**

Current:
```typescript
const sorted = [...entries].sort((a, b) => {
  if (a.eaten_date !== b.eaten_date) {
    return a.eaten_date.localeCompare(b.eaten_date);
  }
  return a.created_at.localeCompare(b.created_at);
});
```

Updated:
```typescript
const sorted = [...entries].sort((a, b) => {
  if (a.eaten_date !== b.eaten_date) {
    return b.eaten_date.localeCompare(a.eaten_date);
  }
  return b.created_at.localeCompare(a.created_at);
});
```

**3. Weight Log (lines 141-146)**

Current:
```typescript
const sorted = [...sets].sort((a, b) => {
  if (a.logged_date !== b.logged_date) {
    return a.logged_date.localeCompare(b.logged_date);
  }
  return a.created_at.localeCompare(b.created_at);
});
```

Updated:
```typescript
const sorted = [...sets].sort((a, b) => {
  if (a.logged_date !== b.logged_date) {
    return b.logged_date.localeCompare(a.logged_date);
  }
  return b.created_at.localeCompare(a.created_at);
});
```

---

### Summary

| Export Function | Change |
|-----------------|--------|
| `exportDailyTotals` | Reverse date sort: `a.localeCompare(b)` → `b.localeCompare(a)` |
| `exportFoodLog` | Reverse both date and time sort |
| `exportWeightLog` | Reverse both date and time sort |

The fix is simply swapping `a` and `b` in the comparison functions to reverse the sort order from ascending to descending.

