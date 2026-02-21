

# Fix "Go to day" on All Mobile Trend Chart Tooltips

## Problem
The previous fix only updated `ChartCard.tsx` and `CalorieBurnChart.tsx` to use `z-40` on the content wrapper. But `FoodChart.tsx` and `ExerciseChart.tsx` have their own inline Card layouts with the same bug: content at `z-20` sits below the dismiss overlay at `z-30`, so taps on the tooltip (including "Go to day") hit the overlay instead.

## Fix
Change `z-20` to `z-40` on every content wrapper in these two files:

### 1. `src/components/trends/FoodChart.tsx` -- 3 instances
- Line 134: `z-20` to `z-40` (first chart variant)
- Line 282: `z-20` to `z-40` (second chart variant)
- Line 439: `z-20` to `z-40` (third chart variant)

### 2. `src/components/trends/ExerciseChart.tsx` -- 1 instance
- Line 210: `z-20` to `z-40`

Each change is the same one-line edit:
```
- <div className="relative z-20">
+ <div className="relative z-40">
```

## Why the previous fix was incomplete
`ChartCard.tsx` is the shared wrapper used by `DynamicChart` (custom/saved charts) and `CalorieBurnChart`. But the built-in Food and Exercise charts render their own `<Card>` directly with the same overlay + content pattern, so they need the same fix applied independently.

