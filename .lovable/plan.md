
## Tune Weight Chart Label Thresholds & Remove Grid Lines

Two changes to improve the Weight Trends chart appearance:

---

### Change 1: Adjust Label Thresholds

**Current logic (line 56):**
```tsx
const labelInterval = dataLength <= 8 ? 1 : dataLength <= 16 ? 2 : 3;
```

**New logic:**
```tsx
const labelInterval = dataLength <= 12 ? 1 : dataLength <= 20 ? 2 : 3;
```

| Column Count | Old Behavior | New Behavior |
|--------------|--------------|--------------|
| 1-8 bars | Every label | Every label |
| 9-12 bars | Every 2nd | Every label |
| 13-16 bars | Every 2nd | Every 2nd |
| 17-20 bars | Every 3rd | Every 2nd |
| 21+ bars | Every 3rd | Every 3rd |

---

### Change 2: Remove Dashed Grid Lines from Weight Charts

**Current (line 125):**
```tsx
<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
```

**Fix:** Simply remove this line from the `ExerciseChart` component.

This removes the dashed horizontal lines in the background of weight charts while keeping them in the food charts (if desired).

---

### Files to Modify

**src/pages/Trends.tsx**
- Line 56: Update threshold from `8` to `12` and from `16` to `20`
- Line 125: Delete the `<CartesianGrid ... />` line

---

### Result

- Weight charts with 12 or fewer bars will show all labels
- Weight charts will have a cleaner look without the dashed grid lines
- Food charts remain unchanged (keep their grid lines)
