

## Fix Interval-Based Labels for All Charts

### Problem Analysis
After investigating with the browser and database:

1. **The logic is working** - the food charts DO use interval-based label visibility via `createFoodLabelRenderer` which checks `showLabel`
2. **The thresholds are too lenient** - Current thresholds (≤12 → all, 13-20 → every 2nd, >20 → every 3rd) result in too many labels when there are 30-60+ data points
3. **With 62 days of food data at every 3rd label = ~20 labels** - still very crowded

### Solution
Update the thresholds to be more aggressive, matching what looks good visually:

- ≤7 → show all labels  
- 8-14 → show every 2nd
- 15-21 → show every 3rd
- 22-35 → show every 4th
- \>35 → show every 5th

This ensures no more than ~7-8 labels ever appear, preventing visual clutter.

---

### Technical Changes

#### 1. Update Food Chart Thresholds (lines 358-365)

```tsx
// Current (too lenient):
const labelInterval = dataLength <= 12 ? 1 : dataLength <= 20 ? 2 : 3;

// New (more aggressive):
const labelInterval = 
  dataLength <= 7 ? 1 :
  dataLength <= 14 ? 2 :
  dataLength <= 21 ? 3 :
  dataLength <= 35 ? 4 : 5;
```

#### 2. Update Total Volume Chart Thresholds (lines 310-312)

Apply the same updated thresholds to the weight volume chart for consistency:

```tsx
// Current:
const labelInterval = dataLength <= 12 ? 1 : dataLength <= 20 ? 2 : 3;

// New:
const labelInterval = 
  dataLength <= 7 ? 1 :
  dataLength <= 14 ? 2 :
  dataLength <= 21 ? 3 :
  dataLength <= 35 ? 4 : 5;
```

---

### Result
- All charts will show at most ~7-8 labels regardless of how many data points exist
- Labels remain readable and well-spaced even with 30, 60, or 90 days of data
- Consistent behavior across food and weight charts
- First and last data points always show labels (ensures the range is clear)

