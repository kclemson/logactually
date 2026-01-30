

## Add Full-Width Label Thresholds for Combined Chart

A simple change to use different (more generous) thresholds for full-width charts since they have roughly 2x the horizontal space.

### Current State

All charts use the same `showLabel` thresholds:
- ≤7 days: show all
- 8-14 days: every 2nd
- 15-21 days: every 3rd
- 22-35 days: every 4th
- >35 days: every 5th

### Proposed Change

Add a `showLabelFullWidth` field with ~2x thresholds:
- ≤14 days: show all
- 15-28 days: every 2nd
- 29-42 days: every 3rd
- 43-70 days: every 4th
- >70 days: every 5th

### File Changes

**`src/pages/Trends.tsx`**

1. **Extend `chartData` calculation** (lines 397-408) to add `showLabelFullWidth`:

```tsx
const labelInterval = 
  dataLength <= 7 ? 1 :
  dataLength <= 14 ? 2 :
  dataLength <= 21 ? 3 :
  dataLength <= 35 ? 4 : 5;

// Full-width charts have ~2x horizontal space
const labelIntervalFullWidth = 
  dataLength <= 14 ? 1 :
  dataLength <= 28 ? 2 :
  dataLength <= 42 ? 3 :
  dataLength <= 70 ? 4 : 5;

return data.map((d, index) => ({
  ...d,
  showLabel: index % labelInterval === 0 || index === dataLength - 1,
  showLabelFullWidth: index % labelIntervalFullWidth === 0 || index === dataLength - 1,
}));
```

2. **Update `createFoodLabelRenderer`** to accept which field to check, OR create a separate version for full-width charts that checks `showLabelFullWidth` instead of `showLabel`.

3. **Use `showLabelFullWidth`** in the Combined Calories + Macros chart's `LabelList`.

### Result

- Half-width charts (Calories, Macro Split, Protein, Carbs, Fat): Use existing thresholds
- Full-width charts (Combined Calories + Macros, Total Volume): Use more generous thresholds
- At 30 days: half-width shows every 4th label, full-width shows every 2nd label

### Effort Estimate

**Very easy** - about 10 lines of code change. Just need to:
1. Add one more interval calculation
2. Add one more field to the mapped data
3. Point the combined chart's label renderer at the new field

