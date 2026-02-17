

# Fix calendar calorie row alignment on mobile

## Problem

The calorie count row (e.g. "1,583cal●") in each calendar day cell overflows horizontally. The text appears left-padded while the colored dot on the right spills past the cell edge. This is because the combined width of the calorie text plus the dot exceeds the narrow cell width on mobile, and there's no overflow control.

## Changes

**File: `src/pages/History.tsx`**

1. Add `whitespace-nowrap overflow-hidden w-full text-center` to the calorie row `<span>` (around line 357) so the content stays on one line, clips if too wide, and is centered within the cell.

2. Remove the `ml-0.5` margin on the dot `<span>` (line 372) to save horizontal space -- change to `ml-px` (1px) or remove entirely.

3. Optionally reduce the calorie text size from `text-[10px]` to `text-[9px]` on mobile to give more breathing room, though the overflow fix alone may suffice.

These are purely styling tweaks -- no logic changes.

