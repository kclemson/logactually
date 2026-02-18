

# Fix right-edge clipping in food detail dialog

## Problem

The unit text ("mg", "g") on the right column's fields is clipped off the right edge of the dialog on mobile. The root cause is that the label minimum width (`min-w-[5.5rem]` = 88px) is wider than needed -- there's visible dead space between the longest label text and the input box.

## Fix

Reduce `labelClassName` from `min-w-[5.5rem]` to `min-w-[5rem]` (80px) in both `DetailDialog` usages in `FoodLog.tsx`. This reclaims 16px total (8px per column), which is enough to keep the right column's unit labels on-screen. "Saturated Fat:" (the longest label) still fits comfortably at 80px.

## Technical details

**File: `src/pages/FoodLog.tsx`** -- two occurrences (around lines 875 and 892)

Change:
```
labelClassName="min-w-[5.5rem]"
```
To:
```
labelClassName="min-w-[5rem]"
```

Two-line change in one file.

