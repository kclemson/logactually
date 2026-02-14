

## Fix Misaligned Labels on Grouped Bar Charts (Body Measurements)

The rotated text labels inside grouped bars (e.g., "Chest", "Waist") appear shifted horizontally relative to their bars. This happens because the text baseline sits at the bar center (`cx`) rather than the text's visual center.

### Root Cause

In `createGroupedBarLabelRenderer` (FoodChart.tsx, line 30), the rotated label uses default `dominantBaseline` which aligns the text baseline (bottom of letters) to `cx`. After the -90 degree rotation, this baseline offset shifts the text sideways.

### Fix

Add `dominantBaseline="central"` to the rotated text element on line 30. This centers the text glyph on the rotation pivot point (`cx`) so labels sit squarely within their bars.

### Technical Details

**File:** `src/components/trends/FoodChart.tsx`

**Change (line 30):**
```tsx
// Before
<text x={cx} y={y + barHeight - 6} fill="white" textAnchor="start" fontSize={7} fontWeight={500}
  transform={`rotate(-90, ${cx}, ${y + barHeight - 6})`}>

// After
<text x={cx} y={y + barHeight - 6} fill="white" textAnchor="start" dominantBaseline="central" fontSize={7} fontWeight={500}
  transform={`rotate(-90, ${cx}, ${y + barHeight - 6})`}>
```

Single line change, no functional impact beyond visual alignment.

