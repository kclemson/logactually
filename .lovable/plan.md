

# Fix target deficit input alignment

## Problem

The right-side column widths differ between BiometricsInputs rows (`w-[8.5rem]`) and the target deficit row (`w-[11rem]`). The deficit row is wider to accommodate "minus" and "cal/day" labels, but this pushes the input box a few pixels to the left compared to the inputs above it.

## Solution

Unify the right column width. The deficit row needs the most space (it has "minus", input, and "cal/day"), so we should widen BiometricsInputs' `rightColClass` to match. Since both components render in the same dialog stacked vertically, they need the same right-column width for visual alignment.

## Technical details

| File | Change |
|---|---|
| `src/components/BiometricsInputs.tsx` | Change `rightColClass` from `w-[8.5rem]` to `w-[11rem]` |

This single change aligns all four biometrics rows (Body weight, Height, Age, Metabolic profile) with the Target deficit row below them.

