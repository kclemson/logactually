

# Remove section separator lines from tooltips

## Problem

Both tooltips now have three horizontal lines visible: one separating the daily/weekly (or weekly/30-day) sections, plus the underline on each equation's total row. That's too many lines competing for attention.

## Solution

Remove the full-width separator lines between sections, keeping only the underlines on the `= total` rows in the equation blocks. The legend row starting a new section (e.g., "weekly:" or "30-day:") already provides enough visual separation via the change in content.

## Technical detail

### `src/components/CalorieTargetTooltipContent.tsx`

- **Line 80**: Remove `<div className="border-t border-muted-foreground/30 my-1" />` (the separator between daily and weekly sections)
- Add a small top margin (e.g., `mt-2`) to the weekly section's container to keep some breathing room without a line

### `src/components/CalorieTargetRollup.tsx`

- **Line 158**: Remove `{r7 && r30 && <div className="border-t border-muted-foreground/30 my-1" />}` (the separator between 7-day and 30-day sections)
- Add a small top margin to the 30-day legend block for spacing

### No changes to equation blocks

The `border-t` on the `= total` line in `TargetEquation` and `renderEquationBlock` stays — that's the "underline in the math part" the user wants to keep.

