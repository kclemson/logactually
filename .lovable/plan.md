

## Add Simple Loading Overlay for Day Navigation

Show a centered spinner in the content area while data is loading during day navigation, preventing the brief "empty day" flash.

---

### Overview

| Current | Proposed |
|---------|----------|
| Shows "No entries logged" during fetch | Shows spinner during fetch |
| Brief flash before data appears | Smooth loading transition |

---

### Technical Changes

#### 1. Update FoodLog.tsx

Add a loading state check before the empty message:

```tsx
// Current logic:
{displayItems.length > 0 && <FoodItemsTable ... />}
{displayItems.length === 0 && !isAnalyzing && <EmptyMessage />}

// New logic:
{displayItems.length > 0 && <FoodItemsTable ... />}

{displayItems.length === 0 && isFetching && (
  <div className="flex justify-center py-8">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
)}

{displayItems.length === 0 && !isFetching && !isAnalyzing && (
  <EmptyMessage />
)}
```

#### 2. Update WeightLog.tsx

Same pattern:

```tsx
{displayItems.length > 0 && <WeightItemsTable ... />}

{displayItems.length === 0 && isFetching && (
  <div className="flex justify-center py-8">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
)}

{displayItems.length === 0 && !isFetching && !isAnalyzing && (
  <div className="text-center text-muted-foreground py-8">
    No exercises logged for this day
  </div>
)}
```

---

### Behavior

- **Navigating to a day with data**: Spinner shows briefly, then table appears
- **Navigating to an empty day**: Spinner shows briefly, then "No entries" message appears  
- **When data is cached**: No spinner (React Query returns cached data immediately)

---

### Files Changed

| File | Changes |
|------|---------|
| `src/pages/FoodLog.tsx` | Add loading spinner condition before empty message |
| `src/pages/WeightLog.tsx` | Add loading spinner condition before empty message |

