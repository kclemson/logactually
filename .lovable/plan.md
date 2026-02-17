

# Tooltip styling fixes

## Changes in `src/components/CalorieTargetTooltipContent.tsx`

### 1. Remove bold and bright white from header rows
Both the day header ("Tue, Feb 10: 1,458 cal") and the week header ("Week of Feb 8-14: 1,805 avg") currently use `font-medium` which makes them bold and bright white. Change both to use `opacity-75` instead, matching the muted color of the equation numbers. The blue intake value and colored dot will still stand out.

- Line 35: `font-medium` --> `opacity-75`
- Line 54: `font-medium` --> `opacity-75`

### 2. Remove the duplicate rollup dot legend
The second RYG legend block (lines 65-69, "at or under target / up to 5% over / more than 5% over") at the bottom of the weekly section will be removed entirely. The daily legend at the top is sufficient context for understanding both dots.

