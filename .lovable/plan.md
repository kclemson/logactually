

## Fix Chart Clipping on Mobile - Food and Weight Trends

Both the Food Trends and Weight Trends sections have `-ml-4` (negative left margin) classes that push content outside the visible container, causing clipping on mobile screens.

---

### Root Cause

The `-ml-4` class was applied to align content visually but doesn't account for the container's edge on mobile, causing left-side clipping.

---

### All Locations to Fix

| Line | Element | Current Class | Fix |
|------|---------|---------------|-----|
| 209 | Average stats grid | `grid grid-cols-4 gap-2 -ml-4` | Remove `-ml-4` |
| 225 | Food loading spinner | `flex justify-center py-8 -ml-4` | Remove `-ml-4` |
| 229 | Food empty state | `py-8 text-center text-muted-foreground -ml-4` | Remove `-ml-4` |
| 233 | Food charts container | `space-y-3 -ml-4` | Remove `-ml-4` |
| 338 | Weight loading spinner | `flex justify-center py-8 -ml-4` | Remove `-ml-4` |
| 342 | Weight empty state | `py-8 text-center text-muted-foreground -ml-4` | Remove `-ml-4` |
| 346 | Weight charts container | `space-y-3 -ml-4` | Remove `-ml-4` |

---

### Additional Weight Trends Improvements

While fixing the clipping, also update the `ExerciseChart` header to handle long exercise names better:

**Current (lines 66-72):**
```tsx
<CardHeader className="p-2 pb-1">
  <CardTitle className="text-sm font-semibold flex justify-between">
    <span>{exercise.description}</span>
    <span className="text-muted-foreground font-normal text-xs">
      Max: {exercise.maxWeight} lbs
    </span>
  </CardTitle>
</CardHeader>
```

**New:**
```tsx
<CardHeader className="p-2 pb-1">
  <CardTitle className="text-xs font-semibold flex flex-col gap-0.5">
    <span className="truncate">{exercise.description}</span>
    <span className="text-muted-foreground font-normal text-[10px]">
      Max: {exercise.maxWeight} lbs
    </span>
  </CardTitle>
</CardHeader>
```

Changes:
- `text-sm` → `text-xs` for tighter title
- `flex justify-between` → `flex flex-col gap-0.5` for vertical stacking
- Add `truncate` to prevent long names from overflowing
- `text-xs` → `text-[10px]` for the max weight subtitle

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Trends.tsx` | Remove all 7 instances of `-ml-4`, update ExerciseChart header layout |

