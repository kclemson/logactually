
# Revert equation number size and fix daily tooltip result row

Two changes to make the equation tooltips consistent across both the rollup and daily views.

## 1. Revert rollup equation number font size

In `CalorieTargetRollup.tsx`, remove `text-[9px]` from all six number divs (lines 41, 43, 48, 50, 54, 60), restoring them to the default tooltip font size. The principle: numbers are primary data (default size, full opacity), labels are secondary annotations (`text-[9px]`, italic, 60% opacity).

## 2. Fix the daily tooltip result row in History.tsx

Currently (line 281-282), the bottom result row is a standalone `<div>` outside the grid:

```
<div className="border-t border-primary-foreground/20 pt-1 pl-2 tabular-nums">
  1,983 adjusted daily calorie target
</div>
```

This doesn't match the equation rows above it. Change it to sit inside the same two-column grid, using the same pattern as the rollup tooltip:

- Number on the left: `= 1,983`
- Label on the right: `adjusted daily calorie target` (or `daily calorie target`)
- Both separated by the top border
- The label uses `text-[9px] italic opacity-60` like the other labels
- The number uses default size like the other numbers

This means moving the result row inside the grid (before the closing `</div>` of the grid on line 280) and removing the separate `<div>` on lines 281-283.

## Files to edit

- `src/components/CalorieTargetRollup.tsx` -- revert `text-[9px]` on number divs
- `src/pages/History.tsx` -- restructure result row into the equation grid
