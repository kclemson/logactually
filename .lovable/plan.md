
# Make equation numbers match label font size

Currently the number values (1,500, + 355, = 1,855) use the default tooltip font size, while the labels use `text-[9px]`. The goal is to make the numbers the same `text-[9px]` size so the whole equation block is visually uniform and compact.

## Changes

**File: `src/components/CalorieTargetRollup.tsx`**

Add `text-[9px]` to the number divs in the equation grid (lines 41, 43, 48, 50, 54, 60) so they match the label size. The result line (line 60) also gets `text-[9px]`.

Specifically, every `<div className="text-right">` inside the equation block becomes `<div className="text-right text-[9px]">`, and the result line similarly gets `text-[9px]` added.
