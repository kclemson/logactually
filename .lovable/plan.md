

# Revert clipping fix and remove "cal" suffix

## Problem

The `whitespace-nowrap overflow-hidden` fix clips off the colored dot on most days. A simpler approach: remove the "cal" text to free up horizontal space naturally.

## Changes

**File: `src/pages/History.tsx`**

1. **Revert the overflow fix** (line 358): Change back from `"text-[9px] sm:text-[10px] w-full text-center whitespace-nowrap overflow-hidden"` to `"text-[10px]"` (original styling).

2. **Remove "cal" from the display string** (line 366): Change `${Math.round(summary.totalCalories).toLocaleString()}cal` to just `${Math.round(summary.totalCalories).toLocaleString()}` -- the number alone is enough context, especially with the tooltip available.

3. **Revert dot font size** (line 372): Change `text-[9px] sm:text-[10px]` back to `text-[10px]`.

These are the only changes needed -- just two lines reverted and one string shortened.

