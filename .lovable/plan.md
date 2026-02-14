

## Fix Blood Pressure Chart Height

### Problem
The `dual_numeric` (Blood Pressure) chart uses `h-32` height while all other custom log charts use the default `h-24`, causing visual misalignment in the grid.

### Change
**File: `src/pages/Trends.tsx`, line 522**

Change `height="h-32"` to remove the height override (defaults to `h-24`), or explicitly set `height="h-24"`.

Everything else -- grouped bars, rotated labels, colors -- stays exactly as-is.
