

## Fix NaN Labels on Blood Pressure Chart

### Problem
The `createFoodLabelRenderer` in `FoodChart.tsx` calls `Math.round(value)` on the `bpLabel` field, which is a string like `"120/80"`. This produces `NaN`.

### Fix

**File: `src/components/trends/FoodChart.tsx`** (line 64)

Change:
```typescript
{labelFormatter ? labelFormatter(value) : Math.round(value)}
```

To:
```typescript
{typeof value === 'string' ? value : (labelFormatter ? labelFormatter(value) : Math.round(value))}
```

This detects string values (like `"120/80"`) and renders them directly, while preserving the existing numeric formatting for all other charts.

### Files to modify
- `src/components/trends/FoodChart.tsx` -- one line change in `createFoodLabelRenderer`
