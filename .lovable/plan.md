

## Apply Full-Width Label Thresholds to Total Volume Chart

The Total Volume chart is also full-width but currently uses the regular label thresholds. This needs to be updated to use the more generous full-width thresholds for consistency.

### Current State (lines 339-350)

The `volumeByDay` calculation only computes `showLabel` using the regular interval:
- ≤7 days: show all
- 8-14 days: every 2nd
- 15-21 days: every 3rd
- 22-35 days: every 4th
- >35 days: every 5th

### Changes Required

**File: `src/pages/Trends.tsx`**

#### 1. Update `volumeByDay` calculation (lines 339-350)

Add `showLabelFullWidth` with the more generous thresholds:

```tsx
// Add showLabel based on interval
const dataLength = entries.length;
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

return entries.map((d, index) => ({
  ...d,
  showLabel: index % labelInterval === 0 || index === dataLength - 1,
  showLabelFullWidth: index % labelIntervalFullWidth === 0 || index === dataLength - 1,
}));
```

#### 2. Update Total Volume chart's LabelList (line 736)

Change from `showLabel` to `showLabelFullWidth`:

```tsx
if (!dataPoint?.showLabelFullWidth) return null;
```

### Result

Both full-width charts (Combined Calories + Macros and Total Volume) will now use the same generous label thresholds, showing more labels since they have the horizontal space for it.

