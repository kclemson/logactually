

# Show decimal precision on Body Weight trend chart labels

## Problem
The Body Weight chart labels always round to integers (e.g., "185" instead of "185.2") because the shared bar chart component (`FoodChart`) hardcodes `Math.round(value)` in its label renderer.

## Why FoodChart is involved
Despite the name, `FoodChart` is a generic reusable bar chart. `CustomLogTrendChart` delegates to it for all single-series numeric charts including Body Weight (line 78). The label rendering logic lives inside `FoodChart`, so a small extension there is unavoidable.

## Changes

### 1. `src/components/trends/FoodChart.tsx`
- Add one optional prop: `labelFormatter?: (value: number) => string`
- Pass it into `createFoodLabelRenderer`; when provided, use it instead of `Math.round(value)`
- No existing callers are affected (they don't pass the prop, so behavior is unchanged)

### 2. `src/components/trends/CustomLogTrendChart.tsx`
- For the single-series numeric branch (line 76-86), check if any data point has a fractional part
- If yes, pass `labelFormatter={(v) => v.toFixed(1)}` to `FoodChart`
- If all values are integers, don't pass it (keeps current rounding behavior)

No other files change. All existing food/macro/exercise charts remain untouched.
