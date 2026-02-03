

## Italicize Full "From saved meal/routine" Line

### Overview
Update the "From saved meal:" and "From saved routine:" labels so the entire line is italicized (including the meal/routine name), while keeping the name styled in blue as a clickable link.

---

### Current vs New Format

| Current | New |
|---------|-----|
| *From saved meal:* Yogurt + strawberries | *From saved meal: Yogurt + strawberries* |
| *From saved routine:* Morning Stretch | *From saved routine: Morning Stretch* |

The meal/routine name remains blue and clickable, just now also italic.

---

### Implementation

**1. Update `src/components/FoodItemsTable.tsx`** (lines 640-647)

Remove `not-italic` from the Link and the "(deleted)" span:

```tsx
{mealName ? (
  <Link 
    to="/settings" 
    className="text-blue-600 dark:text-blue-400 hover:underline"
  >
    {mealName}
  </Link>
) : (
  <span>(deleted)</span>
)}
```

**2. Update `src/components/WeightItemsTable.tsx`** (lines 667-674)

Same change for routines:

```tsx
{routineName ? (
  <Link 
    to="/settings" 
    className="text-blue-600 dark:text-blue-400 hover:underline"
  >
    {routineName}
  </Link>
) : (
  <span>(deleted)</span>
)}
```

---

### Files Changed
| File | Change |
|------|--------|
| `src/components/FoodItemsTable.tsx` | Remove `not-italic` from meal name Link and deleted span |
| `src/components/WeightItemsTable.tsx` | Remove `not-italic` from routine name Link and deleted span |

