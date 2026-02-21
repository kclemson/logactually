

# Fix "Go to day" Tap on Mobile Trend Tooltips

## Problem
On mobile, tapping "Go to day" in a chart tooltip dismisses the tooltip instead of navigating. The dismiss overlay (`z-30`) sits above the chart content container (`z-20`), so it intercepts all taps -- including those on the tooltip button.

## Root Cause
In `ChartCard.tsx` (and identically in `CalorieBurnChart.tsx`), the z-index stacking is:
- Dismiss overlay: `z-30` (catches taps to close tooltip)
- Content (including tooltip): `z-20`

Since z-30 > z-20, the overlay covers the tooltip button. The fix is to raise the content above the overlay so taps on the chart/tooltip go to the content, while taps outside the card still hit the overlay.

## Fix

### 1. `src/components/trends/ChartCard.tsx`
Change the content wrapper from `z-20` to `z-40` (line 52):
```
- <div className="relative z-20">
+ <div className="relative z-40">
```

### 2. `src/components/trends/CalorieBurnChart.tsx`
Same change -- content wrapper from `z-20` to `z-40` (line 127):
```
- <div className="relative z-20">
+ <div className="relative z-40">
```

## Why This Works
- Taps on the chart content (bars, tooltip, "Go to day" button) hit the `z-40` content layer
- Taps outside the card hit the `z-30` fixed overlay, dismissing the tooltip
- The Card's outer `z-50` (applied when tooltip is active) still elevates the entire card above neighboring cards
