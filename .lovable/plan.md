

## Simplify "Logged as:" Styling

### Overview
Remove quotes and make the entire "Logged as:" line uniformly italic, matching the clean style of "From saved meal:" labels.

---

### Current vs New Format

| Current | New |
|---------|-----|
| *Logged as:* "italian dry salame 5 pieces" | *Logged as: italian dry salame 5 pieces* |
| *Logged as:* "Scanned barcode: 030000578339" | *Logged as: Scanned barcode: 030000578339* |

---

### Implementation

**1. Update `src/components/FoodItemsTable.tsx`** (around line 630)

Change from:
```tsx
<p className="text-sm text-muted-foreground italic">
  Logged as:{' '}<span className="not-italic">"{currentRawInput}"</span>
</p>
```

To:
```tsx
<p className="text-sm text-muted-foreground italic">
  Logged as: {currentRawInput}
</p>
```

**2. Update `src/components/WeightItemsTable.tsx`** (around line 657)

Same change:
```tsx
<p className="text-sm text-muted-foreground italic">
  Logged as: {currentRawInput}
</p>
```

---

### Files Changed
| File | Change |
|------|--------|
| `src/components/FoodItemsTable.tsx` | Remove quotes and `not-italic` span |
| `src/components/WeightItemsTable.tsx` | Remove quotes and `not-italic` span |

