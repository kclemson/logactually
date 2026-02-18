

# Reduce the asymmetric column ratio

## Problem

The `grid-cols-[3fr_2fr]` (60/40 split) makes the left column far too wide, causing right-column labels and values to get cut off or overflow horizontally.

## Solution

Change to a gentler ratio: `grid-cols-[6fr_5fr]` (~55/45). This gives the left column a slight edge for its wider fields (Distance with unit toggle, Cal Burned) without starving the right column.

## Changes

**`src/pages/WeightLog.tsx`**

- Line 774: `gridClassName="grid-cols-[3fr_2fr]"` -> `gridClassName="grid-cols-[6fr_5fr]"`
- Line 796: `gridClassName="grid-cols-[3fr_2fr]"` -> `gridClassName="grid-cols-[6fr_5fr]"`

Two line changes, same file.
