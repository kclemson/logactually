

# Coordinate tooltip dismissal between rollup and calendar day cells

## Problem

On mobile in the Calendar view, tapping a calendar day while the rollup tooltip is open (or vice versa) leaves both tooltips visible simultaneously. Each tooltip manages its own state independently with no cross-communication.

## Solution

Lift the rollup tooltip state up to the History page so that any tap interaction can close all tooltips:

1. **History.tsx** -- pass a `dismissTooltip` callback and controlled open state down to `CalorieTargetRollup`
2. **CalorieTargetRollup.tsx** -- accept optional external tooltip control props
3. **History.tsx** -- when a day cell is tapped, also close the rollup tooltip; when the rollup is tapped, also close any active day tooltip

## Technical details

### CalorieTargetRollup.tsx

Add optional props for external tooltip control:

```tsx
interface CalorieTargetRollupProps {
  settings: UserSettings;
  burnByDate: Map<string, number>;
  usesBurns: boolean;
  tooltipOpen?: boolean;
  onTooltipToggle?: () => void;
}
```

When these props are provided, use them instead of local state. When not provided, fall back to local `useState` (backward compatible).

### History.tsx

- Add `rollupTooltipOpen` state alongside the existing `activeDayIndex`
- Create a helper that clears both: setting `activeDayIndex` to null and `rollupTooltipOpen` to false
- In `handleDayClick`: close rollup tooltip before toggling day tooltip
- Pass `tooltipOpen` and `onTooltipToggle` to `CalorieTargetRollup`, where the toggle clears `activeDayIndex` before toggling `rollupTooltipOpen`
- Update the fixed dismiss overlay to also close the rollup tooltip

